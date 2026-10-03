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
