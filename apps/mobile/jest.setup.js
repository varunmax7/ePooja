// react-native-track-player has no JS fallback outside a native build; the puja
// runner tests (Phase 6) drive it through this mock.
jest.mock('react-native-track-player', () => require('./src/services/audio/__mocks__/trackPlayer'));

// The real `SafeAreaProvider` renders its children only after a native
// `onLayout` measurement, which Jest's renderer never fires — a screen under
// it silently renders with no children at all, no error, nothing (Phase 6
// found this the hard way wiring the Chant Player's first render test). The
// library ships exactly this fix for Jest: synchronous `initialMetrics`, no
// measurement wait.
jest.mock('react-native-safe-area-context', () => {
  // Babel's CJS interop puts the mock's `export default` under `.default`;
  // unwrap it so named imports (`useSafeAreaInsets`, `SafeAreaProvider`, …)
  // resolve the same way they do against the real module.
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});

// expo-apple-authentication, expo-web-browser and expo-crypto are thin native
// wrappers with no meaningful JS behaviour to fall back to under Jest; Phase
// 8's `authService.test.ts` overrides individual methods per test with
// `jest.spyOn`, these are just safe defaults so importing the module at all
// doesn't throw.
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(async () => {
    throw new Error('not mocked for this test');
  }),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (count) => new Uint8Array(count)),
  digestStringAsync: jest.fn(async () => 'mock-hashed-nonce'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// `Linking.createURL` resolves the app's URI scheme from the native manifest
// (`expo-constants`), which Jest never builds — real app.config.ts
// resolution is exercised on-device, not here.
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `epooja://${path}`),
}));

// MMKV is a Nitro native module with no JS fallback under Jest. The mock is an
// in-memory Map behind the v4 surface the app uses (`createMMKV`), and is
// exposed on `globalThis` so a test can clear it between cases.
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  globalThis.__mmkvMock = store;

  return {
    createMMKV: () => ({
      set: (key, value) => store.set(key, value),
      getString: (key) => store.get(key),
      getBoolean: (key) => store.get(key),
      getNumber: (key) => store.get(key),
      contains: (key) => store.has(key),
      getAllKeys: () => [...store.keys()],
      remove: (key) => store.delete(key),
      clearAll: () => store.clear(),
    }),
  };
});
