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

## App Store Preview Video

A 27-second App Store preview video is committed at `artifacts/mobile/assets/app-preview-video-portrait.mp4`.

### Flows demonstrated (in order)
1. **Ragna AI Companion** (t=4–12s) — AI chat with streamed response and follow-up suggestions
2. **Symptom Tracker** (t=12–20s) — animated sliders and 7-day sparkline trends
3. **Situation Finder** (t=20–27s) — search and category navigation to emergency guidance

### File specs

| Property | Value |
|---|---|
| File | `artifacts/mobile/assets/app-preview-video-portrait.mp4` |
| Duration | 27 s |
| Resolution | 1290 × 2796 px (iPhone 15 Pro Max portrait) |
| Format | MP4, H.264, CRF 20 |
| Audio | AAC 128k |
| Fill color | `#091734` (app navy background) |
| File size | ~24 MB |

### Uploading to App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com) and open your app.
2. Navigate to **App Store** → select the iOS platform → open the version you are editing.
3. Scroll to **App Previews and Screenshots** and select the **6.7" Display (iPhone 15 Pro Max)** tab.
4. Click **Choose File** (or drag and drop) under **App Previews** and upload `app-preview-video-portrait.mp4`.
5. App Store Connect will transcode the video — this typically takes a few minutes. Once the thumbnail appears, drag the preview poster frame to a visually representative moment.
6. Click **Save** in the top-right corner, then submit your version for review when ready.

> **Apple requirements checklist**
> - Duration: 15–30 s ✓ (27 s)
> - Resolution: 1290 × 2796 px ✓
> - Codec: H.264 ✓
> - Format: MP4 ✓
> - Audio: optional but present (AAC 128k) ✓
> - No black bars or letterboxing ✓ (padded with app navy `#091734`)

### Regenerating the portrait file

If you update the source animation and need a new portrait export, run:

```bash
ffmpeg -y -i artifacts/mobile/assets/app-preview-video.mp4 \
  -vf "scale=1290:2796:force_original_aspect_ratio=decrease,pad=1290:2796:(ow-iw)/2:(oh-ih)/2:color=0x091734,format=yuv420p" \
  -c:v libx264 -preset fast -crf 20 \
  -c:a aac -b:a 128k \
  artifacts/mobile/assets/app-preview-video-portrait.mp4
```

### Regenerating the video

The animated source artifact lives at `artifacts/app-preview-video/`. To regenerate after design changes:

1. Update scene files in `artifacts/app-preview-video/src/components/video/video_scenes/`
2. Re-run the generation script (see that artifact's README) or re-run the ffmpeg pipeline:

```bash
# Step 1 – re-generate AI clips (run from project root in code_execution)
# generateVideo({...}) for each of the 5 clips, output to attached_assets/generated_videos/

# Step 2 – concatenate and scale
ffmpeg -y -f concat -safe 0 -i /tmp/concat.txt \
  -vf "scale=1290:2293,pad=1290:2796:0:251:color=0x091734,format=yuv420p" \
  -c:v libx264 -preset fast -crf 20 -an /tmp/scaled.mp4

# Step 3 – add text overlays + audio (see /tmp/overlay.sh for the full filter)
```

## Regenerating Screenshots

Screenshots are generated programmatically by `/tmp/screenshot-gen/generate.js` using
`@napi-rs/canvas` against the app's design system colors (`constants/colors.ts`).

To regenerate after design changes:

```bash
cd /tmp/screenshot-gen
node generate.js
```

The script reads the color palette directly from the documented design system and renders
each screen at 3× logical scale (1 pt = 3 px, 430pt logical width → 1290px).
