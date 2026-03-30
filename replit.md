# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (CMS proxy + health)
│   └── mobile/             # Expo React Native mobile app (Hospice Roadmap)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- CMS Routes: `src/routes/cms.ts` — proxies CMS Provider Data API
  - `GET /api/cms/providers?state=XX&zip=XXXXX` — search CMS-certified hospice providers
  - `GET /api/cms/quality/:ccn` — get quality metrics + CAHPS survey data for a provider
  - Uses in-memory cache (5-min TTL) to reduce CMS API calls
  - Data sources: CMS datasets `yc9t-dgbk` (General Info), `252m-zfp9` (Provider Data), `gxki-hrr8` (CAHPS)
- **AI (Anthropic) Routes**: `src/routes/anthropic/` — Claude-powered conversation API
  - `POST /api/anthropic/conversations` — create conversation
  - `GET /api/anthropic/conversations/:id` — get conversation with messages
  - `DELETE /api/anthropic/conversations/:id` — delete conversation
  - `POST /api/anthropic/conversations/:id/messages` — send message, returns SSE stream of `{content}` / `{done}` chunks
  - System prompt: `src/routes/anthropic/systemPrompt.ts` — expert hospice/palliative care knowledge
  - Model: `claude-sonnet-4-6`, `max_tokens: 8192`
  - Patient context injected as final system turn from mobile `patientContext` body field
  - DB tables: `conversations` (title, userId), `messages` (conversationId, role, content)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app — "Hospice Roadmap" — healthcare navigation platform for the hospice journey.

