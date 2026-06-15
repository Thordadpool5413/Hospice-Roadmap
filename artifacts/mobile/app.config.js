module.exports = ({ config }) => {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const revenueCatIosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";

  return {
    ...config,

    name: "Hospice Roadmap",
    slug: "hospice-roadmap",
    version: config.version || "0.0.0",

    // Custom icon and splash are temporarily disabled until you add the PNG files
    // icon: "./assets/ragna.png",
    // splash: {
    //   image: "./assets/hospice-roadmap.png",
    //   resizeMode: "contain",
    //   backgroundColor: "#030A18"
    // },

    ios: {
      ...(config.ios || {}),
      bundleIdentifier: "com.thordadpool.hospiceroadmap",
      supportsTablet: true,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["fetch", "remote-notification"],
      },
    },

    plugins: [
      "expo-notifications",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Hospice Roadmap to access your location for care coordination, reminders, and emergency features.",
        },
      ],
    ],

    updates: {
      url: "https://u.expo.dev/e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    extra: {
      clerkPublishableKey,
      revenueCatIosKey,
      ...(config.extra || {}),
      eas: {
        ...(config.extra?.eas || {}),
        projectId: "e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
      },
    },
  };
};