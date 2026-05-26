---
name: express-rate-limit setup behind a proxy
description: Three pitfalls when wiring express-rate-limit in a proxied Express app.
---

# express-rate-limit: three pitfalls to avoid

## 1. Configure trust proxy or `req.ip` is wrong
Behind a reverse proxy (Replit's shared proxy, nginx, Cloudflare, etc.), `req.ip` defaults to the proxy's IP — collapsing every user into one bucket and producing false 429s.

**How to apply:** `app.set("trust proxy", 1)` (or the number of hops) before mounting the limiter.

**Why:** Without it, the limiter cannot tell users apart, so the limit becomes shared across the whole world.

## 2. Use `ipKeyGenerator`, not raw `req.ip`
A custom `keyGenerator` that returns `req.ip` directly triggers `ERR_ERL_KEY_GEN_IPV6` because IPv6 /64 blocks need to be normalized to prevent per-address bypass.

**How to apply:** `import { ipKeyGenerator } from "express-rate-limit"` and call `ipKeyGenerator(req.ip ?? "")` inside the custom keyGenerator.

## 3. Never key on a client-supplied header alone
A header like `x_client_id` is attacker-controllable. Keying on it directly lets an attacker (a) bypass limits by rotating values per request and (b) flood the in-memory store with high-cardinality keys (app-level DoS).

**How to apply:** Validate the header against a strict regex first, AND compose it with the IP key so the IP bucket still applies even if the header is spoofed: `` `${ipKeyGenerator(req.ip ?? "")}|${validatedHeader}` ``. Fall back to IP-only when the header fails validation.

**Why:** Composite keying preserves per-client granularity for legit clients while keeping IP as the un-spoofable fallback.

## Bonus
`@types/express-rate-limit` is a deprecated stub — the package ships its own types. Don't install it.
