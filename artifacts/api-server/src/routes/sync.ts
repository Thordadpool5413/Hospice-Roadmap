import { Router } from "express";
import { getAuth } from "@clerk/express";
import { sql, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  symptomEntries,
  journalEntries,
  goalsOfCare,
  livingProfiles,
  syncReminders,
  caregiverWellness,
  userProfiles,
  gocContentSchema,
} from "@workspace/db/schema";

const router = Router();

// ─── GET /api/sync — fetch all user data in one round-trip ───────────────────

router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [symptoms, journal, goals, profile, reminders, wellness, userProfile] = await Promise.all([
      db.select().from(symptomEntries).where(eq(symptomEntries.userId, userId)),
      db.select().from(journalEntries).where(eq(journalEntries.userId, userId)),
      db.select().from(goalsOfCare).where(eq(goalsOfCare.userId, userId)),
      db.select().from(livingProfiles).where(eq(livingProfiles.userId, userId)),
      db.select().from(syncReminders).where(eq(syncReminders.userId, userId)),
      db.select().from(caregiverWellness).where(eq(caregiverWellness.userId, userId)),
      db.select().from(userProfiles).where(eq(userProfiles.userId, userId)),
    ]);

    res.json({
      symptoms,
      journal,
      goals: goals[0] ?? null,
      livingProfile: profile[0] ?? null,
      reminders,
      caregiverWellness: wellness,
      userProfile: userProfile[0] ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "sync GET failed");
    res.status(500).json({ error: "Failed to fetch sync data" });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a client-supplied ISO timestamp string into a Date, falling back to now. */
function parseClientTs(raw: unknown, fallback = new Date()): Date {
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

// ─── PUT /api/sync/symptoms — upsert symptom entries (LWW per record) ────────
//
// Conflict target: composite PK (user_id, id).
// Conflict resolution: update only when client's logical timestamp ≥ stored one
// (last-write-wins). The client sends `clientUpdatedAt` derived from the
// check-in date + time — a deterministic logical version key for the record.

router.put("/symptoms", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { entries?: unknown[] };
  if (!Array.isArray(body.entries)) {
    res.status(400).json({ error: "entries array required" });
    return;
  }

  try {
    const rows = body.entries
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        id: String(e["id"] ?? ""),
        userId,
        date: String(e["date"] ?? ""),
        time: String(e["time"] ?? ""),
        pain: Number(e["pain"] ?? 0),
        breathlessness: Number(e["breathlessness"] ?? 0),
        nausea: Number(e["nausea"] ?? 0),
        agitation: Number(e["agitation"] ?? 0),
        restlessness: Boolean(e["restlessness"]),
        appetite: Number(e["appetite"] ?? 0),
        notes: typeof e["notes"] === "string" ? e["notes"] : null,
        // Use client-derived logical version (check-in event time) for LWW
        updatedAt: parseClientTs(e["clientUpdatedAt"]),
      }))
      .filter((r) => r.id && r.date);

    if (rows.length > 0) {
      await db
        .insert(symptomEntries)
        .values(rows)
        .onConflictDoUpdate({
          target: [symptomEntries.userId, symptomEntries.id],
          set: {
            pain: sql`excluded.pain`,
            breathlessness: sql`excluded.breathlessness`,
            nausea: sql`excluded.nausea`,
            agitation: sql`excluded.agitation`,
            restlessness: sql`excluded.restlessness`,
            appetite: sql`excluded.appetite`,
            notes: sql`excluded.notes`,
            updatedAt: sql`excluded.updated_at`,
          },
          // LWW: only apply the incoming values if the client timestamp is
          // at least as recent as the one already stored
          setWhere: sql`excluded.updated_at >= ${symptomEntries.updatedAt}`,
        });
    }

    res.json({ upserted: rows.length });
  } catch (err) {
    req.log.error({ err }, "sync PUT symptoms failed");
    res.status(500).json({ error: "Failed to sync symptoms" });
  }
});

// ─── DELETE /api/sync/symptoms ────────────────────────────────────────────────

router.delete("/symptoms", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(symptomEntries).where(eq(symptomEntries.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE symptoms failed");
    res.status(500).json({ error: "Failed to delete symptoms" });
  }
});

// ─── PUT /api/sync/journal — upsert journal entries (LWW per record) ─────────
//
// Client sends `clientUpdatedAt` derived from entry.timestamp (creation epoch).

