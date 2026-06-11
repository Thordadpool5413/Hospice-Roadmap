/**
 * Server-side push sender.
 *
 * `sendPushToUser` looks up every registered Expo push token for a user and
 * delivers a notification via Expo's push service. It can be called from any
 * route or background job — no specific notification type is baked in here.
 *
 * Stale-token cleanup: Expo returns a `DeviceNotRegistered` error when a token
 * is no longer valid (app uninstalled, permissions revoked). We delete those
 * rows so the table doesn't accumulate dead tokens. Note that
 * `DeviceNotRegistered` is reliably reported in the *receipt* (polled ~15 min
 * after send) and only sometimes in the immediate *ticket*. We handle tickets
 * here, which is sufficient for plumbing; receipt polling is a known follow-up.
 */

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { pushTokens } from "@workspace/db/schema";
import { logger } from "./logger.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Expo accepts up to 100 messages per request. */
const EXPO_BATCH_SIZE = 100;

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushResult {
  /** Number of tickets Expo accepted with status "ok". */
  sent: number;
  /** Number of stale (DeviceNotRegistered) tokens removed from the table. */
  removed: number;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: "default";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Send a push notification to every device registered for `userId`.
 *
 * Returns the number of accepted tickets and the number of stale tokens
 * pruned. Never throws — network/Expo errors are logged and swallowed so
 * callers (routes, jobs) don't need defensive try/catch around delivery.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendPushResult> {
  const rows = await db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));

  if (rows.length === 0) {
    logger.debug({ userId }, "sendPushToUser: no registered tokens — skipping");
    return { sent: 0, removed: 0 };
  }

  const messages: ExpoPushMessage[] = rows.map((r) => ({
    to: r.expoPushToken,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: "default",
  }));

  const staleTokens: string[] = [];
  let sent = 0;

  for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        logger.error(
          { status: res.status },
          "sendPushToUser: Expo push request failed",
        );
        continue;
      }

      const json = (await res.json()) as { data?: ExpoPushTicket[] };
      const tickets = json.data ?? [];
      tickets.forEach((ticket, i) => {
        if (ticket.status === "ok") {
          sent += 1;
        } else if (ticket.details?.error === "DeviceNotRegistered") {
          const msg = batch[i];
          if (msg) staleTokens.push(msg.to);
        } else {
          logger.warn({ ticket }, "sendPushToUser: Expo ticket error");
        }
      });
    } catch (err) {
      logger.error({ err }, "sendPushToUser: Expo push send threw");
    }
  }

  let removed = 0;
  if (staleTokens.length > 0) {
    // Scope the delete to this user so a token that was ever registered under
    // two accounts can't have another user's row removed.
    await db
      .delete(pushTokens)
      .where(
        and(eq(pushTokens.userId, userId), inArray(pushTokens.expoPushToken, staleTokens)),
      );
    removed = staleTokens.length;
    logger.info({ userId, removed }, "sendPushToUser: pruned stale push tokens");
  }

  return { sent, removed };
}
