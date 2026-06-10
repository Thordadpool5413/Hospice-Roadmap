module.exports = ({ config }) => {
  return {
    ...config,

    name: config.name || "mobile",
    slug: "mobile",
    version: config.version || "0.0.0",

    ios: {
      ...(config.ios || {}),
      bundleIdentifier: "com.thordadpool.hospiceroadmap",
      supportsTablet: true,
    },

    updates: {
      url: "https://u.expo.dev/e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    extra: {
      ...(config.extra || {}),
      eas: {
        ...(config.extra?.eas || {}),
        projectId: "e7ae5f0d-bf17-4a80-bd14-de95a58a7cdc",
      },
    },
  };
};
