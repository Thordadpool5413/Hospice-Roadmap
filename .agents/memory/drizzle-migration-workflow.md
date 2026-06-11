---
name: Drizzle migration workflow & snapshot drift
description: How lib/db migrations actually work here, and why drizzle-kit generate goes interactive.
---

# Drizzle migration workflow (lib/db)

`lib/db/package.json` only exposes `push` / `push-force` (drizzle-kit push) — there is no
`migrate` or `generate` script. The committed SQL files in `lib/db/drizzle/` plus their
`meta/*_snapshot.json` + `_journal.json` exist as a migration history, but day-to-day schema
changes are applied with `drizzle-kit push` (diffs schema → live DB directly).

**Why this matters:** the snapshots have drifted from the real schema. At least `ragna_memory`
was added via `push` without ever generating a migration, so it is missing from the snapshot
chain. Running `drizzle-kit generate` therefore goes **interactive**, asking "is ragna_memory
created or renamed from <removed table>?" — it conflates the drift with whatever you just
changed and would pollute your migration with unrelated CREATE TABLEs.

**How to apply (when adding/removing a table cleanly):**
- Hand-write the SQL file (`NNNN_descriptive_name.sql`).
- Hand-write the snapshot: copy the previous `meta/NNNN-1_snapshot.json`, bump `id` (new uuid)
  and set `prevId` to the previous snapshot's `id`, then add/remove only your table.
- Append a matching entry to `meta/_journal.json` (idx+1, version "7", tag = sql filename).
- This keeps each snapshot diff == exactly your migration and leaves pre-existing drift alone
  (do NOT try to "fix" ragna_memory drift — out of scope, risks breaking push).

**Verifying:** `pnpm run typecheck:libs` (tsc --build) is the canonical check after schema edits.
The dev DB is often NOT provisioned in isolated task environments (checkDatabase → not
provisioned even when DATABASE_URL is set), so you usually can't apply the SQL locally — the
migration file is the deliverable and gets applied later.
