# Changelog

All notable changes per phase. Format loosely follows Keep a Changelog; each
entry lists what was built, what was skipped, and any new `TODO_PANDIT` items.

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
