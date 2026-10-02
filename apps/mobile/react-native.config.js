/**
 * Native libraries that only the iOS build uses are left out of Android, so they don't add size or build time.
 * `react-native-nitro-modules` is a dependency of the HealthKit library (iOS only); Android reads health
 * data through Health Connect instead.
 */
module.exports = {
  dependencies: {
    "react-native-nitro-modules": { platforms: { android: null } },
  },
};
