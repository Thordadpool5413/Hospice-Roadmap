import type { ExpoConfig } from "expo/config";

const devDomain =
  process.env["REPLIT_DEV_DOMAIN"] ||
  process.env["EXPO_PUBLIC_DOMAIN"] ||
  "";

const explicitApiUrl =
  process.env["EXPO_PUBLIC_API_URL"] ||
  (devDomain ? `https://${devDomain}/api` : "");

const clerkPublishableKey =
  process.env["EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"] ||
  process.env["CLERK_PUBLISHABLE_KEY"] ||
  "";
const clerkProxyUrl =
  process.env["EXPO_PUBLIC_CLERK_PROXY_URL"] ||
  process.env["CLERK_PROXY_URL"] ||
  "";

const googleMapsApiKey = process.env["GOOGLE_MAPS_API_KEY"] || "";
const easBuildProfile = process.env["EAS_BUILD_PROFILE"] || "";
const requiresHostedApiConfig =
  easBuildProfile === "preview" || easBuildProfile === "production";

if (requiresHostedApiConfig && !explicitApiUrl) {
  throw new Error(
    "[app.config] Missing API configuration for preview/production build. Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN before shipping the mobile app.",
  );
}

if (requiresHostedApiConfig && !clerkPublishableKey) {
  throw new Error(
    "[app.config] Missing Clerk publishable key for preview/production build. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY or CLERK_PUBLISHABLE_KEY.",
  );
}

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
    config: {
      googleMapsApiKey,
    },
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Hospice Roadmap uses your microphone so you can speak with Ragna.",
      UIBackgroundModes: ["audio", "fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "app.replit.hospiceroadmap",
    permissions: ["android.permission.RECORD_AUDIO"],
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
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
    "expo-notifications",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Hospice Roadmap to access your location for care coordination, reminders, and emergency features.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: explicitApiUrl || undefined,
    domain: devDomain || undefined,
    clerkPublishableKey: clerkPublishableKey || undefined,
    clerkProxyUrl: clerkProxyUrl || undefined,
    eas: {
      projectId: "e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
    },
  },
};

export default config;