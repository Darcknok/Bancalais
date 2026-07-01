/**
 * Expo Config Plugin — Force cleartext traffic on Android
 *
 * Double sécurité : injecte `android:usesCleartextTraffic="true"`
 * directement dans le <application> du AndroidManifest.xml.
 *
 * Résout sur Android 9+ :
 *   "Clear text communication to ... not permitted by network security policy"
 */
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidCleartext(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const mainApp = androidConfig.modResults.manifest.application?.[0];
    if (mainApp?.$) {
      // Force explicit cleartext permission (double sécurité)
      mainApp.$['android:usesCleartextTraffic'] = 'true';
    }
    return androidConfig;
  });
};
