# Changelog

All notable changes per phase. Format loosely follows Keep a Changelog; each
entry lists what was built, what was skipped, and any new `TODO_PANDIT` items.

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
  `pnpm --filter @epooja/panchangam-fixtures audit` tracks it.
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
