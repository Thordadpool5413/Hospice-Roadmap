const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const BEGIN = "# @generated begin hospice-maps-non-modular-fix";
const END = "# @generated end hospice-maps-non-modular-fix";

/**
 * react-native-maps + ios.config.googleMapsApiKey + useFrameworks: "static"
 * triggers non-modular React header errors on Expo SDK 54 iOS builds.
 * Allow non-modular includes for the maps pods in post_install.
 */
function withIosNonModularHeadersFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) return cfg;

      let contents = fs.readFileSync(podfilePath, "utf8");
      if (contents.includes(BEGIN)) return cfg;

      const snippet = `  ${BEGIN}
  installer.pods_project.targets.each do |target|
    next unless target.name.include?("react-native-maps") ||
      target.name.include?("react_native_maps") ||
      target.name.include?("react-native-google-maps")

    target.build_configurations.each do |bc|
      bc.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
    end
  end
  ${END}
`;

      if (!contents.includes("post_install do |installer|")) {
        throw new Error(
          "withIosNonModularHeadersFix: Could not find post_install hook in Podfile",
        );
      }

      contents = contents.replace(
        /post_install do \|installer\|\n/,
        `post_install do |installer|\n${snippet}`,
      );
      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
}

module.exports = withIosNonModularHeadersFix;