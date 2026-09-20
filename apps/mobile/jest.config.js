/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFiles: [
    // Skia is a JSI native module; its own setup installs a CanvasKit-backed
    // stand-in so component trees containing <Canvas> can render in Jest.
    '@shopify/react-native-skia/jestSetup.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|sentry-expo|native-base|react-native-svg|@shopify/react-native-skia|nativewind|react-native-css-interop|react-native-track-player|@epooja/.*)',
  ],
  collectCoverageFrom: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
};
