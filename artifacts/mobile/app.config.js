module.exports = ({ config }) => {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const revenueCatIosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";

  return {
    ...config,

    name: "Hospice Roadmap",
    slug: "hospice-roadmap",
    version: config.version || "0.0.0",

    extra: {
      clerkPublishableKey,
      revenueCatIosKey,
      ...(config.extra || {}),
      eas: {
        projectId: "e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc"
      }
    },

    ios: {
      ...(config.ios || {}),
      bundleIdentifier: "com.thordadpool.hospiceroadmap",
      supportsTablet: true,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false
      }
    },

    updates: {
      url: "https://u.expo.dev/e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc"
    },

    runtimeVersion: {
      policy: "appVersion"
    }
  };
};