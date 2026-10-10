import { devoteeSchema, type Devotee } from '@epooja/content';
import { supabase } from '@/lib/supabase';
import { useDevoteeStore } from '@/stores/devotee';
import { useAuthStore } from '@/stores/auth';
import type { PujaSessionLogEntry } from '@/stores/session';
import { resolveDevoteeMerge } from './merge';

/**
 * The Supabase-calling half of sync (§10 Phase 8); `merge.ts` is the pure
 * half. Every function here is best-effort: a failed push or pull is logged
 * and swallowed, never surfaced as a blocking error, because §17 (offline-
 * first) applies just as much to "I just signed in on the subway" as it does
 * to a puja in progress.
 */

async function fetchRemoteDevotee(userId: string): Promise<Devotee | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('devotee')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = devoteeSchema.safeParse(data.devotee);
  // A row that doesn't parse (an older app version's shape, a hand-edited
  // row) is treated the same as no row — pushing local over it is correct
  // either way, and is exactly what `resolveDevoteeMerge` does with `null`.
  return parsed.success ? parsed.data : null;
}

export async function pushDevotee(userId: string, devotee: Devotee): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, devotee }, { onConflict: 'id' });

  if (error) {
    console.error('syncService.pushDevotee failed', error.message);
    return false;
  }
  return true;
}

/**
 * Runs once per sign-in (§10: "guest → account merge on first sign-in").
 * Resolves local-vs-remote with last-write-wins and leaves exactly one side
 * updated — never both, and never a silent third state.
 */
export async function mergeDevoteeOnSignIn(userId: string): Promise<void> {
  const local = useDevoteeStore.getState().devotee;
  const remote = await fetchRemoteDevotee(userId);
  const decision = resolveDevoteeMerge(local, remote);

  if (decision.action === 'none') return;

  if (decision.action === 'pull') {
    useDevoteeStore.setState({ devotee: decision.devotee, onboardedAt: new Date().toISOString() });
  } else {
    await pushDevotee(userId, decision.devotee);
  }

  useAuthStore.getState().setLastSyncedAt(new Date().toISOString());
}

/**
 * Fire-and-forget: a completed puja is already durable in
 * `useSessionStore`'s local log regardless of whether this ever reaches the
 * server (§9.7's own note — "`user_puja_sessions` logged locally").
 */
export async function pushCompletedSession(
  userId: string,
  entry: Omit<PujaSessionLogEntry, 'id'>,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('puja_sessions').insert({
    user_id: userId,
    puja_id: entry.pujaId,
    variant: entry.variant,
    mode: entry.mode,
    started_at: entry.startedAt,
    completed_at: entry.completedAt,
    completed_steps: entry.completedSteps,
  });

  if (error) console.error('syncService.pushCompletedSession failed', error.message);
}

/**
 * Pushes the current devotee record, debounced upstream by
 * `useAuthSync.ts` — called on every local edit while signed in, so sync
 * never requires the devotee to find and tap a "Sync now" button.
 */
export async function syncDevoteeIfSignedIn(): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.status !== 'signed_in' || !auth.userId) return;

  const devotee = useDevoteeStore.getState().devotee;
  if (!devotee) return;

  const pushed = await pushDevotee(auth.userId, devotee);
  if (pushed) useAuthStore.getState().setLastSyncedAt(new Date().toISOString());
}
