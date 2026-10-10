import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

/**
 * DPDP Act 2023 consent for sending devotee data off-device (§13, §10 Phase
 * 8). Guest mode needs no consent screen at all — nothing leaves the device
 * until a devotee chooses to sign in — so this is only ever checked
 * immediately before the first sign-in attempt, not during onboarding
 * (§10 Phase 3's onboarding flow and its Maestro test are untouched by this
 * phase on purpose).
 */

export const CONSENT_STORAGE_KEY = 'dpdpConsent';

interface PersistedConsent {
  acceptedAt: string | null;
}

interface ConsentState extends PersistedConsent {
  accept: () => void;
  /** "Delete my data" (§13) should also forget consent, not just the devotee. */
  reset: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      acceptedAt: null,
      accept: () => {
        set({ acceptedAt: new Date().toISOString() });
      },
      reset: () => {
        set({ acceptedAt: null });
      },
    }),
    {
      name: CONSENT_STORAGE_KEY,
      storage: mmkvStorage<PersistedConsent>(),
      partialize: (state): PersistedConsent => ({ acceptedAt: state.acceptedAt }),
      version: 1,
    },
  ),
);

export function hasAcceptedDpdpConsent(state: Pick<ConsentState, 'acceptedAt'>): boolean {
  return state.acceptedAt !== null;
}