router.put("/journal", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { entries?: unknown[] };
  if (!Array.isArray(body.entries)) {
    res.status(400).json({ error: "entries array required" });
    return;
  }

  try {
    const rows = body.entries
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        id: String(e["id"] ?? ""),
        userId,
        type: String(e["type"] ?? "general"),
        title: String(e["title"] ?? ""),
        body: String(e["body"] ?? ""),
        date: String(e["date"] ?? ""),
        timestamp: Number(e["timestamp"] ?? 0),
        moodLevel: typeof e["moodLevel"] === "number" ? e["moodLevel"] : null,
        tags: Array.isArray(e["tags"]) ? (e["tags"] as string[]) : null,
        // Client-derived logical version (entry creation/edit epoch) for LWW
        updatedAt: parseClientTs(e["clientUpdatedAt"]),
      }))
      .filter((r) => r.id && r.date);

    if (rows.length > 0) {
      await db
        .insert(journalEntries)
        .values(rows)
        .onConflictDoUpdate({
          target: [journalEntries.userId, journalEntries.id],
          set: {
            type: sql`excluded.type`,
            title: sql`excluded.title`,
            body: sql`excluded.body`,
            date: sql`excluded.date`,
            timestamp: sql`excluded.timestamp`,
            moodLevel: sql`excluded.mood_level`,
            tags: sql`excluded.tags`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`excluded.updated_at >= ${journalEntries.updatedAt}`,
        });
    }

    res.json({ upserted: rows.length });
  } catch (err) {
    req.log.error({ err }, "sync PUT journal failed");
    res.status(500).json({ error: "Failed to sync journal" });
  }
});

// ─── DELETE /api/sync/journal ─────────────────────────────────────────────────

router.delete("/journal", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE journal failed");
    res.status(500).json({ error: "Failed to delete journal" });
  }
});

// ─── PUT /api/sync/goals — upsert goals of care (one row per user, LWW) ──────
//
// Client sends `clientUpdatedAt` from goalsOfCare.updatedAt if available.
// Content is validated through gocContentSchema so all eight editable fields
// (including fearsAndConcerns, finalDaysWishes, afterDeathWishes) are
// accepted and unknown keys are stripped before storage.

router.put("/goals", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { content?: unknown; clientUpdatedAt?: unknown };
  if (!body.content || typeof body.content !== "object" || Array.isArray(body.content)) {
    res.status(400).json({ error: "content object required" });
    return;
  }

  const parsed = gocContentSchema.safeParse(body.content);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid content", issues: parsed.error.issues });
    return;
  }

  try {
    const clientUpdatedAt = parseClientTs(body.clientUpdatedAt);

    await db
      .insert(goalsOfCare)
      .values({ userId, content: parsed.data, updatedAt: clientUpdatedAt })
      .onConflictDoUpdate({
        target: goalsOfCare.userId,
        set: {
          content: sql`excluded.content`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`excluded.updated_at >= ${goalsOfCare.updatedAt}`,
      });

    res.json({ upserted: true });
  } catch (err) {
    req.log.error({ err }, "sync PUT goals failed");
    res.status(500).json({ error: "Failed to sync goals" });
  }
});

// ─── DELETE /api/sync/goals ───────────────────────────────────────────────────

router.delete("/goals", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(goalsOfCare).where(eq(goalsOfCare.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE goals failed");
    res.status(500).json({ error: "Failed to delete goals" });
  }
});

// ─── PUT /api/sync/living-profile — upsert living profile (one row per user) ─

router.put("/living-profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { profile?: unknown; clientUpdatedAt?: unknown };
  if (typeof body.profile !== "string") {
    res.status(400).json({ error: "profile string required" });
    return;
  }

  try {
    const clientUpdatedAt = parseClientTs(body.clientUpdatedAt);

    await db
      .insert(livingProfiles)
      .values({ userId, profile: body.profile, updatedAt: clientUpdatedAt })
      .onConflictDoUpdate({
        target: livingProfiles.userId,
        set: {
          profile: sql`excluded.profile`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`excluded.updated_at >= ${livingProfiles.updatedAt}`,
      });

    res.json({ upserted: true });
  } catch (err) {
    req.log.error({ err }, "sync PUT living-profile failed");
    res.status(500).json({ error: "Failed to sync living profile" });
  }
});

// ─── DELETE /api/sync/living-profile ─────────────────────────────────────────

router.delete("/living-profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(livingProfiles).where(eq(livingProfiles.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE living-profile failed");
    res.status(500).json({ error: "Failed to delete living profile" });
  }
});

// ─── PUT /api/sync/reminders — upsert reminders (LWW per record) ─────────────
//
// Client sends `clientUpdatedAt` derived from the scheduled datetime.

