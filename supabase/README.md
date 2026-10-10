# Supabase backend (Phase 8)

Nothing in this directory has been run against a live project — there isn't
one yet (the client chose "no project yet, build against env vars" when this
phase was scoped). This is the setup checklist for whoever creates one.

## 1. Create the project and run migrations

```bash
supabase link --project-ref <your-project-ref>
supabase db push        # applies migrations/20261007000000_init_schema.sql
```

## 2. Deploy the Edge Functions

```bash
supabase functions deploy pack-manifest
supabase functions deploy delete-account
```

`delete-account` needs `SUPABASE_SERVICE_ROLE_KEY` set as a function secret
(Supabase sets `SUPABASE_URL`/`SUPABASE_ANON_KEY` automatically):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## 3. Configure auth providers

Both are required together: Apple's guidelines require Sign in with Apple
whenever another third-party sign-in (Google) is offered.

- **Google** — Authentication → Providers → Google. Create an OAuth client
  (type: Web application) in Google Cloud Console, add the Supabase callback
  URL it shows you, paste the client id/secret into Supabase. The app itself
  needs no Google SDK or `google-services.json` — it opens Supabase's hosted
  OAuth URL in a system browser tab and reads the result back on the
  `epooja://auth-callback` redirect (`apps/mobile/src/services/auth`). See
  `docs/adr/0004-oauth-flow.md` for why.
- **Apple** — Authentication → Providers → Apple. You'll need, from the
  Apple Developer portal: a Services ID, a Sign-in-with-Apple key (.p8), the
  Team ID and Key ID. The app side uses the native
  `expo-apple-authentication` button and needs no further config beyond the
  `usesAppleSignIn` capability already added in `app.config.ts`.
- Add `SUPABASE_URL` / `SUPABASE_ANON_KEY` to `apps/mobile/.env` once the
  project exists (see `.env.example`).

## 4. Content pipeline credentials

`pnpm content:build -- --upload --channel preview` needs, as **process env**
(never committed, never shipped to the app — §13 "no service keys in the
app"):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

It uploads each pack's files to the `content-packs` Storage bucket and
upserts a `content_packs` row with the computed `sha256`/`size_bytes`. The
bucket must exist and be public-read (or served through a CDN that is) —
`pack-manifest` hands the app a direct `manifest_url`, it does not proxy the
download.

## 5. What to verify once the project exists

- RLS: a second account cannot read/update/delete the first account's
  `profiles`/`puja_sessions`/`favorites` rows.
- `delete-account` actually removes the auth user and every row above, and
  the `names/{hash}.m4a` file if one was set.
- `pack-manifest?channel=preview` and `?channel=production` return disjoint
  results if packs are published to only one channel.
