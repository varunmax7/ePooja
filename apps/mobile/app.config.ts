import type { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_ID = 'com.epooja.app';
const APP_NAME = 'ePooja';

/**
 * Expo app config (implementation.md §10 Phase 0).
 * Expo Go is not supported — RNTP, MMKV and Skia need native code, so all
 * testing happens on EAS development builds (§4).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'epooja',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'epooja',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      // Background audio keeps the chant playing with the screen locked (§9.6).
      UIBackgroundModes: ['audio'],
      NSLocationWhenInUseUsageDescription:
        'ePooja uses your location to compute the local Panchangam (sunrise, tithi, nakshatram) and to say your Sankalpam with the correct place.',
      NSUserNotificationsUsageDescription:
        'ePooja reminds you of daily puja times and auspicious timings computed for your location.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#4A0F1E',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'POST_NOTIFICATIONS',
      'WAKE_LOCK',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM',
    ],
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      // SDK 54+ configures the splash screen through the plugin, not a top-level key.
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#4A0F1E',
      },
    ],
    'expo-localization',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'ePooja uses your location to compute the local Panchangam and Sankalpam.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#4A0F1E',
      },
    ],
    'expo-font',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      // Filled in by `eas init`; kept out of source control history until then.
      projectId: process.env.EAS_PROJECT_ID ?? undefined,
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
});
