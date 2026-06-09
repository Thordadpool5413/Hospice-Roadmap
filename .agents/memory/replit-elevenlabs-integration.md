---
name: Replit ElevenLabs integration pattern
description: How to call ElevenLabs from an Express server in a Replit project using the Replit Connectors SDK proxy.
---

## Rule
Never read `ELEVENLABS_API_KEY` from `process.env` — the Replit ElevenLabs integration does NOT inject a raw API key. Instead use `@replit/connectors-sdk`:

```ts
import { ReplitConnectors } from "@replit/connectors-sdk";
const connectors = new ReplitConnectors();
const response = await connectors.proxy("elevenlabs", "/v1/voices");
```

**Why:** Replit's ElevenLabs blueprint is a proxied connection (not an env-var injection). Auth is injected automatically via `Connector-Name` header. Checking `process.env.ELEVENLABS_API_KEY` will always be undefined and cause premature fallback to OpenAI.

**How to apply:**
- Add `"@replit/connectors-sdk": "latest"` to the server artifact's `dependencies` in package.json.
- Create a single `ReplitConnectors` instance (module-level singleton) and call `.proxy("elevenlabs", path, options)`.
- `options.body` can be a plain object — the SDK auto-JSON-stringifies and sets Content-Type.
- `options.headers` can add `Accept: "audio/mpeg"` for binary TTS responses.
- The proxy returns a standard `Response`; call `.arrayBuffer()` for binary or `.json()` for data.
- Voice ID resolution (fetching `/v1/voices` then matching by name) should be cached in a module-level variable to avoid repeated lookups.
- To bind the integration to a new Repl: call `addIntegration(connectionId)` then `proposeIntegration(connectionId)` via the code_execution sandbox.
