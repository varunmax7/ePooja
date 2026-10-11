# Data Safety (Google Play) / Privacy Nutrition Label (App Store) — first draft

**Status: unreviewed draft**, same standing as `docs/store/listing.md` and
the in-app Privacy Policy — a first pass derived directly from what the code
actually does (every claim below cites the file it comes from), needing the
client's sign-off before it's submitted. Re-derive this if `supabase/
migrations`, `apps/mobile/src/lib/analytics.ts`, or the permissions in
`app.config.ts` change — it's a description of the code, not an independent
promise, and it goes stale the moment the code it describes does.

## What the app does _not_ do, first, because it drives most of the answers below

- No ads, no ad network, no third-party trackers of any kind.
- No data is sold or shared with third parties for their own purposes.
- Nothing is collected unless the devotee actively signs in — the app is
  fully usable offline, guest-only, forever (§5 "guest-first"). Signing in
  is for cross-device sync, nothing else.

## Data collected

| Data                                                                                                                           | Collected when                                                                                                         | Why                                                                                                   | Shared with                                                                             | Where                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Name, gothram, nakshatram, rasi, family members' names/relations                                                               | Always (on-device). Additionally sent to the backend only if the devotee signs in.                                     | Needed to compute and speak a correct personal Sankalpam (§1)                                         | Nobody                                                                                  | Device only, unless signed in (then `profiles.devotee` — a Supabase table, own-row RLS, Section 13) |
| Location (GPS or searched city)                                                                                                | Always (on-device, to compute the local Panchangam). Sent to the backend, rounded to 0.01° (~1 km), only if signed in. | Panchangam (sunrise, tithi) and Sankalpam geography are specific to where the devotee lives (§1, §13) | Nobody                                                                                  | Device, or `profiles.devotee.location` if signed in, rounded                                        |
| Puja history (which puja, which mode, start/complete time, steps completed)                                                    | Only if signed in                                                                                                      | Lets a signed-in devotee's history follow them across devices                                         | Nobody                                                                                  | `puja_sessions` table, own-row RLS                                                                  |
| Sign-in identity (name, email) from Google/Apple                                                                               | Only if the devotee chooses to sign in                                                                                 | Creates the account the above syncs to                                                                | The sign-in provider itself (Google/Apple), per their own terms — not re-shared further | Supabase Auth                                                                                       |
| App usage events (`onboarding_completed`, `puja_started`, `puja_completed`, `pack_downloaded`, `reminder_toggled`, etc. — §12) | Always, if analytics is configured for the build (`EXPO_PUBLIC_POSTHOG_KEY` set)                                       | Understand which features are used, where devotees drop off                                           | PostHog (processor, not a third party reseller)                                         | PostHog Cloud/self-host, whichever the build is configured against                                  |
| Crash and performance diagnostics                                                                                              | Always, if Sentry is configured for the build (`EXPO_PUBLIC_SENTRY_DSN` set)                                           | Find and fix crashes                                                                                  | Sentry (processor)                                                                      | Sentry                                                                                              |

## Data **not** collected, by code-level guarantee, not just policy

- `apps/mobile/src/lib/analytics.ts`'s own comment and §12: analytics events
  **never** include name, gothram, nakshatram or location coordinates — the
  event list itself (`onboarding_completed`, `puja_started {pujaId, variant,
mode}`, …) carries no personal fields to begin with.
- `apps/mobile/src/lib/sentry.ts`: `sendDefaultPii: false` — Sentry's SDK
  default of attaching device/user identifiers is explicitly turned off.
- The pandit's name-voice clone (§9.6.1, §13) is keyed by a content hash with
  no devotee name in the path or the file, used only to speak devotee names
  inside the Sankalpam, never to generate any other speech.

## Permissions requested, and what they're for

| Permission               | For                                                    | Can the devotee decline it?                                                   |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Location ("when in use") | Computing the local Panchangam and Sankalpam geography | Yes — falls back to manually searching for a city (`onboarding/location.tsx`) |
| Notifications            | Local prayer-timing reminders                          | Yes — reminders simply don't schedule; nothing else depends on it             |
| Background audio         | Keeping a chant playing with the screen locked         | Not a data-collection permission — playback just stops if denied              |

## Account deletion

In-app (`apps/mobile/app/profile/account.tsx`), calling the `delete-account`
Edge Function, which removes (in order) the name-voice-clone file, every
`puja_sessions` row, every `favorites` row, the `profiles` row, and finally
the auth user itself (`supabase/functions/delete-account/index.ts`) — both
stores require this to exist and be reachable without contacting support,
and it already is.

## Children

Not directed at children; no age gate exists because none of the data above
is of a kind either store's children's-data rules single out, but this line
needs the client's confirmation, not an engineering guess.
