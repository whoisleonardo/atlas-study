// Limits the Android APK to real phone ABIs (arm64-v8a, armeabi-v7a),
// dropping x86/x86_64 (emulator-only) to roughly halve the APK size.
const { withGradleProperties } = require('expo/config-plugins');

const ABIS = 'arm64-v8a,armeabi-v7a';

module.exports = function withAndroidAbis(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures')
    );
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: ABIS });
    return cfg;
  });
};
