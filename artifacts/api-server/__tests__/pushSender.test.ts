import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/db/src/index.ts throws at import if DATABASE_URL is unset and would open a
// real pg pool otherwise, so the db instance is mocked. The hoisted refs let
// each test control the rows returned and assert on the delete calls.
const { mockSelectWhere, mockDeleteWhere, mockDb } = vi.hoisted(() => {
  const mockSelectWhere = vi.fn();
  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const mockDb = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: mockSelectWhere })) })),
    delete: vi.fn(() => ({ where: mockDeleteWhere })),
  };
  return { mockSelectWhere, mockDeleteWhere, mockDb };
});

vi.mock("@workspace/db", () => ({ db: mockDb }));

// Keep logger quiet during tests.
vi.mock("../src/lib/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { sendPushToUser } from "../src/lib/pushSender";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

function tokenRows(tokens: string[]) {
  return tokens.map((t, i) => ({
    id: `id-${i}`,
    userId: "user-1",
    expoPushToken: t,
    platform: "ios",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

describe("sendPushToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteWhere.mockResolvedValue(undefined);
    global.fetch = vi.fn();
  });

  it("does not call Expo when the user has no registered tokens", async () => {
    mockSelectWhere.mockResolvedValueOnce([]);

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockDeleteWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, removed: 0 });
  });

  it("sends a correctly-shaped Expo message for each token", async () => {
    mockSelectWhere.mockResolvedValueOnce(
      tokenRows(["ExponentPushToken[AAA]", "ExponentPushToken[BBB]"]),
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ data: [{ status: "ok" }, { status: "ok" }] }),
    );

    const result = await sendPushToUser("user-1", {
      title: "Sync complete",
      body: "Your data is up to date",
      data: { type: "sync" },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    expect(init.method).toBe("POST");
    const payload = JSON.parse(init.body as string);
    expect(payload).toEqual([
      {
        to: "ExponentPushToken[AAA]",
        title: "Sync complete",
        body: "Your data is up to date",
        data: { type: "sync" },
        sound: "default",
      },
      {
        to: "ExponentPushToken[BBB]",
        title: "Sync complete",
        body: "Your data is up to date",
        data: { type: "sync" },
        sound: "default",
      },
    ]);
    expect(result).toEqual({ sent: 2, removed: 0 });
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("prunes tokens that Expo reports as DeviceNotRegistered", async () => {
    mockSelectWhere.mockResolvedValueOnce(
      tokenRows(["ExponentPushToken[GOOD]", "ExponentPushToken[DEAD]"]),
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        data: [
          { status: "ok" },
          { status: "error", details: { error: "DeviceNotRegistered" } },
        ],
      }),
    );

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(result).toEqual({ sent: 1, removed: 1 });
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
  });

  it("does not prune on a generic (non-DeviceNotRegistered) ticket error", async () => {
    mockSelectWhere.mockResolvedValueOnce(tokenRows(["ExponentPushToken[AAA]"]));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        data: [{ status: "error", details: { error: "MessageRateExceeded" } }],
      }),
    );

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(result).toEqual({ sent: 0, removed: 0 });
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("batches more than 100 messages into separate Expo requests", async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[T${i}]`);
    mockSelectWhere.mockResolvedValueOnce(tokenRows(tokens));
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: Array.from({ length: 100 }, () => ({ status: "ok" })) }),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: Array.from({ length: 50 }, () => ({ status: "ok" })) }),
    );

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ sent: 150, removed: 0 });
  });

  it("does not throw when the Expo request fails (non-ok response)", async () => {
    mockSelectWhere.mockResolvedValueOnce(tokenRows(["ExponentPushToken[AAA]"]));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({}, false, 500),
    );

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(result).toEqual({ sent: 0, removed: 0 });
  });

  it("does not throw when fetch itself rejects", async () => {
    mockSelectWhere.mockResolvedValueOnce(tokenRows(["ExponentPushToken[AAA]"]));
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("network down"),
    );

    const result = await sendPushToUser("user-1", { title: "Hi", body: "There" });

    expect(result).toEqual({ sent: 0, removed: 0 });
  });
});
