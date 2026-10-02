const { withEntitlementsPlist } = require("expo/config-plugins");
const appJson = require("./app.json");

// Free Apple "Personal Team" accounts can't sign the Push Notifications capability. With NO_PUSH=1 the
// `aps-environment` entitlement is dropped so the app still builds (local reminders + inbox keep working).
const withoutPush = (config) =>
  withEntitlementsPlist(config, (c) => {
    delete c.modResults["aps-environment"];
    return c;
  });

module.exports = () => {
  const config = appJson.expo;
  if (process.env.NO_PUSH !== "1") return config;
  // Mods run in reverse order of registration, so this goes first to run after expo-notifications.
  return withoutPush({ ...config, plugins: config.plugins });
};
