// react-native-track-player has no JS fallback outside a native build; the puja
// runner tests (Phase 6) drive it through this mock.
jest.mock('react-native-track-player', () => require('./src/services/audio/__mocks__/trackPlayer'));

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: class {
      set(key, value) {
        store.set(key, value);
      }
      getString(key) {
        return store.get(key);
      }
      getBoolean(key) {
        return store.get(key);
      }
      getNumber(key) {
        return store.get(key);
      }
      delete(key) {
        store.delete(key);
      }
      clearAll() {
        store.clear();
      }
    },
  };
});
