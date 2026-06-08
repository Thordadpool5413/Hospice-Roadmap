import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Custom HTML document for the Expo Router web build.
 *
 * This file is the only way to add arbitrary tags to the <head> of the
 * web output. It is NOT rendered on native — it exists only for the web
 * bundle served by Metro/serve.js.
 *
 * Guidelines:
 * - Keep synchronous <script> tags out of <head> — they block the parser.
 * - Prefer <link rel="preconnect"> over <link rel="prefetch"> for origins
 *   that the app hits immediately on load (API server, fonts).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* ── Viewport ──────────────────────────────────────────────── */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* ── Identity & SEO ────────────────────────────────────────── */}
        <title>Hospice Roadmap — Guidance Before, During & After Hospice</title>
        <meta
          name="description"
          content="Hospice Roadmap helps patients and caregivers navigate every stage of hospice care. Get AI-powered guidance from Ragna, track symptoms, find providers, and access advance directives for all 50 states — no account required."
        />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#0B1730" />

        {/* ── Open Graph ────────────────────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Hospice Roadmap — Guidance Before, During & After Hospice"
        />
        <meta
          property="og:description"
          content="Hospice Roadmap helps patients and caregivers navigate every stage of hospice care. AI guidance, symptom tracking, provider search, and advance directives for all 50 states."
        />
        <meta property="og:site_name" content="Hospice Roadmap" />

        {/* ── Twitter Card ──────────────────────────────────────────── */}
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Hospice Roadmap — Guidance Before, During & After Hospice"
        />
        <meta
          name="twitter:description"
          content="AI-powered hospice guidance for patients and caregivers. No account required."
        />

        {/* ── Performance: early connection to API origin ───────────── */}
        {process.env["EXPO_PUBLIC_DOMAIN"] ? (
          <>
            <link
              rel="preconnect"
              href={`https://${process.env["EXPO_PUBLIC_DOMAIN"]}`}
            />
            <link
              rel="dns-prefetch"
              href={`https://${process.env["EXPO_PUBLIC_DOMAIN"]}`}
            />
          </>
        ) : null}

        {/* ── Performance: Google Fonts preconnect ──────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* ── Fixes React Native Web scroll behavior ────────────────── */}
        <ScrollViewStyleReset />

        {/* ── Prevent flash of unstyled background ──────────────────── */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { background-color: #0B1730; height: 100%; }
              body { overflow: hidden; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

