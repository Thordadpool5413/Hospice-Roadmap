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

## Top Branding Element

Each screenshot has a compact top branding bar (210 px tall at 1290 px wide) containing:

| Element | Details |
|---|---|
| App icon | `artifacts/mobile/assets/images/app-icon.png`, resized to 110 × 110 px with iOS-style rounded corners (22 px radius) |
| Wordmark | "Hospice Roadmap" in `#F3F6FF` (txtPrimary), DejaVu Sans Bold 52 pt |
| Background | Solid `#091734` (app navy, bg0) — seamlessly matches the app's dark background |
| Layout | Icon + wordmark centered horizontally as a unit; vertically centered with a slight 8 px downward nudge |

The top element is visually distinct from the bottom headline overlays: smaller scale, icon-led, centered, and anchored to the navigation area rather than the content area.

### Regenerating the top branding

Run the ImageMagick script `/tmp/add-top-branding.sh` (or recreate it from the command below):

```bash
# Quick regeneration — run from project root after modifying app icon or wordmark
SCREENSHOT_DIR="artifacts/mobile/assets/screenshots"
ICON_SRC="artifacts/mobile/assets/images/app-icon.png"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ICON_SIZE=110; RADIUS=22; FONT_SIZE=52; BAR_H=210; IMG_W=1290

# 1. Rounded icon
magick "$ICON_SRC" -resize ${ICON_SIZE}x${ICON_SIZE}! \
  \( +clone -alpha opaque -fill black -colorize 100 \
     -fill white -draw "roundrectangle 0,0 $((ICON_SIZE-1)),$((ICON_SIZE-1)) $RADIUS,$RADIUS" \) \
  -compose DstIn -composite /tmp/icon-rounded.png

# 2. Text label
magick -background none -fill "#F3F6FF" -font "$FONT" -pointsize $FONT_SIZE \
  label:"Hospice Roadmap" /tmp/label.png
LABEL_W=$(identify -format '%w' /tmp/label.png); LABEL_H=$(identify -format '%h' /tmp/label.png)

# 3. Branding strip (icon + text side-by-side)
STRIP_W=$((ICON_SIZE + 24 + LABEL_W)); TEXT_Y=$(( (ICON_SIZE - LABEL_H) / 2 ))
magick -size ${STRIP_W}x${ICON_SIZE} xc:none \
  /tmp/icon-rounded.png -geometry +0+0 -composite \
  /tmp/label.png -geometry +$((ICON_SIZE + 24))+${TEXT_Y} -composite \
  /tmp/branding-strip.png
ACTUAL_W=$(identify -format '%w' /tmp/branding-strip.png)

# 4. Apply to each screenshot
BRAND_X=$(( (IMG_W - ACTUAL_W) / 2 ))
BRAND_Y=$(( (BAR_H - ICON_SIZE) / 2 + 8 ))
for f in 01-home 02-ragna-chat 03-situation-finder 04-symptom-tracker 05-emergency-card; do
  magick "$SCREENSHOT_DIR/${f}.png" \
    \( -size ${IMG_W}x${BAR_H} xc:"#091734" \) -gravity NorthWest -composite \
    /tmp/branding-strip.png -gravity NorthWest -geometry +${BRAND_X}+${BRAND_Y} -composite \
    "$SCREENSHOT_DIR/${f}.png"
done
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

> **Note:** After running `generate.js`, re-apply the top branding by running the regeneration
> snippet above (or `/tmp/add-top-branding.sh` if it is still present).
