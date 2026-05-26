import type { ExpoConfig } from "expo/config";

const devDomain = process.env["REPLIT_DEV_DOMAIN"] || process.env["EXPO_PUBLIC_DOMAIN"] || "";
const explicitApiUrl = process.env["EXPO_PUBLIC_API_URL"] || (devDomain ? `https://${devDomain}/api` : "");

const config: ExpoConfig = {
  name: "Hospice Roadmap",
  slug: "mobile",
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
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Hospice Roadmap uses your microphone so you can speak with Ragna.",
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: explicitApiUrl || undefined,
    domain: devDomain || undefined,
  },
};

export default config;
