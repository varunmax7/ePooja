-- Phase 8 (implementation.md §10): profiles, content packs, puja sessions,
-- favorites. Every user-owned table is RLS-locked to its own `auth.uid()`;
-- `content_packs` is public-read, service-role-write only (the content-build
-- tool uploads with the service key, never the app).
--
-- Run with the Supabase CLI: `supabase db push` (or paste into the SQL editor
-- of a new project). Nothing in this repo runs it automatically — there is no
-- live project yet (§14 open question #6 was resolved for this phase as
-- "build full Google + Apple sign-in now"; the project itself is still to be
-- created, see `supabase/README.md`).

create extension if not exists "pgcrypto";

-- 1. profiles -----------------------------------------------------------
-- One row per signed-in devotee, keyed by their auth user id. `devotee` is
-- the exact `Devotee` JSON (`packages/content/src/devotee.ts`) the app
-- already validates with zod on every read — the server does not reparse it.
-- `updated_at` here is "last time the server received a write"; the client
-- compares `devotee->>'updatedAt'` (the field inside the JSON itself, set on
-- every local edit) to do last-write-wins, not this column, so two devices
-- with skewed clocks still resolve consistently against each other.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  devotee jsonb not null,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- 2. content_packs --------------------------------------------------------
-- One row per published (puja, version, channel). `tools/content-build
-- --upload --channel <preview|production>` writes these with the service
-- role key; the `pack-manifest` Edge Function reads them with the anon key
-- on the devotee's behalf, filtered to the channel their build was cut on.
create table if not exists content_packs (
  id text not null,
  version text not null,
  channel text not null default 'production',
  manifest_url text not null,
  size_bytes bigint not null,
  sha256 text not null,
  published_at timestamptz not null default now(),
  primary key (id, version, channel)
);

create index if not exists content_packs_channel_published_idx
  on content_packs (channel, id, published_at desc);

alter table content_packs enable row level security;

create policy "content_packs_public_read" on content_packs
  for select using (true);

-- No insert/update/delete policy: RLS default-denies every write from the
-- anon/authenticated roles. The content-build tool writes with the service
-- role key, which bypasses RLS entirely (§13: "no service keys in the app").

-- 3. puja_sessions ----------------------------------------------------------
-- The backend mirror of `useSessionStore`'s local log (§9.7) — written only
-- when the devotee is signed in, best-effort, never blocking the runner.
create table if not exists puja_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  puja_id text not null,
  variant text not null,
  mode text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  completed_steps int not null default 0
);

create index if not exists puja_sessions_user_started_idx
  on puja_sessions (user_id, started_at desc);

alter table puja_sessions enable row level security;

create policy "puja_sessions_select_own" on puja_sessions
  for select using (auth.uid() = user_id);

create policy "puja_sessions_insert_own" on puja_sessions
  for insert with check (auth.uid() = user_id);

create policy "puja_sessions_delete_own" on puja_sessions
  for delete using (auth.uid() = user_id);

-- 4. favorites ----------------------------------------------------------
-- No UI writes to this yet (no §8 screen calls for a favorite toggle) — the
-- table exists now because §10 Phase 8 specifies it, so a later phase's
-- favoriting UI has somewhere real to sync to from day one.
create table if not exists favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  puja_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, puja_id)
);

alter table favorites enable row level security;

create policy "favorites_select_own" on favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on favorites
  for delete using (auth.uid() = user_id);
