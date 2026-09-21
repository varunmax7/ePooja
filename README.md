# ePooja

A digital Telugu Smartha purohit (వైదిక బ్రాహ్మణ పురోహితుడు) for iOS and Android.

ePooja guides a Telugu Hindu household through an authentic Smartha Sampradaya
puja at home the way a purohit would: it knows the devotee (gothram, nakshatram,
family), computes the local Panchangam on-device, says a correctly declined
personalised Sankalpam, prepares the samagri and naivedyam, and runs the puja
step by step with a real pandit's recorded voice.

**`implementation.md` is the authoritative plan.** `AGENTS.md` is the short list
of rules you must not break while working in this repo.

## Status

| Phase | Scope                                                  | State                                      |
| ----- | ------------------------------------------------------ | ------------------------------------------ |
| 0     | Foundations: monorepo, Expo app shell, CI, audio spike | **built — spike awaiting a device run**    |
| 1     | Design system & static screens                         | **built — awaiting `ui-reference.png`**    |
| 2     | Panchangam engine                                      | **built — 17/60 fixtures verified**        |
| 3     | Onboarding, profile, location, live Today screen       | **built — Maestro flow awaiting a device** |
| 4–10  | see `implementation.md` §10                            | not started                                |

## Repository layout

```
apps/mobile/      Expo app (Expo Router, NativeWind, Skia, RNTP)
packages/
  panchangam/     pure TS — Panchangam engine
  sankalpam/      pure TS — Sankalpam text + audio plan (Phases 5, 7)
  content/        zod schemas, types, loaders for content packs (Phase 4)
  ui/             design tokens + primitive components (Phase 1)
  config/         shared tsconfig / ESLint / Prettier presets
content/          ritual content as data (enums, pujas, samagri, audio manifest)
supabase/         migrations, edge functions (Phase 8)
tools/            content build, cue tapper, panchangam fixtures, screenshots
docs/adr/         architecture decision records
```

## Getting started

Requirements: Node ≥ 20.19, pnpm 10, and — for running the app — Xcode
(iOS) or Android Studio + JDK 17 (Android). **Expo Go does not work**: RNTP,
MMKV and Skia need native code, so you need a development build.

```bash
pnpm install
pnpm verify                            # lint + typecheck + test — the phase gate
cp apps/mobile/.env.example apps/mobile/.env   # optional; the app runs as a guest

# First run on a device or simulator (builds native projects locally):
pnpm --filter @epooja/mobile ios
pnpm --filter @epooja/mobile android

# Subsequent runs (Metro only, against the dev client you already installed):
pnpm --filter @epooja/mobile start
```

The design system can also be rendered in a browser, which is how the Phase 1
acceptance screenshots in `docs/screens/p1/` are produced. Web is not a
shipping target (§2) — it exists for this:

```bash
pnpm --filter @epooja/mobile exec expo start --web   # in one shell
pnpm screens:capture                                 # in another
```

EAS builds (`development`, `preview`, `production` profiles are in
`apps/mobile/eas.json`) need an Expo account:

```bash
npx eas login
npx eas init                           # writes the project id
npx eas build --profile development --platform ios
```

## Principles

- **Offline-first.** A puja must never stall because the network dropped.
- **Content is data.** No ritual text in code; every content file is reviewed
  and signed off by a named pandit.
- **Real voice only.** Every sound in production is a real pandit recording.
  No TTS, no AI chanting — ever (§9.6.1).
