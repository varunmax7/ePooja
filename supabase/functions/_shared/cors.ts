/**
 * CORS headers shared by every Edge Function.
 *
 * The mobile app never hits a browser CORS check (native `fetch` isn't
 * subject to it), but the web build (`react-native-web`, used for the
 * screenshot harness, §2) does — and so does testing a function from the
 * Supabase dashboard. Allowing any origin is safe here because every
 * response is already scoped by RLS/the caller's own JWT; nothing in these
 * functions returns data because of the origin header.
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
