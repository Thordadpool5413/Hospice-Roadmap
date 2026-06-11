import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import express, { type Express } from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

/**
 * Integration-style test for the live SSE wiring in
 * src/routes/anthropic/index.ts. The pure action-detection functions in
 * ragnaActions.ts are unit-tested elsewhere (ragnaActions.test.ts); here we
 * verify the route actually:
 *   - feeds every streamed text delta through createActionStreamFilter,
 *   - forwards ONLY the cleaned prose to the client (never the raw JSON), and
 *   - emits the parsed action as exactly one trailing SSE event.
 *
 * The Anthropic stream is mocked so no real API call/key is needed. The db,
 * Clerk auth, and the premium entitlement gate are mocked at the module
 * boundary so the route logic runs end-to-end over real HTTP.
 */

// --- Mock the external boundaries (db, Clerk, Anthropic, entitlement gate) ---

const { mockStream, convRows, historyRows, insertValues, selectWhere, mockDb } =
  vi.hoisted(() => {
    // Holder the per-test stream factory writes into.
    const mockStream: { fn: (() => AsyncIterable<unknown>) | null } = {
      fn: null,
    };
    const convRows = [
      {
        id: 5,
        userId: "user-1",
        clientId: null,
        title: "Test conversation",
        createdAt: new Date(),
      },
    ];
    const historyRows = [
      {
        id: 1,
        conversationId: 5,
        role: "user",
        content: "hello",
        createdAt: new Date(),
      },
    ];
    const insertValues = vi.fn().mockResolvedValue(undefined);
    // `where()` returns an object that is BOTH awaitable (resolves to the
    // conversation rows, used by the ownership lookup) AND has `.orderBy()`
    // (resolves to the message history, used by the history lookup).
    const selectWhere = vi.fn(() => ({
      then: (resolve: (rows: unknown) => void) => resolve(convRows),
      orderBy: () => Promise.resolve(historyRows),
    }));
    const mockDb = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    return { mockStream, convRows, historyRows, insertValues, selectWhere, mockDb };
  });

vi.mock("@workspace/db", () => ({ db: mockDb }));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: "user-1" }),
}));

vi.mock("@workspace/integrations-anthropic-ai", () => ({
  anthropic: {
    messages: {
      stream: () => {
        if (!mockStream.fn) throw new Error("test did not set a stream");
        return mockStream.fn();
      },
    },
  },
}));

// The real middleware makes a RevenueCat network call; replace with pass-through.
vi.mock("../src/middlewares/requirePremium.js", () => ({
  requireEntitlement: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
}));

import anthropicRouter from "../src/routes/anthropic/index.js";

/** Build a mock Anthropic stream that yields the given text deltas in order. */
function streamOf(chunks: string[]): AsyncIterable<unknown> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text },
        };
      }
    },
  };
}

interface SseEvents {
  /** All `{ content }` payloads, in order. */
  contentEvents: string[];
  /** All `{ action }` payloads, in order. */
  actionEvents: unknown[];
  /** Whether a `{ done: true }` terminator arrived. */
  done: boolean;
  /** Raw concatenation of every `data:` payload (for negative assertions). */
  raw: string;
}

function parseSse(body: string): SseEvents {
  const out: SseEvents = {
    contentEvents: [],
    actionEvents: [],
    done: false,
    raw: body,
  };
  for (const block of body.split("\n\n")) {
    const line = block.trim();
    if (!line.startsWith("data:")) continue;
    const json = line.slice("data:".length).trim();
    if (!json) continue;
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (typeof payload["content"] === "string") {
      out.contentEvents.push(payload["content"]);
    }
    if ("action" in payload) {
      out.actionEvents.push(payload["action"]);
    }
    if (payload["done"] === true) out.done = true;
  }
  return out;
}

let app: Express;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  // Provide a no-op req.log so handlers that log don't crash without pino-http.
  app.use((req, _res, next) => {
    (req as unknown as { log: unknown }).log = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    next();
  });
  app.use(anthropicRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function postMessage(content: string): Promise<SseEvents> {
  const res = await fetch(`${baseUrl}/conversations/5/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  expect(res.status).toBe(200);
  return parseSse(await res.text());
}

describe("anthropic SSE route — Ragna action streaming wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertValues.mockResolvedValue(undefined);
    mockStream.fn = null;
  });

  it("strips a trailing action block (fence split across deltas) and emits exactly one parsed action", async () => {
    const prose = "Done — I'll remind you at 2pm tomorrow.\n\n";
    // The fence open/close tokens are deliberately split across delta
    // boundaries to exercise the incremental partial-fence detection.
    const deltas = [
      prose,
      "```ragna", // partial fence-open
      "-action\n", // completes fence-open
      '{ "action": "create_reminder", ',
      '"label": "Morphine dose", "datetime": "2026-06-12T14:00:00", ',
      '"reminderType": "medication", "recurrence": "daily" }\n',
      "``", // partial fence-close
      "`", // completes fence-close
    ];
    mockStream.fn = () => streamOf(deltas);

    const events = await postMessage("remind me to give morphine at 2pm tomorrow");

    // Prose is delivered intact...
    expect(events.contentEvents.join("")).toBe(prose);
    // ...and no content chunk ever leaked raw JSON or the fence marker.
    for (const chunk of events.contentEvents) {
      expect(chunk).not.toContain("ragna-action");
      expect(chunk).not.toContain("create_reminder");
      expect(chunk).not.toContain("{");
      expect(chunk).not.toContain("`");
    }

    // Exactly one structured action event, correctly parsed/validated.
    expect(events.actionEvents).toHaveLength(1);
    expect(events.actionEvents[0]).toEqual({
      action: "create_reminder",
      label: "Morphine dose",
      datetime: "2026-06-12T14:00:00",
      reminderType: "medication",
      recurrence: "daily",
    });
    expect(events.done).toBe(true);

    // The persisted assistant message is the cleaned prose, never the JSON.
    // calls: [0] = user message, [1] = assistant message.
    expect(insertValues).toHaveBeenCalledTimes(2);
    const saved = insertValues.mock.calls[1]![0] as {
      role: string;
      content: string;
    };
    expect(saved.role).toBe("assistant");
    expect(saved.content).toBe(prose.trim());
    expect(saved.content).not.toContain("ragna-action");
    expect(saved.content).not.toContain("create_reminder");
  });

  it("streams a reply with no action block unchanged and emits no action event", async () => {
    const deltas = [
      "Pain in hospice is usually managed ",
      "with scheduled opioids and breakthrough doses. ",
      "Talk to your nurse about a plan.",
    ];
    mockStream.fn = () => streamOf(deltas);

    const events = await postMessage("how do I manage pain?");

    expect(events.contentEvents.join("")).toBe(deltas.join(""));
    expect(events.actionEvents).toHaveLength(0);
    expect(events.done).toBe(true);
    expect(events.raw).not.toContain('"action"');

    // The full prose is persisted as the assistant message.
    const saved = insertValues.mock.calls[1]![0] as {
      role: string;
      content: string;
    };
    expect(saved.role).toBe("assistant");
    expect(saved.content).toBe(deltas.join(""));
  });
});
