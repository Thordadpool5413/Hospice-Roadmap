# Overview

This project is a pnpm workspace monorepo utilizing TypeScript, focused on developing a healthcare navigation platform called "Hospice Roadmap" for individuals undergoing the hospice journey. It includes an Express API server and an Expo React Native mobile application. The core purpose is to provide comprehensive support, guidance, and resources to patients and caregivers, leveraging AI for personalized assistance.

Key capabilities include:
- A mobile application ("Hospice Roadmap") offering structured guidance, symptom tracking, care planning, and an AI companion.
- An API server that proxies CMS provider data and integrates with an AI service (Anthropic's Claude) for conversational AI.
- A robust intelligence engine on the server-side to enhance AI responses with expert hospice and palliative care knowledge.

The project aims to empower users with information, facilitate care coordination, and offer emotional support throughout the hospice experience.

# User Preferences

I want iterative development.
I prefer detailed explanations.
Do not make changes to the folder `artifacts/api-server/src/intelligence/hospice/`
Do not make changes to the file `artifacts/api-server/src/routes/anthropic/systemPrompt.ts`

# System Architecture

## Monorepo Structure and Technologies

The project is structured as a pnpm workspace monorepo.
- **Monorepo Tool**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **Package Manager**: pnpm
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Core Components

### `artifacts/api-server` (`@workspace/api-server`)

An Express 5 API server handling:
- **CMS Proxy**: Routes for searching CMS-certified hospice providers and retrieving quality metrics. Includes an in-memory cache.
- **AI (Anthropic) Routes**: Provides a Claude-powered conversation API, managing conversations and messages, and streaming AI responses. It injects patient context and system prompts for personalized interactions.

### `artifacts/mobile` (`@workspace/mobile`)

An Expo React Native application ("Hospice Roadmap") providing:
- **UI/UX**: Features a deep navy background, ice blue primary, and ember accent colors. Journey stages are color-coded. Uses NativeTabs with liquid glass and ClassicTabLayout fallback.
- **Key Features**:
    - **Emergency Information Card**: Quick access to hospice contacts and essential patient information.
    - **Situation Finder**: Full-text search and category-based guidance across numerous scenarios.
    - **Structured Guidance**: Detailed 6-section guidance for 60 scenarios with inline tips/cautions.
    - **Symptom Tracker**: Daily check-ins for symptoms with 7-day trend analysis, integrated into AI context.
    - **Goals of Care**: Form to define patient's priorities, integrated into AI context.
    - **Ragna AI companion**: A streaming Claude AI chat with cross-session memory, smart follow-up suggestions, and markdown rendering. It incorporates symptom data, goals of care, patient profile, caregiver journal, and real-time app-activity observations for deeply personalized guidance.
    - **Offline Access**: Critical features like guidance scenarios, journey, and emergency card are fully functional offline. An `OfflineBanner` indicates connectivity status.
    - **Accessibility**: Configurable font scale and high-contrast mode, persisted via AsyncStorage.
    - **Caregiver Journal**: Allows tracking various entry types with AsyncStorage persistence.
    - **Reminders**: Medication and appointment reminders with local push notification support.
    - **Onboarding**: A 4-step onboarding process covering role selection, journey stage, and an app tour.
- **Context Providers**: Manages application state for user/patient profiles, symptoms, journal, reminders, AI memory, app-activity learning observations, and accessibility.
  - `RagnaLearningContext` (`context/RagnaLearningContext.tsx`): Tracks all meaningful app events (symptom check-ins, journal writes, GoC saves, profile updates) as rolling observations passed to Ragna on every message. Persisted at `@ragna_learning_v1`. The `LearningSync` component in `_layout.tsx` silently synthesizes the living profile from these observations after 3+ significant events and a 2-hour cooldown.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL for schema definitions and client instance management.

### `lib/api-spec` (`@workspace/api-spec`)

Manages the OpenAPI 3.1 specification and Orval configuration for API codegen, generating React Query hooks and Zod schemas.

### `lib/api-zod` (`@workspace/api-zod`)

Contains generated Zod schemas from the OpenAPI spec for request and response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Contains generated React Query hooks and a fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

A package for utility scripts, allowing execution of various tasks within the monorepo.

## Hospice Intelligence Engine (Server-Side)

Located at `artifacts/api-server/src/intelligence/hospice/`, this engine runs between incoming messages and the Anthropic API call to enhance AI responses. It includes:
- **Knowledge Catalog**: Over 35 knowledge blocks across 13 domains.
- **Models**: Disease models, dying process model, symptom model, communication model, grief model, and care gap model.
- **Escalation Coaching & Documentation Guidance**: Scripts and guidance for handling critical situations and documenting care failures.
- **Red Flags**: Defines critical scenarios requiring immediate action.
- **Response Planning**: A `planner.ts` module that builds a `ResponsePlan` with `injectedKnowledge` based on message text and patient context. This `injectedKnowledge` is appended to the system prompt for the Anthropic API.

# External Dependencies

- **PostgreSQL**: Relational database used with Drizzle ORM.
- **Anthropic API**: Provides the Claude AI model for conversational AI features.
- **CMS Provider Data API**: External government API (`yc9t-dgbk`, `252m-zfp9`, `gxki-hrr8`) used for hospice provider information and quality metrics.
- **`expo-notifications`**: For local push notifications in the mobile application.
- **`@react-native-community/datetimepicker`**: Used for date/time picking in mobile reminders.
- **`AsyncStorage`**: Used for persistent local storage in the mobile app (e.g., symptom entries, journal, reminders, accessibility settings).