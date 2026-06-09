# App Store Screenshots — Hospice Roadmap

Marketing screenshots for the iOS App Store listing.

## Specifications

| Property | Value |
|---|---|
| Dimensions | 1290 × 2796 px |
| Device | iPhone 15 Pro Max |
| Format | PNG |
| Color space | sRGB |

## Screens Covered

| File | Screen | Description |
|---|---|---|
| `01-home.png` | **Home / Journey Dashboard** | Main caregiver dashboard showing the journey stage pill, today's status chips, the Ragna AI hero card, quick-action cards (Symptom Log, Journal, Goals of Care, Reminders), and resource links |
| `02-ragna-chat.png` | **Ragna AI Companion** | Streaming AI chat showing a real hospice conversation, smart follow-up suggestions, cross-session memory indicator, and the voice/text composer |
| `03-situation-finder.png` | **Situation Finder** | "Get Help Now" screen with search bar, category grid (Pain, Breathing, Medication, etc.), urgency color coding (Call Now / Contact Soon / Reference), and scenario cards |
| `04-symptom-tracker.png` | **Symptom Tracker** | Daily symptom check-in with sliders for Pain, Breathlessness, Nausea, Agitation, and Appetite; 7-day sparkline trends for each tracked symptom |
| `05-emergency-card.png` | **Emergency Card** | Quick-dial contacts (hospice nurse, doctor, family, social worker, pharmacy), patient info summary (name, diagnosis, DNR status, allergies), and comfort-kit reminder |

## Regenerating

Screenshots are generated programmatically by `/tmp/screenshot-gen/generate.js` using
`@napi-rs/canvas` against the app's design system colors (`constants/colors.ts`).

To regenerate after design changes:

```bash
cd /tmp/screenshot-gen
node generate.js
```

The script reads the color palette directly from the documented design system and renders
each screen at 3× logical scale (1 pt = 3 px, 430pt logical width → 1290px).
