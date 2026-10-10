import { useEffect } from 'react';
import { supabase, startSupabaseAuthLifecycle } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useDevoteeStore } from '@/stores/devotee';
import { mergeDevoteeOnSignIn, syncDevoteeIfSignedIn } from './syncService';

/** How long to wait after the devotee stops editing before pushing (ms). */
const PUSH_DEBOUNCE_MS = 2000;

function inferProvider(appMetadataProvider: string | undefined): 'google' | 'apple' | null {
  if (appMetadataProvider === 'google') return 'google';
  if (appMetadataProvider === 'apple') return 'apple';
  return null;
}

/**
 * Mounted once at app root (`app/_layout.tsx`). Wires the Supabase session to
 * `useAuthStore`, runs the guest→account merge on sign-in, and pushes local
 * devotee edits while signed in — the three moving parts §10 Phase 8's sync
 * section describes, joined here rather than in any one screen because
 * sign-in can happen from the Account screen but a devotee can keep editing
 * their profile from `/profile/edit` long after that screen is gone.
 */
export function useAuthSync(): void {
  useEffect(() => {
    if (!supabase) {
      useAuthStore.getState().setGuest();
      return;
    }

    const stopLifecycle = startSupabaseAuthLifecycle();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useAuthStore.getState().setSignedIn({
          userId: session.user.id,
          email: session.user.email ?? null,
          provider: inferProvider(session.user.app_metadata?.provider),
        });
        if (event === 'SIGNED_IN') void mergeDevoteeOnSignIn(session.user.id);
      } else {
        useAuthStore.getState().setGuest();
      }
    });

    return () => {
      authSubscription.unsubscribe();
      stopLifecycle();
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useDevoteeStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void syncDevoteeIfSignedIn();
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