router.put("/reminders", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { reminders?: unknown[] };
  if (!Array.isArray(body.reminders)) {
    res.status(400).json({ error: "reminders array required" });
    return;
  }

  try {
    const rows = body.reminders
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .map((r) => ({
        id: String(r["id"] ?? ""),
        userId,
        type: String(r["type"] ?? "medication"),
        label: String(r["label"] ?? ""),
        datetime: String(r["datetime"] ?? ""),
        recurrence: String(r["recurrence"] ?? "none"),
        enabled: Boolean(r["enabled"] ?? true),
        // Client-derived logical version (scheduled datetime) for LWW
        updatedAt: parseClientTs(r["clientUpdatedAt"]),
      }))
      .filter((r) => r.id && r.label);

    if (rows.length > 0) {
      await db
        .insert(syncReminders)
        .values(rows)
        .onConflictDoUpdate({
          target: [syncReminders.userId, syncReminders.id],
          set: {
            type: sql`excluded.type`,
            label: sql`excluded.label`,
            datetime: sql`excluded.datetime`,
            recurrence: sql`excluded.recurrence`,
            enabled: sql`excluded.enabled`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`excluded.updated_at >= ${syncReminders.updatedAt}`,
        });
    }

    res.json({ upserted: rows.length });
  } catch (err) {
    req.log.error({ err }, "sync PUT reminders failed");
    res.status(500).json({ error: "Failed to sync reminders" });
  }
});

// ─── DELETE /api/sync/reminders ───────────────────────────────────────────────

router.delete("/reminders", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(syncReminders).where(eq(syncReminders.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE reminders failed");
    res.status(500).json({ error: "Failed to delete reminders" });
  }
});

// ─── PUT /api/sync/caregiver-wellness — upsert wellness entries (LWW per record)
//
// Client sends `clientUpdatedAt` derived from entry.updatedAt or entry.timestamp.

router.put("/caregiver-wellness", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { entries?: unknown[] };
  if (!Array.isArray(body.entries)) {
    res.status(400).json({ error: "entries array required" });
    return;
  }

  try {
    const rows = body.entries
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        id: String(e["id"] ?? ""),
        userId,
        date: String(e["date"] ?? ""),
        timestamp: Number(e["timestamp"] ?? 0),
        mood: String(e["mood"] ?? ""),
        note: typeof e["note"] === "string" ? e["note"] : null,
        updatedAt: parseClientTs(e["clientUpdatedAt"]),
      }))
      .filter((r) => r.id && r.date && r.mood);

    if (rows.length > 0) {
      await db
        .insert(caregiverWellness)
        .values(rows)
        .onConflictDoUpdate({
          target: [caregiverWellness.userId, caregiverWellness.id],
          set: {
            date: sql`excluded.date`,
            timestamp: sql`excluded.timestamp`,
            mood: sql`excluded.mood`,
            note: sql`excluded.note`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`excluded.updated_at >= ${caregiverWellness.updatedAt}`,
        });
    }

    res.json({ upserted: rows.length });
  } catch (err) {
    req.log.error({ err }, "sync PUT caregiver-wellness failed");
    res.status(500).json({ error: "Failed to sync caregiver wellness" });
  }
});

// ─── DELETE /api/sync/caregiver-wellness ──────────────────────────────────────

router.delete("/caregiver-wellness", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(caregiverWellness).where(eq(caregiverWellness.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE caregiver-wellness failed");
    res.status(500).json({ error: "Failed to delete caregiver wellness" });
  }
});

// ─── PUT /api/sync/profile — upsert user profile (one row per user, LWW) ─────
//
// Client sends `clientUpdatedAt` from user.updatedAt.
// Profile data is stored as JSONB and should NOT include patientProfile.goalsOfCare
// since that field is managed by the dedicated /sync/goals endpoint.

router.put("/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { data?: unknown; clientUpdatedAt?: unknown };
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    res.status(400).json({ error: "data object required" });
    return;
  }

  try {
    const clientUpdatedAt = parseClientTs(body.clientUpdatedAt);

    await db
      .insert(userProfiles)
      .values({ userId, data: body.data as Record<string, unknown>, updatedAt: clientUpdatedAt })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          data: sql`excluded.data`,
          updatedAt: sql`excluded.updated_at`,
        },
        setWhere: sql`excluded.updated_at >= ${userProfiles.updatedAt}`,
      });

    res.json({ upserted: true });
  } catch (err) {
    req.log.error({ err }, "sync PUT profile failed");
    res.status(500).json({ error: "Failed to sync profile" });
  }
});

// ─── DELETE /api/sync/profile ─────────────────────────────────────────────────

router.delete("/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE profile failed");
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

// ─── DELETE /api/sync/all — wipe all sync data for user ──────────────────────

router.delete("/all", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await Promise.all([
      db.delete(symptomEntries).where(eq(symptomEntries.userId, userId)),
      db.delete(journalEntries).where(eq(journalEntries.userId, userId)),
      db.delete(goalsOfCare).where(eq(goalsOfCare.userId, userId)),
      db.delete(livingProfiles).where(eq(livingProfiles.userId, userId)),
      db.delete(syncReminders).where(eq(syncReminders.userId, userId)),
      db.delete(caregiverWellness).where(eq(caregiverWellness.userId, userId)),
      db.delete(userProfiles).where(eq(userProfiles.userId, userId)),
    ]);

    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "sync DELETE all failed");
    res.status(500).json({ error: "Failed to delete all sync data" });
  }
});

export default router;
