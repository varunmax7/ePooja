import { createMMKV } from 'react-native-mmkv';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * The app's one MMKV instance, and the zustand adapter over it.
 *
 * MMKV rather than AsyncStorage because the devotee's profile is read on the
 * very first frame — the router decides between onboarding and Today from it —
 * and MMKV reads synchronously. On web (the screenshot harness, §2) MMKV falls
 * back to localStorage, which is synchronous too, so the same code path runs.
 */
export const storage = createMMKV({ id: 'epooja' });

/**
 * A zustand `persist` storage bound to MMKV.
 *
 * A corrupt or half-written value is dropped rather than thrown: a devotee
 * opening the app should land in onboarding, never on a crash screen.
 */
export function mmkvStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      const raw = storage.getString(name);
      if (raw === undefined) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        storage.remove(name);
        return null;
      }
    },
    setItem: (name, value) => {
      storage.set(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      storage.remove(name);
    },
  };
}
