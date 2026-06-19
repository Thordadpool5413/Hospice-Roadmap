/**
 * Writes artifacts/mobile/.env.local before Metro starts.
 *
 * EXPO_PUBLIC_* variables are baked into the JS bundle at Metro compile-time.
 * Relying on inline shell variable expansion in npm scripts is fragile inside
 * Replit's workflow runner, so we use Node.js — which always has access to
 * process.env — to write the values to a .env.local file that Expo/Metro will
 * read automatically via @expo/env.
 *
 * This file must stay dependency-free (plain Node.js built-ins only).
 */

const fs = require("fs");
const path = require("path");

const devDomain = process.env.REPLIT_DEV_DOMAIN || "";
const expoDevDomain = process.env.REPLIT_EXPO_DEV_DOMAIN || devDomain;
const replId = process.env.REPL_ID || "";
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || "";
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";
const rcTestApiKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || "";
const rcIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const rcAndroidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

if (!devDomain) {
  console.warn("[write-env] REPLIT_DEV_DOMAIN is not set — using localhost fallback");
}

const lines = [
  `EXPO_PUBLIC_BETA_OVERRIDE_PREMIUM=true`,
  `EXPO_PUBLIC_REPL_ID=${replId}`,
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=${clerkPublishableKey}`,
  `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=${googleMapsApiKey}`,
  `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=${rcTestApiKey}`,
  `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=${rcIosApiKey}`,
  `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=${rcAndroidApiKey}`,
];

if (devDomain) {
  lines.unshift(`EXPO_PUBLIC_DOMAIN=${devDomain}`);
  lines.unshift(`EXPO_PUBLIC_API_URL=https://${devDomain}/api`);
  lines.push(`REACT_NATIVE_PACKAGER_HOSTNAME=${devDomain}`);
}

if (expoDevDomain) {
  lines.push(`EXPO_PACKAGER_PROXY_URL=https://${expoDevDomain}`);
}

const envPath = path.join(__dirname, "..", ".env.local");
fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");

console.log(`[write-env] Wrote ${envPath}`);
lines.forEach((l) => {
  // Mask secret values in logs
  if (l.includes("KEY=")) {
    const [k] = l.split("=");
    console.log(`[write-env]   ${k}=***`);
  } else {
    console.log(`[write-env]   ${l}`);
  }
});
