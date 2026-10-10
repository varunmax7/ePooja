import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { storage } from './storage';

/**
 * The one Supabase client (§10 Phase 8), or `null` when no project is
 * configured — the app is guest-first (§5), so every call site that reaches
 * for `supabase` must already be behind `env.hasSupabase` and treat `null`
 * as "sign-in/sync is simply unavailable," never as an error to surface.
 *
 * Auth tokens are stored in the same MMKV instance as everything else
 * (`lib/storage.ts`), wrapped to the async `{getItem,setItem,removeItem}`
 * shape `supabase-js` expects — MMKV itself is synchronous, but wrapping it
 * costs nothing and keeps this file honest about the interface it's filling.
 */
const mmkvAuthStorage = {
  getItem: (key: string) => Promise.resolve(storage.getString(key) ?? null),
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    storage.remove(key);
    return Promise.resolve();
  },
};

export const supabase: SupabaseClient | null = env.hasSupabase
  ? createClient(env.EXPO_PUBLIC_SUPABASE_URL!, env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        storage: mmkvAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        // The app reads the OAuth redirect URL itself (`services/auth`) and
        // calls `setSession` explicitly; letting the client also try to
        // detect a session in a URL would be reading a URL that doesn't
        // exist in a React Native runtime.
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Supabase's own recipe for React Native: token auto-refresh is a setInterval
 * under the hood, which keeps running (and keeps failing, loudly, into Sentry)
 * while the app is backgrounded with no network. Call once, near app start.
 */
export function startSupabaseAuthLifecycle(): () => void {
  if (!supabase) return () => {};

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });

  if (AppState.currentState === 'active') void supabase.auth.startAutoRefresh();

  return () => {
    subscription.remove();
  };
}
