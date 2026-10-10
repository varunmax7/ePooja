// Deno Edge Function — deploy with `supabase functions deploy pack-manifest`.
//
// §10 Phase 8: "`pack-manifest` Edge Function returns the latest packs per
// channel; the app diff-downloads." Called with the anon key (public read is
// fine: `content_packs` has an RLS policy allowing it directly, so this
// function adds no privilege the table doesn't already grant — its job is
// just to collapse (id, version, channel) rows down to one latest row per id).
//
// GET /pack-manifest?channel=production
// GET /pack-manifest?channel=preview&ids=nitya-puja,ganapathi-puja
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

interface ContentPackRow {
  id: string;
  version: string;
  manifest_url: string;
  size_bytes: number;
  sha256: string;
  published_at: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const url = new URL(req.url);
  const channel = url.searchParams.get('channel') ?? 'production';
  if (channel !== 'production' && channel !== 'preview') {
    return json(
      { error: 'invalid_channel', detail: 'channel must be "production" or "preview"' },
      400,
    );
  }

  const idsParam = url.searchParams.get('ids');
  const requestedIds = idsParam
    ? idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    // The anon key is enough — see the comment above — and keeps this
    // function's own permissions no wider than a devotee's own app already has.
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  let query = supabase
    .from('content_packs')
    .select('id, version, manifest_url, size_bytes, sha256, published_at')
    .eq('channel', channel)
    .order('published_at', { ascending: false });

  if (requestedIds && requestedIds.length > 0) {
    query = query.in('id', requestedIds);
  }

  const { data, error } = await query;

  if (error) {
    return json({ error: 'query_failed', detail: error.message }, 500);
  }

  // Rows are ordered newest-first; keep the first (latest) row seen per id.
  const latestById = new Map<string, ContentPackRow>();
  for (const row of (data ?? []) as ContentPackRow[]) {
    if (!latestById.has(row.id)) latestById.set(row.id, row);
  }

  return json({
    channel,
    packs: [...latestById.values()].map((row) => ({
      id: row.id,
      version: row.version,
      manifestUrl: row.manifest_url,
      sizeBytes: row.size_bytes,
      sha256: row.sha256,
      publishedAt: row.published_at,
    })),
  });
});
