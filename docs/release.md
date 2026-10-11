# Release checklist (Phase 10)

Nothing in this file has been run for real — there is no Apple Developer
account, Google Play Console project, device, or beta cohort attached to this
build yet (same "no live project, build against env vars" posture
`supabase/README.md` documents for the backend). This is the checklist for
whoever has those and is ready to ship v1.0; §16's Definition of Done is the
actual gate, this file is how to clear each line of it.

## 1. Content and voice gates — the only two items this repo can enforce for you

```bash
pnpm content:build -- --upload --channel production
```

Refuses to upload (exit 1, nothing touched) while any content file has a
`⟨TODO_PANDIT: …⟩` placeholder or a `review.status` other than `APPROVED` —
`tools/content-build/src/productionGate.ts`, tested in
`productionGate.test.ts`. Run it any time to see exactly what's left;
right now (zero pandit review done) it fails on all 26 content files and 961
placeholders. There is no equivalent automated check for the **voice** gate
(§9.6.1: every production clip `humanRecorded: true`, zero `dev_placeholder`,
naturalness panel passed) — every pack's `audio-manifest.json` ships
`clips: []` by design (Phase 4) until Phase 6/7's recording work has real
audio to list; reaching zero placeholders and a filled, all-human manifest at
the same time is what "ready" means here.

## 2. Panchangam field test (§16: "matches the reference for 14 days × 3 cities")

Run `pnpm fixtures:audit` before anything else here — it's the accurate,
current number, not the paragraph below:

```
total cases       94
verified          17
engine snapshots  77
```

§9.1 wants ≥60 of those 94 fixtures `source: 'verified'` against a real
reference panchangam; only 17 are. The other 77 are `source: 'engine-
snapshot'` (`tools/panchangam-fixtures/src/types.ts` has the exact field
shape) — snapshots of whatever the engine currently outputs, which catch a
regression but prove nothing about whether the engine was right to begin
with. This has been the exact state since Phase 2 (its own "Not met" note);
nothing in a later phase touched it. §16's "14 days × 3 cities" field test
and closing this 43-fixture gap are really the same blocker — both need a
reference panchangam, and doing one well is most of the work for the other.
To close both together:

1. Pick 3 cities already in the fixture set's spread (§9.1 lists 9: e.g.
   Hyderabad, Dallas, Sydney — one each for the southern-hemisphere and DST
   cases the fixtures already cover).
2. For each of the next 14 days, look the day up in a published/printed
   reference panchangam for that city, and both: (a) compare it against the
   app's Panchangam sheet (`/panchangam/[date]`), and (b) if that date has an
   existing fixture, correct any value the engine got wrong and flip its
   `source` to `'verified'` (`tools/panchangam-fixtures/src/types.ts` has
   the exact field shape, `reference` included).
3. Record any anga, transition time (±2 min tolerance), or sunrise (±1 min)
   mismatch as a bug against `packages/panchangam`, not a content issue.

Needs a reference panchangam to diff against — not something to generate
from the engine itself, which would just be comparing the engine to itself.

## 3. Device matrix (§10: SE-class, Pro-class, low-end Android, mid Android, tablet)

No iOS/Android SDK, simulator, or hardware exists on the machines that have
built this app so far (the constraint every phase since Phase 0's ADR 0001
has flagged). Once a device is available:

```bash
eas build --profile preview --platform ios      # or android
```

installs a build identical to what `production` ships (same `base` profile,
same New Architecture flags) without going through store review. Walk
Onboarding → Today → Prepare → Run a full puja → Complete on each device
class; the §16 cold-start (<2.5s) and 45-minute-runner-memory checks belong
here too — they need a real device's profiler, not a simulator's.

## 4. Store submission

```bash
eas submit --profile preview --platform android   # Play internal testing
eas submit --profile production --platform android # Play production track
eas submit --profile production --platform ios      # TestFlight / App Store
```

`apps/mobile/eas.json`'s `submit.preview`/`submit.production` profiles are
configured and read no secret from source control:

- **Android** needs a Google Play Console service account key saved at
  `apps/mobile/google-play-service-account.json` (gitignored). Play Console
  → Setup → API access → create a service account with "Release manager"
  permission, download its JSON key there.
- **iOS** has no `ios` block in either profile — `eas submit` either prompts
  interactively or reads `EXPO_APPLE_ID` / `EXPO_APPLE_APP_SPECIFIC_PASSWORD`
  (or an App Store Connect API key via `EAS_ASC_API_KEY_PATH`) from the
  environment at submit time, the same way `tools/content-build`'s
  `SUPABASE_SERVICE_ROLE_KEY` is read rather than committed (§13).
- Both need the developer accounts themselves — an Apple Developer
  Program membership and a Google Play Console developer account — which is
  the actual long-lead item; the config above is what's waiting on them.

### Store listing assets

- **Screenshots**: `tools/screens` (Phase 1's harness) captures the app at
  the reference widths; re-run it once real device screenshots are wanted —
  `docs/screens/p1/README.md` has the exact command. Store listings want
  device-frame screenshots, which this harness does not add; a design pass
  on top of its raw captures is still needed.
- **Listing copy** (English + Telugu) and the **Data Safety / Privacy
  Nutrition Label** answers: `docs/store/listing.md` and
  `docs/store/data-safety.md`. Both are first drafts derived directly from
  what the app actually does and collects — same status as
  `apps/mobile/app/profile/privacy.tsx`'s Privacy Policy draft: needs the
  client's (and, for the Telugu copy, a native speaker's) sign-off before
  it's the text that actually goes live, not placeholder text waiting on a
  pandit.
- **Privacy policy URL**: the in-app `/profile/privacy` screen is the policy
  today; both stores want a reachable URL in the listing itself, which means
  either hosting that same text on a web page or pointing the listing at a
  future marketing site. Not resolved here — no web property exists yet.

## 5. Closed beta → production

§10: 20–50 families on Play internal testing / TestFlight before a public
release; §16: ≥99.5% crash-free sessions, Sentry clean. Both need real users
running a real build — `apps/mobile/src/lib/sentry.ts` is already wired
(§12: `sendDefaultPii: false`, PII never leaves the device) and will start
reporting the moment `EXPO_PUBLIC_SENTRY_DSN` is set on a build profile; there
is nothing further to configure here, only time with real devotees using it.

## What this file does not and cannot do

Everything in §16 that needs a pandit's review, a real recording, a physical
device, a published reference panchangam, a developer account, or real beta
users is listed in `content/REVIEW_QUEUE.md`'s "Non-code dependencies"
table, not faked here. The two things this repo _can_ enforce by itself —
the content gate and the schema/test suites — are enforced, and verified to
actually refuse a bad release (§1 above). Everything else is a checklist,
not a gate, because there is no code that can stand in for a pandit, a
device lab, or a beta cohort.
