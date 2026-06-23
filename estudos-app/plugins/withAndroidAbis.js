// Limits the Android APK to arm64-v8a only (every phone from ~2018 onward),
// dropping armeabi-v7a/x86/x86_64 for the smallest possible APK.
const { withGradleProperties } = require('expo/config-plugins');

const ABIS = 'arm64-v8a';

module.exports = function withAndroidAbis(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures')
    );
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: ABIS });
    return cfg;
  });
};
