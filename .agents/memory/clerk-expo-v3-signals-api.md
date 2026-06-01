---
name: Clerk Expo v3 Signals API
description: How @clerk/expo@3.3.0 (backed by @clerk/react@6.7.2) actually works — Signals paradigm, correct hook returns, runtime null-safety, auth flow methods.
---

## The Signals Paradigm

`@clerk/expo@3.3.0` uses `@clerk/react@6.7.2` which ships a reactive "Signals" API.

### useSignIn()

```typescript
const { signIn, errors, fetchStatus } = useSignIn();
// NOT { signIn, isLoaded, setActive } — that's the legacy/v4 API
```

- `errors: SignInErrors` — typed non-null, but **starts as `undefined` at runtime** before the signal connects. Always use optional chaining: `errors?.fields?.identifier`.
- `fetchStatus: 'idle' | 'fetching'` — use for loading state
- `signIn: SignInFutureResource` — the resource (may be null before load)

**Why:** TypeScript types the stable post-load shape; the initial signal value is not fully hydrated yet.

### useSignUp()

```typescript
const { signUp, errors, fetchStatus } = useSignUp();
// Same pattern — errors starts as undefined at runtime
```

### Correct sign-in flow (SignInFutureResource API)

```typescript
// 1. Submit password
const { error } = await signIn.password({ identifier: email, password });
// OR: await signIn.create({ identifier: email, password });

// 2. Read status from the resource AFTER the call (not from the return value)
if (signIn.status === "complete") {
  await signIn.finalize(); // activates the session — replaces setActive()
  router.replace("/");
} else if (signIn.status === "needs_second_factor") {
  await (signIn as any).mfa?.sendEmailCode?.();
  // then: const { error } = await (signIn as any).mfa?.verifyEmailCode?.({ code });
  // then: await signIn.finalize();
}
```

### Correct sign-up flow (SignUpFutureResource API)

```typescript
// 1. Create account (sends verification email automatically)
const { error } = await signUp.password({ emailAddress: email, password });

// 2. Verify email code
const { error } = await signUp.verifications.verifyEmailCode({ code });

// 3. Finalize
if (signUp.status === "complete") {
  await signUp.finalize(); // activates the session
  router.replace("/");
}
```

### Runtime null-safety rule

**Always use optional chaining on errors.fields.*** because `errors` is undefined at initial render:
```typescript
// Correct
{errors?.fields?.identifier && <Text>{errors.fields.identifier.message}</Text>}
{errors?.global?.[0] && <Text>{errors.global[0].message}</Text>}

// Wrong — crashes with "Cannot read properties of undefined (reading 'fields')"
{errors.fields.identifier && ...}
```

### redirect during render

Never call `router.replace()` during the render function. Use `<Redirect href="/" />`:
```typescript
if (isSignedIn) return <Redirect href="/" />;
```

### setActive is NOT from useSignIn/useSignUp in v6

In v6, session activation is done via `signIn.finalize()` or `signUp.finalize()`, not `setActive`. `setActive` from `useClerk()` still exists but is not needed for the standard password flow.

### Legacy API (if needed)

The legacy v4/v5 API (`{ isLoaded, signIn, setActive }`) is exported from `@clerk/expo/legacy` → `@clerk/react/legacy`. Do NOT import this by default.

**How to apply:** Any custom auth screens using `@clerk/expo` hooks in this project must follow this Signals pattern.
