import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PujaRunnerMode } from '@/machines/pujaRunner.machine';
import { mmkvStorage } from '@/lib/storage';

/**
 * Puja session state (§9.7, §10 Phase 6): where to resume an exited-but-not-
 * finished puja, and a local log of completed ones ("`user_puja_sessions`
 * logged locally" — the Supabase table of the same name is Phase 8's; this
 * is the on-device record every devotee gets regardless of sign-in).
 *
 * `any → EXIT → persisted` (§9.7) is implemented here, not in the machine
 * itself: the machine tracks *where the devotee is*, this store remembers
 * it *between app launches* — the same separation `useChecklistStore` already
 * draws between "current state" and "what survives a relaunch."
 */

export interface PujaResumePoint {
  pujaId: string;
  variant: 'short' | 'full';
  mode: PujaRunnerMode;
  stepIndex: number;
  startedAt: string;
  exitedAt: string;
}

export interface PujaSessionLogEntry {
  id: string;
  pujaId: string;
  variant: 'short' | 'full';
  mode: PujaRunnerMode;
  startedAt: string;
  completedAt: string;
  completedSteps: number;
}

export const SESSION_STORAGE_KEY = 'pujaSessions';

/** How many completed sessions to keep locally before trimming the oldest. */
const MAX_LOG_ENTRIES = 200;

interface PersistedSession {
  resumePoints: Record<string, PujaResumePoint>;
  log: PujaSessionLogEntry[];
}

interface SessionState extends PersistedSession {
  hydrated: boolean;

  resumePointFor: (pujaId: string) => PujaResumePoint | undefined;
  saveResumePoint: (point: PujaResumePoint) => void;
  clearResumePoint: (pujaId: string) => void;
  logCompletedSession: (entry: Omit<PujaSessionLogEntry, 'id'>) => void;
  markHydrated: () => void;
}

function newId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `session_${Date.now().toString(36)}${random}`;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      resumePoints: {},
      log: [],
      hydrated: false,

      resumePointFor: (pujaId) => get().resumePoints[pujaId],

      saveResumePoint: (point) => {
        set({ resumePoints: { ...get().resumePoints, [point.pujaId]: point } });
      },

      clearResumePoint: (pujaId) => {
        const { [pujaId]: _removed, ...rest } = get().resumePoints;
        set({ resumePoints: rest });
      },

      logCompletedSession: (entry) => {
        // A completed puja has nothing left to resume into.
        const { [entry.pujaId]: _removed, ...resumePoints } = get().resumePoints;
        const log = [{ ...entry, id: newId() }, ...get().log].slice(0, MAX_LOG_ENTRIES);
        set({ resumePoints, log });
      },

      markHydrated: () => {
        set({ hydrated: true });
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: mmkvStorage<PersistedSession>(),
      partialize: (state): PersistedSession => ({
        resumePoints: state.resumePoints,
        log: state.log,
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        (state ?? useSessionStore.getState()).markHydrated();
      },
    },
  ),
);
