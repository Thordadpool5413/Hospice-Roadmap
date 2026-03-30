# Repo Cleanup Notes

**Date:** 2026-03-30  
**Scope:** Dependency hygiene, ignore rules, workspace scripts.

---

## Shipping packages

| Package | Role |
|---|---|
| `artifacts/mobile` (`@workspace/mobile`) | **Shipping app** — Expo React Native (SDK 54) |
| `artifacts/api-server` (`@workspace/api-server`) | **Shipping API** — Express + Anthropic AI |
| `lib/db` (`@workspace/db`) | Shared Drizzle ORM schema and DB client |
| `lib/api-zod` (`@workspace/api-zod`) | Shared Zod validators used by the API server |
| `lib/integrations-anthropic-ai` | Anthropic AI integration used by the API server |

## Non-shipping tooling

| Package | Role |
|---|---|
| `artifacts/mockup-sandbox` (`@workspace/mockup-sandbox`) | **Design prototype sandbox only.** Vite + shadcn/Radix UI environment for mocking components on the canvas. Not imported by mobile or API server at runtime. Not part of the production build. |
| `lib/api-spec` (`@workspace/api-spec`) | Codegen only. Runs `orval` to generate `lib/api-client-react/src/generated` from `openapi.yaml`. Only needed when the OpenAPI spec changes. |
| `lib/api-client-react` (`@workspace/api-client-react`) | **Currently unused.** Houses orval-generated React Query hooks. As of this cleanup pass, no mobile source file imports from this package. Remove from any manifest that lists it. Can be deleted entirely in a later focused pass once the team confirms there are no plans to adopt the generated client. |

---

## Changes made in this pass

### Removed
- `@workspace/api-client-react` removed from `artifacts/mobile/package.json` devDependencies — no source imports found.
- `../../lib/api-client-react` project reference removed from `artifacts/mobile/tsconfig.json` — was a stale reference with no active use.

### Scripts added to root `package.json`
| Script | Purpose |
|---|---|
| `repo:mobile:typecheck` | Typecheck the mobile app only |
| `repo:api:typecheck` | Typecheck the API server only |
| `repo:db:push` | Push Drizzle schema to the database |
| `repo:clean:artifacts` | Remove `.cache`, `.expo`, `dist`, `coverage` build dirs |
| `repo:health` | Alias for full typecheck — quick "is the repo healthy?" check |

### `.gitignore` additions
- `.eas` — EAS Build config and secrets directory
- `artifacts/mobile/.expo` — Expo local dev cache
- `artifacts/mobile/dist` — Expo export output
- `artifacts/mobile/web-build` — Expo web build output
- `artifacts/mockup-sandbox/dist` — Vite build output (non-shipping)
- `artifacts/mockup-sandbox/.vite` — Vite cache (non-shipping)
- `*.log` / `pnpm-debug.log*` — all log files
- `.env.local` / `.env.*.local` — local secret overrides

---

## Items left untouched (intentionally)

- `pnpm-workspace.yaml` safety settings (`minimumReleaseAge`, `autoInstallPeers`, `onlyBuiltDependencies`, platform overrides) — intentional supply-chain defenses, do not modify.
- `lib/api-spec` — kept in place; used only for optional OpenAPI codegen workflows.
- `artifacts/mockup-sandbox` — kept in place; design workflow depends on it being runnable locally.
- All version pins in `artifacts/mobile/package.json` — conservative pass, no version bumps.

---

## Suspicious items noted (not removed)

- `lib/api-client-react` whole package folder — appears unused end-to-end. Recommend a follow-up decision: if the team will not adopt the orval-generated React Query client, delete this folder and the corresponding `orval.config.ts` target. No action taken here.
- `@expo/ngrok` in mobile devDependencies — low usage, but kept because it may be used for tunneling during device testing.
- `expo-glass-effect` in mobile devDependencies — verify it is still used before a future cleanup removes it.
