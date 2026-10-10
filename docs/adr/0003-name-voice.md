# ADR 0003 — Devotee name voice: self-recite default, clone path mechanism only

- **Status:** Proposed — the self-recite path and the clone _fallback policy_
  are built and tested; the clone path itself has no Edge Function, no
  pandit consent, and no naturalness panel result to accept or reject it on
- **Date:** 2026-10-04
- **Phase:** 7
- **Supersedes:** nothing
- **Required by:** §10 Phase 7's own instruction to record this decision here

## Context

§9.6.1 is explicit that the devotee's own name has exactly two allowed
sources in production: the devotee speaking it themselves (self-recite,
the default), or a clone of the same pandit's voice, synthesizing only the
name — never a generic TTS voice, never for anything else in the Sankalpam
or the chants. The clone path additionally requires:

1. The pandit's written consent to a voice clone, separate from consent to
   record the chants at all.
2. A naturalness listening panel (the pandit, the client, 5 Telugu
   devotees) hearing 10 full Sankalpams and failing to reliably point to
   where the cloned name was inserted, before the option ships to anyone.
3. An Edge Function (`name-voice`) that calls a clone provider, matches
   loudness/EQ to the recorded tokens, and caches the result on-device.

None of the three exist yet, for the same reason nothing else in §9.6 does:
no pandit has been recorded, so there is no voice to clone, no consent to
seek it for, and no naturalness panel to run.

## Decision

Build and test everything that does **not** depend on a real clone
existing, so the moment one does, nothing here has to be redesigned:

1. **Self-recite is the only path that ever actually plays** right now.
   `useSankalpamRunner` (`apps/mobile/src/services/sankalpam`) pauses the
   Sankalpam, shows the devotee's name (or a hand-typed gotra the pandit
   has not recorded) large on screen, and continues on a tap or after
   `SELF_RECITE_NOMINAL_MS` (3 s, §9.6.1's own number) — entirely offline,
   no clip, no network call.
2. **The fallback policy is implemented and tested**, not deferred:
   `resolveNameAudioMode` (`@epooja/sankalpam`) returns `pandit_clone` only
   when the devotee's `prefs.nameAudio` is `'pandit_clone'` **and** a clone
   is already cached in `devotee.nameAudio` (§9.4's own schema field for
   exactly this). Opted in but not yet rendered, or a clone that failed, is
   indistinguishable from never having opted in at the type level — both
   resolve to `self_recite` automatically, with no error state to handle
   downstream. There is no third return value: a generic TTS voice is not
   a representable output of this function, let alone a chosen one.
3. **`buildSankalpamAudioPlan` already knows how to queue a clone clip**
   once one exists — `kind: 'pandit_clone'` carries the cached file's own
   URL, and `useSankalpamRunner` loads it into RNTP exactly like a
   recorded token, preferring the on-device `localPath` over the remote
   `url`. What it cannot do yet is produce that cached file: the
   `name-voice` Edge Function is Phase 8 work (it needs the Supabase
   project that phase builds), gated further behind the consent and
   naturalness steps above.

## Consequences

- A devotee can opt into `pandit_clone` in Settings today and nothing
  breaks — they silently get self-recite, forever, until a real clone
  pipeline exists to fulfil the preference they already expressed.
- The naturalness panel's "≥ 70% cannot identify it" bar, and the
  Edge Function itself, remain fully unbuilt. This ADR will need a status
  change (to Accepted or Rejected) once a real pandit recording and a real
  panel exist to decide it — not before.
- No generic TTS voice exists anywhere in this codebase's audio path
  (§10 Phase 7 acceptance) — verified structurally, not just promised:
  `resolveNameAudioMode`'s return type has exactly two members, and
  `@epooja/sankalpam`'s own tests assert every call returns one of them.
