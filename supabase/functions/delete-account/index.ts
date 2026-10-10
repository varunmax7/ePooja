// Deno Edge Function — deploy with `supabase functions deploy delete-account`.
//
// §10 Phase 8 / §13: "`delete-account` function (deletes auth user + rows +
// name-clone files)." Required by both app stores' account-deletion policy.
//
// POST /delete-account
// Authorization: Bearer <the devotee's own access token>
//
// The caller is identified from their own JWT (never a user id in the body —
// a devotee must not be able to ask this function to delete anyone else).
// Row deletes happen before the auth user itself: `on delete cascade` would
// clean up `profiles`/`puja_sessions`/`favorites` anyway, but deleting them
// explicitly first means a Storage failure still leaves the account intact
// rather than the inverse — a deleted login with orphaned files is worse
// than a failed deletion the devotee can retry.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  // One client scoped to the caller's own token, only to answer "who is
  // this" — it never runs a privileged query.
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: getUserError,
  } = await callerClient.auth.getUser();

  if (getUserError || !user) {
    return json({ error: 'unauthorized' }, 401);
  }

  // Everything past this point needs the service role — RLS rightly stops a
  // devotee from deleting their own `auth.users` row or anyone else's data.
  const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  // The pandit-voice-clone file is keyed by hash, not by user id (§13: "no
  // name in the path"), so it has to be read off the profile before the
  // profile row is gone — this is the only place that link exists.
  const { data: profileRow } = await adminClient
    .from('profiles')
    .select('devotee')
    .eq('id', user.id)
    .maybeSingle();

  const nameAudioHash = (profileRow?.devotee as { nameAudio?: { hash?: string } } | null)?.nameAudio
    ?.hash;

  if (nameAudioHash) {
    const { error: storageError } = await adminClient.storage
      .from('names')
      .remove([`${nameAudioHash}.m4a`]);
    // A missing or already-gone file is not a reason to abort the deletion;
    // a Storage outage, which `error` can't distinguish from "not found"
    // here, is logged but still shouldn't strand the devotee's data.
    if (storageError) console.error('delete-account: name-clone remove failed', storageError);
  }

  const { error: sessionsError } = await adminClient
    .from('puja_sessions')
    .delete()
    .eq('user_id', user.id);
  if (sessionsError) return json({ error: 'delete_failed', detail: sessionsError.message }, 500);

  const { error: favoritesError } = await adminClient
    .from('favorites')
    .delete()
    .eq('user_id', user.id);
  if (favoritesError) return json({ error: 'delete_failed', detail: favoritesError.message }, 500);

  const { error: profileError } = await adminClient.from('profiles').delete().eq('id', user.id);
  if (profileError) return json({ error: 'delete_failed', detail: profileError.message }, 500);

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    return json({ error: 'delete_failed', detail: deleteUserError.message }, 500);
  }

  return json({ deleted: true });
});
