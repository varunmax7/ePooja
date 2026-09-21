# Changelog

All notable changes per phase. Format loosely follows Keep a Changelog; each
entry lists what was built, what was skipped, and any new `TODO_PANDIT` items.

## [Phase 3] — Onboarding, profile, location, live Today screen — 2026-09-21

### Built

- **§8.1 onboarding** — five steps (Welcome, Language, Devotee, Family,
  Location), each its own route under `app/onboarding/`, sharing one
  in-memory draft (`stores/onboardingDraft.ts`) until Location's "Finish"
  writes it all to the devotee store in one commit:
  - Devotee step: name in English and Telugu, gender, gothram (searchable,
    "I don't know", or free text while the gotra list is empty),
    janma nakshatram + padam (searchable), and **rasi auto-suggested from
    nakshatra + padam** — `rasiFromNakshatraPada`/`rasiIdFromNakshatraPada`,
    new in `@epooja/panchangam` (a rasi is exactly 2¼ nakshatras, i.e. nine
    padas; the suggestion never overwrites a rasi the devotee picked by hand).
  - Family step: add spouse/children/parents with an optional
    nakshatram/rasi and an "include in Sankalpam" toggle — `FamilyMemberForm`,
    shared with Profile's family CRUD so neither drifts from the other.
  - Location step: GPS via `expo-location`, or offline city search;
    `services/location` resolves either into a `DevoteeLocation` with its own
    `tz-lookup` timezone (never the nearest city's — an NRI near a state line
    must get their own zone) and a `content/cities.json` label.
  - Every ritual field is skippable ("I don't know"), per §8.1 — a devotee
    can finish onboarding with nothing but a name and a location.
- **`stores/devotee.ts`, `stores/settings.ts`** — Zustand + MMKV, backed by
  `lib/storage.ts` (MMKV on native, `localStorage` on web via MMKV's own web
  build — same code path either way, which is what makes the Phase 1
  screenshot harness usable here too). A stored record that no longer
  matches the §9.4 schema is dropped rather than half-loaded, so a shape
  change lands a devotee back in onboarding, never on a crash screen.
  `settings.ts` carries the dev-only debug-date override the fixture-date
  acceptance check uses, and is ignored outright in a release build.
- **`services/location`** — `resolveFromCoords`/`resolveFromCity` (pure,
  tested against `content/cities.json`), and `requestDeviceLocation`, which
  turns every failure (denied, services off, no fix) into a typed result
  instead of a thrown error — §8.1 asks the flow to _handle_ denial, not
  crash on it.
- **`services/panchangam`** — wraps `@epooja/panchangam` with the stored
  location and the debug-date override; `toTodayView`/`toFullPanchangamView`
  turn `PanchangamData` into what the Today screen and the new full-Panchangam
  sheet (`app/panchangam/[date].tsx`, a modal route) actually render, in the
  devotee's chosen script.
- **Today, live** — the dial, the four anga badges, sun times and the prayer
  schedule now come from the engine and the devotee's location, not the
  Phase 1 mock; day swipe (chevrons either side of the dial); tapping the
  dial opens the full-Panchangam sheet.
- **Profile, editable** — `/profile/edit` (name, gender, gotra, nakshatra +
  padam, rasi) and `/profile/family` (add/edit/remove, `FamilyMemberForm`
  again) replace the Phase 1 mock; the Today CTA card is the one piece of
  Phase 1 mock data left, deliberately — puja content doesn't exist until
  Phase 4, and defaulting it to Nitya Puja here would be a decision this
  screen has no business making silently.
- **`content/cities.json`** — 134 cities: the Telugu districts in depth, then
  the places Telugu households actually live abroad (the exact NRI regions
  §9.1 fixtures name: New Jersey, Dallas, London, Sydney, Dubai, and more).
  `content/timings.json` — the three prayer-window labels §8.2 shows,
  parts-of-daylight checked against the engine's own `DEFAULT_PRAYER_PARTS`
  in `packages/panchangam/src/prayer-timing-alignment.test.ts` so the two can
  never quietly disagree.
