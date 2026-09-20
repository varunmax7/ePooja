import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  devoteeSchema,
  type Devotee,
  type DevoteeLocation,
  type DevoteePrefs,
  type FamilyMember,
} from '@epooja/content';
import { mmkvStorage } from '@/lib/storage';

/**
 * The devotee's own record (§9.4), persisted to MMKV.
 *
 * This is the store the router reads on the first frame to decide between
 * onboarding and Today, so it is deliberately synchronous and small. Nothing
 * here talks to the network: a devotee's profile is theirs, on their device,
 * until they choose to sign in (§5, guest-first).
 */

export const DEVOTEE_STORAGE_KEY = 'devotee';

/** The slice that reaches MMKV; the actions and `hydrated` are rebuilt on boot. */
interface PersistedDevotee {
  devotee: Devotee | null;
  onboardedAt: string | null;
}

interface DevoteeState {
  devotee: Devotee | null;
  /** Set once the §8.1 flow has been walked to the end. */
  onboardedAt: string | null;
  /** False until MMKV has been read; the router waits for it. */
  hydrated: boolean;

  createDevotee: (draft: NewDevotee) => void;
  updateDevotee: (patch: Partial<Omit<Devotee, 'id' | 'family' | 'createdAt'>>) => void;
  setLocation: (location: DevoteeLocation) => void;
  setPrefs: (prefs: Partial<DevoteePrefs>) => void;

  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => string;
  updateFamilyMember: (id: string, patch: Partial<Omit<FamilyMember, 'id'>>) => void;
  removeFamilyMember: (id: string) => void;

  completeOnboarding: () => void;
  /** Wipes the record — "delete my data" (§13) and the test reset. */
  reset: () => void;
  /** Called by `persist` once MMKV has been read. */
  markHydrated: () => void;
}

export type NewDevotee = Omit<
  Devotee,
  'id' | 'family' | 'createdAt' | 'updatedAt' | 'prefs'
> & {
  prefs?: Partial<DevoteePrefs>;
};

export const DEFAULT_PREFS: DevoteePrefs = {
  uiLang: 'en',
  mantraScript: 'te',
  showTransliteration: true,
  // §9.6.1: no cloned voice unless the devotee asks for one.
  nameAudio: 'self_recite',
};

/**
 * Ids are random and local. `crypto.randomUUID` is not in every React Native
 * runtime, so this is a small explicit generator rather than a dependency.
 */
function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

const now = (): string => new Date().toISOString();

export const useDevoteeStore = create<DevoteeState>()(
  persist(
    (set, get) => ({
      devotee: null,
      onboardedAt: null,
      hydrated: false,

      createDevotee: (draft) => {
        const timestamp = now();
        set({
          devotee: {
            ...draft,
            id: newId('devotee'),
            family: [],
            prefs: { ...DEFAULT_PREFS, ...draft.prefs },
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      },

      updateDevotee: (patch) => {
        const current = get().devotee;
        if (!current) return;
        set({ devotee: { ...current, ...patch, updatedAt: now() } });
      },

      setLocation: (location) => {
        get().updateDevotee({ location });
      },

      setPrefs: (prefs) => {
        const current = get().devotee;
        if (!current) return;
        set({ devotee: { ...current, prefs: { ...current.prefs, ...prefs }, updatedAt: now() } });
      },

      addFamilyMember: (member) => {
        const current = get().devotee;
        const id = newId('member');
        if (!current) return id;
        set({
          devotee: {
            ...current,
            family: [...current.family, { ...member, id }],
            updatedAt: now(),
          },
        });
        return id;
      },

      updateFamilyMember: (id, patch) => {
        const current = get().devotee;
        if (!current) return;
        set({
          devotee: {
            ...current,
            family: current.family.map((m) => (m.id === id ? { ...m, ...patch } : m)),
            updatedAt: now(),
          },
        });
      },

      removeFamilyMember: (id) => {
        const current = get().devotee;
        if (!current) return;
        set({
          devotee: {
            ...current,
            family: current.family.filter((m) => m.id !== id),
            updatedAt: now(),
          },
        });
      },

      completeOnboarding: () => {
        if (!get().devotee) return;
        set({ onboardedAt: now() });
      },

      reset: () => {
        set({ devotee: null, onboardedAt: null });
      },

      markHydrated: () => {
        set({ hydrated: true });
      },
    }),
    {
      name: DEVOTEE_STORAGE_KEY,
      storage: mmkvStorage<PersistedDevotee>(),
      partialize: (state): PersistedDevotee => ({
        devotee: state.devotee,
        onboardedAt: state.onboardedAt,
      }),
      version: 1,
      /**
       * A stored record that no longer matches §9.4 is dropped, not patched.
       * Landing in onboarding costs a minute; a silently wrong gotra would be
       * spoken aloud in every Sankalpam from then on.
       */
      merge: (persisted, current) => {
        const stored = persisted as Partial<PersistedDevotee> | undefined;
        const parsed = devoteeSchema.safeParse(stored?.devotee);

        if (!parsed.success) return { ...current, devotee: null, onboardedAt: null };
        return { ...current, devotee: parsed.data, onboardedAt: stored?.onboardedAt ?? null };
      },
      /**
       * Fires whether or not anything was stored, so a first-run devotee is
       * not left waiting on a splash that never resolves.
       */
      onRehydrateStorage: () => (state) => {
        (state ?? useDevoteeStore.getState()).markHydrated();
      },
    },
  ),
);

/** True once the §8.1 flow has been completed and a devotee exists. */
export function hasOnboarded(state: Pick<DevoteeState, 'devotee' | 'onboardedAt'>): boolean {
  return state.devotee !== null && state.onboardedAt !== null;
}
