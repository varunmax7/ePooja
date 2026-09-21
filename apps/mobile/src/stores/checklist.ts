import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

/**
 * The Preparation checklist (§8.4), persisted per puja per day.
 *
 * §10 Phase 4: "checklist state survives restart and resets next day." Both
 * halves come from the same decision — the key is `${pujaId}:${date}`, so a
 * relaunch on the same day finds the ticks, and the next day simply misses
 * the key and starts clean. Nothing has to run at midnight, and a devotee
 * who preps at 23:55 and performs at 00:05 keeps yesterday's ticks in
 * yesterday's entry rather than having them vanish mid-ritual.
 */

export const CHECKLIST_STORAGE_KEY = 'checklist';

/** How many days of entries to keep before pruning (see `pruneOldEntries`). */
const KEEP_DAYS = 7;

export function checklistKey(pujaId: string, date: string): string {
  return `${pujaId}:${date}`;
}

interface PersistedChecklist {
  /** `${pujaId}:${yyyy-MM-dd}` → set of checked samagri ids. */
  entries: Record<string, string[]>;
}

interface ChecklistState extends PersistedChecklist {
  hydrated: boolean;

  isChecked: (pujaId: string, date: string, itemId: string) => boolean;
  checkedIds: (pujaId: string, date: string) => string[];
  toggle: (pujaId: string, date: string, itemId: string) => void;
  clearDay: (pujaId: string, date: string) => void;
  /** Drops entries older than `KEEP_DAYS`, so storage cannot grow forever. */
  pruneOldEntries: (today: string) => void;
  markHydrated: () => void;
}

/** `yyyy-MM-dd` string comparison is chronological, so this needs no Date. */
function isOlderThan(key: string, cutoff: string): boolean {
  const date = key.slice(key.indexOf(':') + 1);
  return date < cutoff;
}

function shiftDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      entries: {},
      hydrated: false,

      isChecked: (pujaId, date, itemId) =>
        (get().entries[checklistKey(pujaId, date)] ?? []).includes(itemId),

      checkedIds: (pujaId, date) => get().entries[checklistKey(pujaId, date)] ?? [],

      toggle: (pujaId, date, itemId) => {
        const key = checklistKey(pujaId, date);
        const current = get().entries[key] ?? [];
        const next = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];

        set({ entries: { ...get().entries, [key]: next } });
      },

      clearDay: (pujaId, date) => {
        const { [checklistKey(pujaId, date)]: _removed, ...rest } = get().entries;
        set({ entries: rest });
      },

      pruneOldEntries: (today) => {
        const cutoff = shiftDays(today, -KEEP_DAYS);
        const kept = Object.fromEntries(
          Object.entries(get().entries).filter(([key]) => !isOlderThan(key, cutoff)),
        );
        set({ entries: kept });
      },

      markHydrated: () => {
        set({ hydrated: true });
      },
    }),
    {
      name: CHECKLIST_STORAGE_KEY,
      storage: mmkvStorage<PersistedChecklist>(),
      partialize: (state): PersistedChecklist => ({ entries: state.entries }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        (state ?? useChecklistStore.getState()).markHydrated();
      },
    },
  ),
);
