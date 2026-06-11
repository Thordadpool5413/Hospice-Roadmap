---
name: Testing modules that import @workspace/db under vitest
description: How to unit-test api-server modules that import the db instance and schema without a real database.
---

# Testing modules that import `@workspace/db` under vitest

When a unit test (transitively) imports a module that does
`import { db } from "@workspace/db"`, two things bite:

1. **`lib/db` opens a real pg pool / throws when `DATABASE_URL` is unset.** Mock
   the db instance with a hoisted factory so no real connection is made and you
   control the rows:
   ```ts
   const { mockDb, ... } = vi.hoisted(() => { /* chainable select/delete stubs */ });
   vi.mock("@workspace/db", () => ({ db: mockDb }));
   ```
   Build the stubs to mirror the real query chains the module calls
   (`db.select().from().where()`, `db.delete().where()`, etc.).

2. **`@workspace/db/schema` (the subpath) does NOT resolve under vitest** even
   though the root `vitest.config.ts` aliases the bare `@workspace/db`. Vitest's
   alias matching here is exact-segment, so the subpath needs its own alias entry,
   listed BEFORE the bare one:
   ```ts
   alias: {
     "@workspace/db/schema": path.resolve(__dirname, "lib/db/src/schema/index.ts"),
     "@workspace/db": path.resolve(__dirname, "lib/db/src/index.ts"),
   }
   ```
   The schema module is pure table definitions (no DB connection), so importing
   the real one is fine — only the `db` instance needs mocking. With the real
   schema, drizzle helpers (`eq`/`and`/`inArray`) operate on real columns and the
   mocked `db` swallows the resulting SQL.

**Why:** discovered while adding the first db-importing api-server test; without
the subpath alias the suite fails with "Cannot find package '@workspace/db/schema'".

**How to apply:** any new test under `artifacts/api-server/__tests__` (or a lib)
that pulls in a db-backed module.

## Unrelated gotcha: new route files need a workflow restart
The api-server dev server does not always hot-pick-up a brand-new route file —
a newly added router can 404 until `restart_workflow "artifacts/api-server: API Server"`.
Edits to already-loaded files hot-reload fine.
