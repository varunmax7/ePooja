import { create } from 'zustand';

/**
 * A read-only mirror of the Supabase auth session (§10 Phase 8), kept in its
 * own store rather than inside `useDevoteeStore` because signing out must
 * never touch the devotee's local ritual data (§5, guest-first: the account
 * is Supabase's concern, the profile is the devotee's own regardless).
 *
 * Nothing here is persisted — `supabase-js` already persists the session
 * itself (`lib/supabase.ts`'s MMKV-backed storage adapter); this store is
 * rebuilt from `supabase.auth.onAuthStateChange` every launch
 * (`services/sync/useAuthSync.ts`), which also means a devotee is never
 * shown a stale "signed in as…" from a session that has since expired.
 */

export type AuthStatus = 'loading' | 'guest' | 'signed_in';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  provider: 'google' | 'apple' | null;
  /** Set by `syncService` after a successful push or pull; shown in Account & Sync. */
  lastSyncedAt: string | null;

  setSignedIn: (params: {
    userId: string;
    email: string | null;
    provider: 'google' | 'apple' | null;
  }) => void;
  setGuest: () => void;
  setLastSyncedAt: (iso: string) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  userId: null,
  email: null,
  provider: null,
  lastSyncedAt: null,

  setSignedIn: ({ userId, email, provider }) => {
    set({ status: 'signed_in', userId, email, provider });
  },

  setGuest: () => {
    set({ status: 'guest', userId: null, email: null, provider: null, lastSyncedAt: null });
  },

  setLastSyncedAt: (iso) => {
    set({ lastSyncedAt: iso });
  },
}));
