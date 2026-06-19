# Hospice Roadmap — Production Release Checklist

Use this before submitting a **production** App Store build or disabling beta access.

## 1. Disable beta bypass flags

| Environment | Variable | Production value |
|-------------|----------|------------------|
| Replit API server | `REVENUECAT_BETA_BYPASS` | **unset** or `false` |
| EAS production profile | `EXPO_PUBLIC_BETA_OVERRIDE_PREMIUM` | **unset** or `false` |

Verify:

```bash
curl https://hospice-roadmap.replit.app/api/voice-status
```

`betaBypass` must be `false` in production.

## 2. RevenueCat

- [ ] Single premium product live in App Store Connect / Play Console
- [ ] RevenueCat offering `default` maps to `companion_monthly` (premium)
- [ ] `REVENUECAT_SECRET_API_KEY` set on Replit
- [ ] Test purchase + restore on a real device with beta flags **off**

## 3. Apple Sign In (iOS)

- [ ] Sign in with Apple capability enabled on App ID `com.thordadpool.hospiceroadmap`
- [ ] Provisioning profile regenerated in EAS credentials
- [ ] Test Apple button on device build

## 4. Server secrets (Replit)

- [ ] `DATABASE_URL`
- [ ] `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] ElevenLabs integration connected (Replit UI)
- [ ] `GOOGLE_MAPS_API_KEY`

Run smoke test:

```bash
node scripts/smoke-test-api.mjs
```

## 5. EAS / mobile

- [ ] EAS **production** environment has hosted API URL + Clerk keys
- [ ] No `tmp-*` or preview-video assets bloating the archive (see `.easignore`)
- [ ] Build with `eas build --platform ios --profile production`
- [ ] Submit with `eas submit --platform ios --profile production`

## 6. Post-release verification

- [ ] Fresh install: intro videos play once, then skip on relaunch
- [ ] Email sign-up + Google (+ Apple on iOS) auth
- [ ] Ragna chat + voice reply uses ElevenLabs (`voiceProvider: elevenlabs` in network tab)
- [ ] Paywall shows single “Hospice Roadmap Premium” plan
- [ ] Account → Voice diagnostics shows synthesis OK