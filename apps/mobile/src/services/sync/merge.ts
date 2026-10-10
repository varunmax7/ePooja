import type { Devotee } from '@epooja/content';

/**
 * Last-write-wins for the devotee profile (§10 Phase 8: "Sync: last-write-wins
 * on `devotee` with `updated_at`; guest → account merge on first sign-in").
 *
 * Deliberately compares `devotee.updatedAt` — the field already inside the
 * JSON, bumped by every `useDevoteeStore` action — rather than either side's
 * notion of "when did the server receive this write." Two devices can have
 * clocks that disagree with the server by different amounts; they cannot
 * disagree with *themselves* about which of their own edits came later, and
 * that's the only comparison last-write-wins actually needs.
 *
 * Pulled out of `syncService.ts` because this is the one part of the sign-in
 * merge that has no network, storage or Supabase call in it at all — every
 * other part of that merge is IO this function is deliberately ignorant of.
 */
export type DevoteeMergeDecision =
  { action: 'none' } | { action: 'push'; devotee: Devotee } | { action: 'pull'; devotee: Devotee };

export function resolveDevoteeMerge(
  local: Devotee | null,
  remote: Devotee | null,
): DevoteeMergeDecision {
  if (local !== null && remote !== null) {
    // Both exist: §10 says last-write-wins. A tie pushes — re-upserting an
    // identical row is a no-op server-side, and it means "local wins ties"
    // rather than needing a third outcome for a case that changes nothing.
    const localTime = Date.parse(local.updatedAt);
    const remoteTime = Date.parse(remote.updatedAt);
    return remoteTime > localTime
      ? { action: 'pull', devotee: remote }
      : { action: 'push', devotee: local };
  }

  if (local !== null) return { action: 'push', devotee: local };
  if (remote !== null) return { action: 'pull', devotee: remote };
  return { action: 'none' };
}
