---
name: Anthropic API key via Replit integration
description: ANTHROPIC_API_KEY is not a plain process.env var in this project; it is injected by the @workspace/integrations-anthropic-ai Replit-managed integration.
---

The API server imports `anthropic` from `@workspace/integrations-anthropic-ai`, a Replit-managed integration package that handles key injection internally. `process.env.ANTHROPIC_API_KEY` is undefined at startup; checking for it and exiting will break the server.

**Why:** Replit integrations wrap the underlying SDK and inject credentials at the integration layer, not as environment variables. The OPENAI_API_KEY for voice features IS a plain env var (user-managed) and can be checked at startup or runtime.

**How to apply:** Only include `PORT` (and optionally `OPENAI_API_KEY` as a warning, not a fatal) in startup env checks. Never add `ANTHROPIC_API_KEY` to the required-env list.
