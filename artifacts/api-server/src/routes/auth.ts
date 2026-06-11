import { Router } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import { deviceSessions } from "@workspace/db/schema";

const router = Router();

/**
 * POST /api/auth/register-device
 *
 * Called by the mobile app once per sign-in session (keyed by userId:sessionId).
 * Upserts this device's (userId, deviceId, clerkSessionId) row, then revokes
 * all OTHER active sessions for the same userId via the Clerk Backend REST API,
 * enforcing one active device per account.
 *
 * The sessionId comes from the authenticated Clerk JWT (getAuth().sessionId) —
 * the client never sends it explicitly. The only required body field is deviceId
 * (the stable, per-installation ID from clientIdentity.ts).
 *
 * Response: { ok: true, revokedCount: number }
 */
router.post("/register-device", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth.userId;
  const sessionId = auth.sessionId;

  if (!userId || !sessionId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { deviceId?: unknown };
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!deviceId) {
    res.status(400).json({ error: "deviceId is required" });
    return;
  }

  const secretKey = process.env["CLERK_SECRET_KEY"];
  if (!secretKey) {
    req.log.error("CLERK_SECRET_KEY is not set — cannot revoke other sessions");
    res.status(503).json({ error: "Session enforcement unavailable" });
    return;
  }

  try {
    // 1. Upsert: record or refresh this device's active session.
    await db
      .insert(deviceSessions)
      .values({ userId, deviceId, clerkSessionId: sessionId })
      .onConflictDoUpdate({
        target: [deviceSessions.userId, deviceSessions.deviceId],
        set: { clerkSessionId: sessionId, lastSeenAt: new Date() },
      });

    // 2. Find all OTHER device sessions for this user.
    const others = await db
      .select()
      .from(deviceSessions)
      .where(
        and(
          eq(deviceSessions.userId, userId),
          ne(deviceSessions.deviceId, deviceId),
        ),
      );

    if (others.length === 0) {
      res.json({ ok: true, revokedCount: 0 });
      return;
    }

    // 3. Revoke their Clerk sessions and remove rows from our table only when
    //    revocation succeeds (or the session is already gone). On transient
    //    Clerk API failures the row is kept so the next device registration
    //    automatically retries. This prevents phantom "active" sessions that
    //    aren't actually revoked from being silently dropped.
    let revokedCount = 0;
    await Promise.allSettled(
      others.map(async (other) => {
        let revoked = false;
        try {
          const r = await fetch(
            `https://api.clerk.com/v1/sessions/${encodeURIComponent(other.clerkSessionId)}/revoke`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (r.ok || r.status === 404) {
            // ok → revoked; 404 → session already expired/gone — both are success
            revoked = true;
            revokedCount++;
          } else {
            req.log.warn(
              { clerkSessionId: other.clerkSessionId, status: r.status },
              "register-device: Clerk session revocation returned non-OK — row kept for retry",
            );
          }
        } catch (err) {
          req.log.warn(
            { err, clerkSessionId: other.clerkSessionId },
            "register-device: Clerk session revocation request failed — row kept for retry",
          );
        }
        // Delete the tracking row only after confirmed revocation.
        if (revoked) {
          await db
            .delete(deviceSessions)
            .where(
              and(
                eq(deviceSessions.userId, userId),
                eq(deviceSessions.deviceId, other.deviceId),
              ),
            );
        }
      }),
    );

    req.log.info(
      { userId, deviceId, revokedCount, totalOthers: others.length },
      "register-device: session upserted, other device sessions processed",
    );

    res.json({ ok: true, revokedCount });
  } catch (err) {
    req.log.error({ err }, "register-device: unexpected error");
    res.status(500).json({ error: "Failed to register device" });
  }
});

export default router;