- **`@epooja/content` additions** — `devotee.ts` (the §9.4 `Devotee`/
  `FamilyMember`/`LocalizedText` models, as zod schemas), `cities.ts`
  (schema, haversine `distanceKm`, `nearestCity`, `searchCities`),
  `timings.ts`, and `enumValue`/`enumDisplay` for looking a Panchangam id up
  in its content file.
- **`@epooja/ui` additions** — `TextField`, the one primitive the four Phase 1
  mockup screens had no need for but every onboarding/profile form does.
- **Tests** — 292 in `@epooja/panchangam` (+2 for the rasi mapping and the
  prayer-timing cross-check), 79 in `@epooja/content` (+27 for devotee/cities/
  timings), 84 in `@epooja/mobile` (+58: stores, location, the view model, the
  three-fixture-date acceptance check, and render tests for Profile/Family).

### Acceptance (§10)

- **Today shows correct values for Hyderabad on 3 fixture dates**, via the
  debug-date override — `src/services/panchangam/__tests__/acceptance.test.ts`
  checks an ordinary day, Ugadi 2024 (a masa/samvatsara boundary) and a day
  inside Adhika Shravana 2023, each against
  `packages/panchangam/test/fixtures/verified.json` directly — Phase 2's own
  source of truth, not a second hand-derived set of expectations that could
  drift from it.
