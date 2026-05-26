import type { ExpoConfig } from "expo/config";
import {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  type ConfigPlugin,
} from "expo/config-plugins";
import * as fs from "node:fs";
import * as path from "node:path";

const devDomain = process.env["REPLIT_DEV_DOMAIN"] || process.env["EXPO_PUBLIC_DOMAIN"] || "";
const explicitApiUrl = process.env["EXPO_PUBLIC_API_URL"] || (devDomain ? `https://${devDomain}/api` : "");

/**
 * Inline config plugin that registers the app as an Android Auto -compatible
 * media app. Two pieces are required:
 *
 *   1. `<meta-data android:name="com.google.android.gms.car.application"
 *        android:resource="@xml/automotive_app_desc"/>` on the application
 *      so Android Auto / Google Assistant discover the app.
 *   2. `res/xml/automotive_app_desc.xml` declaring `<uses name="media"/>` so
 *      the system knows the app surfaces a media session (expo-audio's
 *      MediaSessionService) that car head-units can drive.
 *
 * The actual MediaSession that routes transport-button presses to the
 * underlying ExoPlayer is provided by expo-audio's AudioControlsService,
 * which is already declared in its manifest. We just need to mark this app
 * as Auto-compatible so Auto picks it up.
 */
const withAndroidAutoMedia: ConfigPlugin = (config) => {
  const withManifest = withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    application["meta-data"] = application["meta-data"] ?? [];
    const exists = application["meta-data"].some(
      (entry) =>
        entry.$?.["android:name"] === "com.google.android.gms.car.application",
    );
    if (!exists) {
      application["meta-data"].push({
        $: {
          "android:name": "com.google.android.gms.car.application",
          "android:resource": "@xml/automotive_app_desc",
        },
      });
    }
    return cfg;
  });

  return withDangerousMod(withManifest, [
    "android",
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(xmlDir, "automotive_app_desc.xml"),
        `<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n  <uses name="media" />\n</automotiveApp>\n`,
        "utf-8",
      );
      return cfg;
    },
  ]);
};

const config: ExpoConfig = {
  name: "Hospice Roadmap",
  slug: "hospice-roadmap",
  owner: "replit-private-c0344c06-b30a-4e7f-b327-c799858e3062",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/app-icon.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/app-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1A1840",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.replit.hospiceroadmap",
    appleTeamId: "65C25YHCX9",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Hospice Roadmap uses your microphone so you can speak with Ragna.",
      // `audio` is sufficient for AirPods / Bluetooth / CarPlay Now-Playing
      // transport controls to drive playback while the app is backgrounded
      // or the device is locked. A full CarPlay audio-app integration would
      // additionally require Apple's CarPlay entitlement, which is granted
      // on request per-app; without it, Ragna still appears on the CarPlay
      // "Now Playing" screen because expo-audio publishes MPNowPlayingInfo
      // whenever a player is registered for lock-screen control.
      UIBackgroundModes: ["audio"],
      // Declare we use no non-exempt encryption (only standard HTTPS) so
      // App Store Connect skips the annual encryption-export questionnaire.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "app.replit.hospiceroadmap",
    permissions: ["android.permission.RECORD_AUDIO"],
  },
  web: {
    favicon: "./assets/images/app-icon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://replit.com/",
      },
    ],
    "expo-font",
    "expo-web-browser",
    "expo-audio",
    // Inline ConfigPlugin functions are supported at runtime by Expo's
    // config resolver but aren't part of the public ExpoConfig type.
    withAndroidAutoMedia as unknown as string,
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: explicitApiUrl || undefined,
    domain: devDomain || undefined,
    eas: {
      projectId: "ea50fe69-6016-4c8e-8675-1fce10926f64",
    },
  },
};

export default config;
