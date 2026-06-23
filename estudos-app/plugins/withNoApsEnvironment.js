// Removes the `aps-environment` entitlement (remote push) so the app can be
// signed with a free/personal Apple team. Local notifications (reminders)
// don't need it. Runs after expo-notifications, undoing the entitlement it adds.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withNoApsEnvironment(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