- Color palette: deep navy background (#111B33), ice blue primary (#5AADDC), ember accent (#B84818) for urgency only
- Journey stages: before (ice blue #4E8AD8 / pale #142A50), during (ember #CC6030 / pale #361A08), after (violet #9068C8 / pale #201240)
- All *Pale colors are distinctly lighter than the background — minimum ~#0E2C44 range — for readable tinted surfaces
- Uses NativeTabs with liquid glass + ClassicTabLayout fallback
- Web top padding offset: `Platform.OS === "web" ? 67 : 0`
- No UUID package — uses `Date.now() + Math.random()` for IDs
- Key screens: onboarding, home, journey, resources, providers, more, provider detail, evaluation, support, patient-profile, emergency-card, situation-finder, guidance/[id]
- **Emergency Information Card** (`emergency-card.tsx`): one-tap call for hospice/after-hours/equipment/pharmacy; patient info, comfort kit, equipment list, quick guidance links — pre-filled from patient profile. Linked from More tab (red banner) and every guidance detail screen (phone-call icon top-right)
- **Situation Finder** (`situation-finder.tsx`): full-text search + category grid across 30+ scenarios; accessible from More tab, home screen "Get Help Now" banner chips, and guidance/emergency flow
- **Structured Guidance** (`guidance/[id].tsx`): 6-section layout (what you may notice → what it means → what to do now → what to avoid → when to call → what happens next) with inline tip/caution cards; emergency card shortcut in header
- **Guidance content** (`data/guidanceContent.ts`): 60 scenarios across 8 categories with tip/caution support per step
  - Symptoms & Comfort: 18 | Caregiving Tasks: 10 | Medications: 8 | Equipment: 7 | Emotional Support: 5 | Hospice Services: 5 | End of Life & After: 6 | Not Sure: 1
- **Symptom Tracker** (`app/symptom-tracker.tsx`, `context/SymptomContext.tsx`): daily pain/breathlessness/nausea/agitation/appetite check-in; 7-day trend bars; AsyncStorage persistence under `@hospice_roadmap_symptoms`; `getRecentSummary(days)` feeds 7-day trend data directly into Ragna's patient context for personalized guidance
- **Goals of Care** (`app/goals-of-care.tsx`): 4-field form (what matters most, good day, things to avoid, DNR status) saved to `patientProfile.goalsOfCare`; serialized into Ragna's context via `buildPatientContext`; accessible from More → Tools
- **Ragna AI companion**: Center tab "Ragna" (`(tabs)/help.tsx`) — streaming Claude AI chat with urgent situation tiles, markdown rendering, symptom data injection, goals of care injection, and cross-session memory
  - AI service: `services/aiService.ts` — `createConversation`, `streamMessage` (SSE streaming), `deleteConversation`
  - Patient profile: `app/patient-profile.tsx` — form to set patient context used by Compass
  - Context: `AppContext.updatePatientProfile`, `AppContext.buildPatientContext` — persists patient data and serializes it for AI injection
  - Tab renamed from "Learn/Resources" to "Compass" with `safari` SF Symbol (compass icon) on iOS, `Feather compass` on Android/web
  - `resources` tab hidden from tab bar (`href: null`) but still accessible as a route
  - **Smart follow-up suggestions**: Claude includes `[SUGGEST:Q1|Q2|Q3]` at end of every response; client parses and strips this, displays tappable suggestion pills below last AI message; tapping sends that question immediately; clears on new message/reset
  - **Long-press to share**: long-press any assistant message bubble to open native share sheet (Share API) — allows sharing guidance text with family/care team
- **Offline access** (`hooks/useNetworkStatus.ts`, `components/OfflineBanner.tsx`):
  - `useNetworkStatus` — detects connectivity via `navigator.onLine` on web and periodic fetch probe on native
  - `OfflineBanner` — animated amber pill banner at top of all screens when offline; uses `useNativeDriver: false` on web
  - Compass input bar replaced with amber offline notice when offline
  - CMS provider search shows offline warning and returns early when offline
  - All 60 guidance scenarios, Journey, Emergency Card work fully offline
- **Accessibility** (`context/AccessibilityContext.tsx`):
  - `fontScale: 1 | 1.2 | 1.4` and `highContrast: boolean` — persisted to AsyncStorage
  - Exposed in More tab under "Accessibility" section with A/A+/A++ text size buttons and High Contrast toggle
  - Applied to guidance detail screen: body text, bullet points, numbered steps, tips/cautions, title — all scale with `fontScale`; `highContrast` shifts backgrounds to white and text to near-black
- **Caregiver Journal** (`app/journal.tsx`, `app/journal-entry.tsx`, `context/JournalContext.tsx`):
  - Entry types: symptom, medication, observation, mood, general — each with distinct color/icon
  - AsyncStorage persistence under `@hospice_roadmap_journal`; CRUD: addEntry, updateEntry, deleteEntry
  - List view with date grouping, colored left-border cards, time + type badge per entry
  - Full-screen editor with horizontal type picker, title, 2000-char notes field, "What to track" tips
  - Long-press to delete; share individual entries via native Share API
  - Accessible from More tab → Tools section
- **Reminders** (`app/reminders.tsx`, `context/RemindersContext.tsx`):
  - Types: medication and appointment; recurrence: once, daily, weekly
  - `expo-notifications` for local push notifications (iOS/Android); web shows info notice
  - Requests permissions on first save; gracefully degrades when unavailable
  - Reminder toggle (Switch), long-press to delete, tap to edit via bottom sheet modal
  - Date/time picker via `@react-native-community/datetimepicker`; guarded with `Platform.OS !== "web"`
  - AsyncStorage persistence under `@hospice_roadmap_reminders`
  - Accessible from More tab → Tools section
- **Onboarding** (`app/onboarding.tsx`) expanded to 4 steps:
  - Step 0: Welcome — app logo, tagline, 2×2 feature grid (Journey Guide, AI Compass, 60+ Scenarios, Provider Search), trust note
  - Step 1: Role selection (patient / caregiver / other)
  - Step 2: Journey stage (before / during / after)
  - Step 3: App Tour — 5 tab cards with icons, colors, and descriptions
  - Animated progress dots at top; fade transition between steps
- CMS integration:
  - `services/cmsProviderService.ts` — calls API server for provider search + quality data
  - `context/cmsProviderStore.ts` — in-memory store for CMS providers (shared between list/detail)
  - Provider type extended with: `ccn`, `county`, `ownershipType`, `certificationDate`, `cmsRegion`, `medicareGovUrl`
  - `CmsQualityData` type for HCI score, star rating, CAHPS scores, quality measures
  - Providers screen has CMS/Sample toggle with state picker + ZIP search
  - Provider detail loads quality metrics when viewing CMS providers

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

---

## Hospice Intelligence Engine (Server-Side)

Located at `artifacts/api-server/src/intelligence/hospice/`. All files are server-side only — the mobile app only sends `content` + `patientContext` and receives streamed text back. The intelligence engine runs between the incoming message and the Anthropic API call.

### Files

| File | Purpose |
|------|---------|
| `types.ts` | All enumerations: `ConcernDomain`, `UrgencyLevel`, `CareGapType`, `AudienceStyle`, plus `ResponsePlan`, `KnowledgeBlock` interfaces |
| `catalog.ts` | 35+ knowledge blocks across 13 domains (pain, dyspnea, dying process, time of death, after death, grief, care gaps, etc.) |
| `diseaseModel.ts` | 6 disease trajectories: cancer, CHF, COPD, dementia, ALS, renal, liver, Parkinson's |
| `dyingProcessModel.ts` | 4 phases of the dying process with clinical signs and appropriate interventions |
| `symptomModel.ts` | 13 individual symptom profiles with urgency signals and escalation triggers |
| `communicationModel.ts` | 8 communication playbooks for difficult conversations |
| `timeOfDeathModel.ts` | What to do at the moment of death; who to call; what order |
| `afterDeathModel.ts` | Post-death practical guidance (pronouncement, medication disposal, funeral home) |
| `griefModel.ts` | 9 grief types with specific response guidance |
| `careGapModel.ts` | 12 care gap signal types with escalation scripts |
| `escalationCoaching.ts` | 5 scripts for escalating hospice calls/complaints |
| `documentationCoach.ts` | Guidance for documenting care failures with date/time/name |
| `expectedHospiceSupport.ts` | What good hospice care looks like across all service types |
| `serviceFailureScenarios.ts` | 6 specific hospice failure scenarios with detection and advocacy |
| `redFlags.ts` | 10 absolute red flags that always require immediate hospice or 911 contact |
| `scenarioMap.ts` | 20+ pattern → domain mappings for deterministic signal detection |
| `roleAdaptation.ts` | Response style adaptation by role (caregiver, patient, family, nurse) |
| `retrieval.ts` | Deterministic block retrieval by domain matching and urgency signals |
| `planner.ts` | `buildResponsePlan(messageText, patientContext)` — entry point; returns `ResponsePlan` with `injectedKnowledge` string |
| `evaluationFixtures.ts` | 46 evaluation fixtures covering all major clinical scenarios |

### Integration

- `artifacts/api-server/src/routes/anthropic/index.ts` calls `buildResponsePlan()` before each Anthropic streaming call and appends `plan.injectedKnowledge` to the system prompt under an `INTELLIGENCE PACKAGE` header
- `artifacts/api-server/src/routes/anthropic/systemPrompt.ts` includes a full section on how Ragna should interpret and use the intelligence package (urgency-based response style, required sections, must-say, must-avoid, knowledge block usage)

---

## Ragna AI Chat Screen — Mobile

- **`artifacts/mobile/components/ragna/RagnaEmptyState.tsx`** — empty state with two prompt tiers:
  - **Urgent Tiles** (2-column grid): `URGENT_TILES` — 11 scenario tiles with role-specific prompts and color coding
  - **Common Questions** (horizontal chip scroll): `GUIDANCE_PROMPTS` — 12 contextual guidance questions below the tiles
- **`artifacts/mobile/app/(tabs)/help.tsx`** — main Ragna chat screen; sends symptom summary, journal context, memory summary, goals of care, and patient profile with every message (respecting privacy controls)

---

## Screens Added

| Screen | Route | Purpose |
|--------|-------|---------|
| Symptom Tracker | `/symptom-tracker` | Daily check-in (pain/breathlessness/nausea/agitation/appetite), 7-day trend bars, history |
| Goals of Care | `/goals-of-care` | 4-question form (what matters most, good day, avoid, DNR), saved to patient profile |
| Active Dying Protocol | `/active-dying` | Clinical reference for the dying process with phase-by-phase guidance |
| PAINAD Scale | `/painad` | Nonverbal pain assessment tool for dementia/non-verbal patients |
| Situation Finder | `/situation-finder` | Symptom/scenario-based guidance lookup |
| Medication Lookup | `/medication-lookup` | 20+ hospice medications with RxNorm reference |
| Emergency Card | `/emergency-card` | Quick-access card with all hospice contacts, tappable to call |

## Context Providers

| Context | Purpose |
|---------|---------|
| `AppContext` | User profile, patient profile, goals of care, privacy settings, `buildPatientContext()` |
| `SymptomContext` | AsyncStorage-backed symptom entries with `getRecentSummary(days)` for Ragna |
| `JournalContext` | Caregiver journal entries with tag filtering and export |
| `RemindersContext` | Medication/appointment reminders with local notification support |
| `VeraMemoryContext` | Ragna's cross-conversation memory (summary, key facts, emotional tone, topics) |
| `AccessibilityContext` | Font scale and high-contrast mode |
