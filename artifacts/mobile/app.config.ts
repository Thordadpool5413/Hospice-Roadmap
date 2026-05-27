import type { ExpoConfig } from "expo/config";
import {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  type ConfigPlugin,
} from "expo/config-plugins";
import * as fs from "node:fs";
import * as path from "node:path";

const devDomain =
  process.env["REPLIT_DEV_DOMAIN"] ||
  process.env["EXPO_PUBLIC_DOMAIN"] ||
  "";

const explicitApiUrl =
  process.env["EXPO_PUBLIC_API_URL"] ||
  (devDomain ? `https://${devDomain}/api` : "");

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
  slug: "mobile",
  owner: "thordadpool",
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
    bundleIdentifier: "com.thordadpool.hospiceroadmap",
    buildNumber: "2",
    appleTeamId: "65C25YHCX9",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Hospice Roadmap uses your microphone so you can speak with Ragna.",
      UIBackgroundModes: ["audio"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "app.replit.hospiceroadmap",
    permissions: ["android.permission.RECORD_AUDIO"],
  },
  web: {
    favicon: "./assets/images/app-icon.png",
    bundler: "metro",
    name: "Hospice Roadmap",
    shortName: "Hospice Roadmap",
    lang: "en",
    themeColor: "#030A18",
    backgroundColor: "#030A18",
    description:
      "Guidance for patients and caregivers before, during, and after hospice care.",
  } as ExpoConfig["web"],
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    "expo-audio",
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
      projectId: "e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
    },
  },
};

export default config;