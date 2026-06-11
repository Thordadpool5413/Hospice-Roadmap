import { Router } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { pushTokens } from "@workspace/db/schema";

const router = Router();

/** Max accepted token length — Expo tokens are well under this; cap keeps junk out. */
const MAX_TOKEN_LENGTH = 256;

/**
 * Lightly validate an Expo push token. Real tokens look like
 * `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]` (FCM/APNs raw tokens are also
 * accepted by Expo's service, but the app only ever sends Expo tokens here).
 */
function isPlausibleExpoToken(token: string): boolean {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

// ─── POST /api/push/register — upsert this device's token for the user ────────
//
// Conflict target: unique index (user_id, expo_push_token). Re-registering the
// same token from the same user refreshes platform + updated_at instead of
// creating a duplicate row.

router.post("/register", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = (req.body ?? {}) as { expoPushToken?: unknown; platform?: unknown };
  const token = typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
  const platform =
    body.platform === "ios" || body.platform === "android" ? body.platform : null;

  if (!isPlausibleExpoToken(token)) {
    res.status(400).json({ error: "Valid expoPushToken required" });
    return;
  }
  if (!platform) {
    res.status(400).json({ error: "platform must be 'ios' or 'android'" });
    return;
  }

  try {
    await db
      .insert(pushTokens)
      .values({ userId, expoPushToken: token, platform })
      .onConflictDoUpdate({
        target: [pushTokens.userId, pushTokens.expoPushToken],
        set: { platform, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "push register failed");
    res.status(500).json({ error: "Failed to register push token" });
  }
});

// ─── DELETE /api/push/unregister — remove a token on sign-out ─────────────────
//
// When a specific token is supplied, only that device's row is removed. When no
// token is supplied, every token for the user is removed (full account sign-out
// across this device's known tokens).

router.delete("/unregister", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = (req.body ?? {}) as { expoPushToken?: unknown };
  const token = typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";

  try {
    if (token) {
      await db
        .delete(pushTokens)
        .where(and(eq(pushTokens.userId, userId), eq(pushTokens.expoPushToken, token)));
    } else {
      await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "push unregister failed");
    res.status(500).json({ error: "Failed to unregister push token" });
  }
});

export default router;
