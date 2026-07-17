/**
 * Expo Config Plugin — Control cleartext traffic on Android
 *
 * Injecte `android:usesCleartextTraffic="false"`
 * directement dans le <application> du AndroidManifest.xml.
 *
 * En production, le trafic clair est désactivé pour la sécurité.
 * Le protocole HTTPS est utilisé par défaut côté client.
 */
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidCleartext(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const mainApp = androidConfig.modResults.manifest.application?.[0];
    if (mainApp?.$) {
      // Désactiver le trafic clair (sécurité)
      mainApp.$['android:usesCleartextTraffic'] = 'false';
    }
    return androidConfig;
  });
};
