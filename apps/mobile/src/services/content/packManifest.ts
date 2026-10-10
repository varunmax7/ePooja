import { z } from 'zod';
import { env } from '@/lib/env';

/**
 * The `pack-manifest` Edge Function's response (§10 Phase 8): "returns the
 * latest packs per channel; the app diff-downloads." Parsed with zod like
 * every other IO boundary in the app (AGENTS.md rule 11) — this is the one
 * response the app trusts a server for at all.
 */
export const packManifestEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  manifestUrl: z.string().url(),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string().min(1),
  publishedAt: z.string(),
});

export type PackManifestEntry = z.infer<typeof packManifestEntrySchema>;

const packManifestResponseSchema = z.object({
  channel: z.enum(['preview', 'production']),
  packs: z.array(packManifestEntrySchema),
});

export type PackManifestResponse = z.infer<typeof packManifestResponseSchema>;

/** Which channel this build should ask for — mirrors how it was published (§10). */
export function currentChannel(): 'preview' | 'production' {
  return env.APP_ENV === 'production' ? 'production' : 'preview';
}

/**
 * `null` covers every reason this can fail to produce a manifest — no
 * backend configured, offline, a malformed response — because every caller
 * treats "no manifest available" as one outcome: keep using what's already
 * installed (§17, offline-first).
 */
export async function fetchPackManifest(
  channel: 'preview' | 'production' = currentChannel(),
): Promise<PackManifestResponse | null> {
  if (!env.hasSupabase) return null;

  try {
    const url = `${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/pack-manifest?channel=${channel}`;
    const response = await fetch(url, {
      headers: {
        apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
      },
    });
    if (!response.ok) return null;

    const parsed = packManifestResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