- **Airplane mode works** — nothing in Phase 3 makes a network call. Location
  resolution is on-device GPS + a bundled `tz-lookup` table; cities, enums and
  timings are bundled JSON parsed at import time; the devotee record never
  leaves MMKV until a devotee opts into sign-in (not built yet). Confirmed by
  inspection (`grep` for `fetch`/`NetInfo` across `src/` and `app/` returns
  nothing outside the query client's own offline-first config) and by the
  browser walkthrough below, which never requested a domain besides
  `localhost`.
- **Kill/relaunch preserves the profile** — `stores/__tests__/devotee.test.ts`
  round-trips a devotee through MMKV; confirmed live with a browser
  walkthrough (see below) that seeds a devotee, reloads, and lands on Today
  rather than back in onboarding.
- **`.maestro/onboarding.yaml`** — written and ready, matched against the
  actual screen text. **Not run here** — no Xcode, Android SDK or Maestro CLI
  on this machine (the same limitation Phase 0's audio spike recorded).
  Substituted with a full manual walkthrough over headless Chrome
  (`tools/screens`'s CDP client, reused rather than duplicated): every
  onboarding step, live Today, live Profile, live family CRUD and the
  full-Panchangam sheet, seeding a devotee into `localStorage` the way MMKV's
  web build itself does, checking for uncaught `window` errors throughout.
  Zero. This is proof of the same rendering path Maestro would drive
  (react-native-web + real store code, not a mock), not proof of the native
  path.

### Found and fixed during that walkthrough

- The full-Panchangam sheet's rows had no `flexShrink` on their value text —
  harmless for short values, but a `⟨TODO_PANDIT: …⟩` placeholder (much
  longer than the real word it stands in for) ran off the right edge of the
  screen. Rows now wrap.
- `/profile/family` rendered "Family Members" twice — once from the screen
  itself, once from the Stack header already carrying that title.

### Not met

- **Maestro itself did not run** — see above. The flow file is ready for
  whoever next has a device or simulator.
- **60 fps and native GPS behaviour are unverified** — carried over from
  Phase 0/1's device gap. `expo-location` is exercised structurally
  (permission → fix → resolve, all typed, all tested) but never against a
  real GPS radio.

### Deviations

- The full-Panchangam sheet is an expo-router modal, not `@gorhom/bottom-sheet`
  — the exact presentation `player/[slug]` already uses, and adding a bottom
  sheet dependency for one screen wasn't worth the native surface.
- Rasi, nakshatra and gotra pickers are a full-screen searchable modal
  (`EnumSearchPicker`) rather than an inline dropdown — §8.1 asks for
  "searchable list," and a inline list large enough to search comfortably
  would have pushed the rest of the step off-screen.

### New `TODO_PANDIT` items

None authored in this phase. `content/cities.json` carries a
`PENDING_PANDIT_REVIEW` status of its own — the Telugu city names are
standard-orthography but unconfirmed, the same footing as the enum content.

## [Phase 2] — Panchangam engine — 2026-09-19

### Built

- **`@epooja/panchangam`** — the on-device engine per §9.1, pure TypeScript with
  no React Native, Expo, network or clock reads:
  - `getPanchangam({instant, lat, lng, tz})`, `getDayPanchangam(date, loc, {basis})`,
    `findTransitions(anga, from, to)`, `getMonth(year, month, loc)`.
  - Lahiri ayanamsa, apparent of-date Sun/Moon longitudes, sidereal conversion.
  - Tithi, paksha, nakshatra + pada, yoga, karana (all 11, with the fixed ones
    at the right half-tithis), vasara from the most recent sunrise.
  - Amanta masa with **adhika detection**, ruthuvu, ayana, and the 60-year
    samvatsara keyed off the most recent Ugadi.
  - Sunrise/sunset, Rahu kalam / Yamagandam / Gulika kalam, prayer timings.
  - Anga transitions by bracket-and-bisect to the §9.1 precision of 30 s.
  - Memoized per date and per location rounded to 0.01°.
- **`content/enums/*.json`** — all twelve enumerations §9.2 calls for, 202 values,
  every one `PENDING_PANDIT_REVIEW`.
- **`@epooja/content`** — the zod schema for enum files: id/index/audioToken
  consistency, and script validation that rejects look-alike glyphs in Telugu
  and Devanagari fields (§3.3 — the client spec's `ఎవంగුణ` contains a Sinhala
  character, and there is a test that this is caught).
- **`tools/panchangam-fixtures`** — fixture format, generator and an audit
  command that reports the shortfall against the §9.1 bar.
- **Tests** — 284 in the engine, 52 in content. 100% branch coverage on the anga
  calculators (enforced by thresholds), 99.6% statements overall. Tithi
  boundaries are cross-validated against astronomy-engine's independent phase
  search; engine ids are cross-checked against the content enums.
- **Benchmarks** — `pnpm bench`: `getPanchangam` cold runs at 1.5 ms mean /
  1.7 ms p95 against a 20 ms budget.
- **`docs/adr/0002-panchangam.md`** — ayanamsa, sunrise convention, time basis,
  and the conventions §9.1 left open.

### Verified against outside authorities

- Samvatsara anchors from §9.1: Krodhi (38), Vishvavasu (39), Parabhava (40).
- Adhika Shravana 2023 detected at 17 Jul – 16 Aug, with correct boundary
  behaviour at sunrise on the last day.
- Ugadi new moons for 2024, 2025 and 2026.
- Weekday, Rahu kalam segment and sunrise/sunset times for Hyderabad, and DST
  transitions in New York, London and Sydney.

### Not met

- **§9.1 asks for ≥ 60 fixtures verified against a reference panchangam. There
  are 17.** The other 77 fixtures are engine snapshots and are labelled as such;
  they guard against regressions and prove nothing about correctness. Closing
  this needs a reference panchangam or a Prokerala key (dev-only, §3.4).
  `pnpm fixtures:audit` tracks it.
- The ayanamsa model is unvalidated at the arc-second level for the same reason
  (ADR 0002 §1).

### Deviations (ADR 0002)

- Benchmarks are a standalone harness plus a budget test, because Vitest 5
  removed the `bench` API.
- `PanchangamData` lives in `@epooja/panchangam` rather than `@epooja/content`,
  so the engine does not depend on the content package.

### New `TODO_PANDIT` items

202 values × the `locative` form, plus the missing Telugu, IAST and Devanagari
fields and the empty gotra list — all itemised in `content/REVIEW_QUEUE.md`.
Two engine conventions also need a pandit's word: the adhika-Chaitra year start
and the prayer-timing windows.

## [Phase 1] — Design system & static screens — 2026-09-21

### Built

- **`@epooja/ui`** — the §7 design system, framework-free tokens plus the §7.4
  primitives:
  - `tokens.ts` / `tokens.json` (§7.2 palette, spacing, radius, shadow) and the
    §7.3 type scale, both readable by Skia, the NativeWind theme and tests.
  - 20 components: `Txt`, `Card`, `Button`, `FieldCard`, `AvatarRing`,
    `FamilyChip`, `CheckRow`, `TimingRow`, `SunTimesCard`, `AngaBadge`,
    `CurvedHeader`, `DateDial`, `ChantDisc`, `StepProgress`, `MantraText`,
    `TransportControls`, `ModeToggle`, `RecipePreviewCard`, `ProgressPill`,
    `FontScaleProvider`.
  - `DateDial`, `ChantDisc`, `CurvedHeader` and the play coin are Skia
    drawings; the dial and disc animate through Reanimated on the UI thread.
- **Dynamic Type** — `fontScale.ts` + `FontScaleProvider`. React Native scales
  `fontSize` by the OS text size and leaves `lineHeight` alone, which overlaps
  lines and clips the svara marks §7.3 sets the 1.6 line-height to protect. So
  `Txt` sets `allowFontScaling={false}` and scales the whole token itself,
  clamped to the 0.85–1.3 range the layouts are proven at.
- **Static screens** — Today, My Profile, Pooja Preparation and Chant Player
  from the mockup, plus the tab bar, Poojas list, Pooja detail, Recipe and the
  Vedic Calendar. All eight render from `apps/mobile/src/mocks/*.json`, shaped
  to match what the Phase 2 engine already returns.
- **`/_dev/components`** — the Storybook-lite route: palette, gradients, the
  type scale and every primitive in its states. `/_dev/svara` carries the
  svara-rendering spike.
- **Fonts** — the §7.3 faces (Mukta, Noto Sans Telugu, Tiro Telugu, Tiro
  Devanagari Sanskrit) loaded at the root, splash held until they are ready so
  no Telugu line ever flashes a fallback face.
- **`tools/screens`** — the screenshot harness: a dependency-free CDP client
  driving headless Chrome, and a tested manifest of screens × widths × type
  scales. `pnpm screens:capture`.
- **Tests** — 32 in `@epooja/ui` (tokens, type scale, font scaling), 24 under
  jest-expo (component behaviour, accessibility roles, Dynamic Type), 6 on the
  capture plan.

### Gate

`docs/screens/p1/` — 31 screenshots: nine screens at 360×640, 390×844 and
430×932, and the four reference screens again at 130% Dynamic Type.
`docs/screens/p1/README.md` records how to regenerate them.

### Layout bugs the gate caught

The 130% and 360 px passes were not a formality — five defects, all fixed:

- `AngaBadge` did not shrink (RN defaults `flexShrink` to 0), so the nakshatram
  and masam badges were clipped off the right edge at 360 px and badly at 130%.
- Today pulled its first row up into `CurvedHeader`'s bottom bulge, which is
  painted by an absolutely-positioned canvas and takes no part in layout. The
  overhang is now exported as `CURVE_OVERHANG`.
- The Chant Player's action prompt floats over the scroller, which reserved no
  room for it — the transport controls could not be scrolled clear of it, so
  Pause was unreachable. The prompt is measured and its height added to the
  scroll padding.
- The play coin cast a square shadow: a Skia disc in a square `Pressable`
  carrying the elevation with no matching `borderRadius`.
- The calendar's last week had four cells in a seven-column grid, so 27–30
  spread evenly across the card instead of sitting under S–W.

### Not met

- **No side-by-side against `ui-reference.png`.** The mockup still has not been
  supplied (Phase 0 raised this; `docs/reference/README.md` tracks it), so the
  "same structure, palette, hierarchy" half of the §10 acceptance cannot be
  judged. The screenshots are ready for the comparison whenever it arrives.
- **60 fps on a mid-range Android is unverified** — no Android SDK or device on
  this machine, and a browser frame rate proves nothing about one. Re-check in
  Phase 3, when the app first runs on hardware.
- The screenshots are react-native-web through CanvasKit, not a device. Layout
  is Yoga either way, so overflow is real; rasterisation is not.

### Deviations

- Light theme only, as §10 Phase 1 specifies.
- `mantraStyleFor` gained a sibling, `mantraVariantFor`, and `MantraText` now
  asks for a style _name_ rather than passing a style object — a hand-passed
  style silently overwrote the Dynamic Type metrics.

### New `TODO_PANDIT` items

None authored in this phase. Every ritual string on these screens is an
existing `⟨TODO_PANDIT: …⟩` placeholder or a `PENDING_PANDIT_REVIEW` enum
value, already itemised in `content/REVIEW_QUEUE.md`.

## [Phase 0] — Foundations — 2026-09-19

### Built

- **Monorepo** — pnpm workspaces + Turborepo per §6. `pnpm verify` runs
  lint + typecheck + test across every package and is the phase gate.
- **`packages/config`** — shared strict TypeScript presets (base / library /
  react-native), ESLint flat configs and Prettier config. The ESLint presets
  encode §15 as enforced rules:
  - pure packages cannot import React Native or Expo,
  - no colour literals in components,
  - no Telugu/Devanagari literals in `.ts`/`.tsx` (ritual text is data).
- **Package shells** — `packages/{panchangam,sankalpam,content,ui}`, each
  framework-free with tests. `@epooja/content` already carries the §0.3 review
  schema and the `⟨TODO_PANDIT: …⟩` placeholder contract.
- **`apps/mobile`** — Expo SDK 57 (RN 0.86, New Architecture) with Expo Router,
  NativeWind v4 wired to the §7.2 palette, Reanimated, Skia, MMKV, Zustand,
  TanStack Query, XState, i18next, zod, Sentry and PostHog (both env-gated and
  silent without keys). Themed shell screen satisfies the "themed Hello" gate.
- **`app.config.ts`** — bundle id `com.epooja.app`, scheme `epooja`,
  `UIBackgroundModes: ['audio']`, media-playback + location + notification
  permissions with devotee-facing strings.
- **`eas.json`** — `development`, `development:device`, `preview` and
  `production` profiles on the `dev` / `preview` / `production` channels.
- **Audio spike** — `react-native-track-player` service boundary
  (`src/services/audio/*`), headless playback service registered at app entry,
  a dev-only spike screen, a Jest mock, and unit tests for setup idempotency,
  interruption handling and remote-control registration. Recorded in
  `docs/adr/0001-audio-library.md`.
- **CI** — `.github/workflows/ci.yml`: format check, `pnpm verify`, Expo config
  resolution, `expo-doctor` (21/21 green), and a Metro bundle export.
- **`AGENTS.md`**, **`README.md`**, **`content/REVIEW_QUEUE.md`**.

### Skipped / not possible here

- **The audio spike has not been run on a device.** This machine has no Xcode,
  CocoaPods, Android SDK or JDK, and EAS builds need an interactive Expo login.
  The JS side is proven (the app bundles, 2486 modules, spike screen included)
  but background playback and lock-screen controls are unverified. ADR 0001 is
  **Proposed**, not Accepted, and carries the checklist to tick.
- **`docs/reference/ui-reference.png` is missing** — it was not supplied with
  the plan. Phase 1 acceptance depends on it.
- App icon, adaptive icon, splash and notification icons are **generated
  placeholders**, not designed artwork.
- `expo-build-properties` was dropped: SDK 57 defaults already match what RNTP
  and Skia need, and the plan lists no override that requires it.

### Risks raised

- `react-native-track-player@4.1.2` is flagged **unsupported on the New
  Architecture** by React Native Directory and ships no `codegenConfig`; it runs
  through RN's legacy interop. v5 exists only as a nightly alpha. §4 already
  names `expo-audio` as the fallback — ADR 0001 records the decision point and
  what the fallback costs (≈2 extra days in Phase 6).

### New `TODO_PANDIT` items

None — no ritual content was authored in this phase. The non-code content track
(identify the pandit, pilot recording, consent, studio booking) is listed in
`content/REVIEW_QUEUE.md` and has not started.
