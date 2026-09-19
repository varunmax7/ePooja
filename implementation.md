# ePooja — Implementation Plan

> **Product:** ePooja: a digital Telugu Smartha purohit (వైదిక బ్రాహ్మణ పురోహితుడు) as a mobile app
> **Platforms:** iOS + Android (single codebase)
> **Build mode:** Agent-driven (Antigravity CLI), one phase per agent session, gated by acceptance criteria
> **UI reference:** `docs/reference/ui-reference.png` (4-screen mockup: Profile, Vedic Calendar, Pooja Preparation, Chant Player)

---

## 0. How an agent must use this document

1. Read §1–§9 fully before writing code. §10 is the phase plan; execute **one phase at a time**.
2. Never start a phase until the previous phase's **Gate** checklist passes (`pnpm verify` green + acceptance criteria met).
3. All ritual content (mantras, Sankalpam fragments, enum spellings, festival rules) is **data, not code**. Never hardcode mantra text in components. Every content file carries `review: { status: "PENDING_PANDIT_REVIEW" | "APPROVED", reviewer, date }`.
4. Do not invent Sanskrit/Telugu text. If content is missing, insert a clearly marked placeholder (`"⟨TODO_PANDIT: achamanam_line_2⟩"`) and list it in `content/REVIEW_QUEUE.md`.
5. Pure logic (Panchangam, Sankalpam, content validation) lives in framework-free TS packages with unit tests. The app only consumes them.
6. Prefer on-device computation and offline-first behaviour. A puja must never stall because the network dropped mid-ritual.
7. Conventional commits, one PR (or branch) per phase, `CHANGELOG.md` updated per phase.

---

## 1. What this application is

ePooja guides a Telugu Hindu household through an authentic **Smartha Sampradaya** puja at home, the way a purohit would, with these parts:

- **Knows the devotee:** name, gothram, janma nakshatram, rasi, family members, location.
- **Knows the day:** computes the local Panchangam (samvatsaram → karanam, sunrise/sunset, Rahu kalam, etc.) for the device location.
- **Says the Sankalpam correctly:** generates a grammatically correct, personalised Sankalpam (text + audio) with today's Panchangam and the devotee's details stitched in.
- **Prepares the devotee:** a Samagri checklist and Naivedyam/Prasadam recipe per puja.
- **Conducts the puja:** a step-by-step, audio-synced runner through Poorvangam → Pradhana Puja (Shodashopachara) → Uttarangam, with a **Chant mode** (mantras only) and a **Guided/Purohit mode** (Telugu instruction before each step: _"ఇప్పుడు అక్షతలు తీసుకొని కలశంపై చల్లండి…"_).

### 1.1 Target users

- Telugu families in AP/Telangana doing Nitya Puja and festival pujas without a priest present.
- Telugu NRIs (US/UK/Gulf/AU). Location-aware Sankalpam and non-IST timezones are first-class.
- Beginners who need physical-action guidance, and experienced devotees who only want the chant track.

### 1.2 Non-goals (v1)

- Live/video priest booking, e-commerce for samagri, astrology predictions/horoscope matching, community/social features.

---

## 2. Scope

| Area                 | MVP (v1.0)                                                                            | v1.x                                                                          | Later                 |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| Onboarding & profile | ✅ Devotee + family, GPS/city, language                                               | Multiple households                                                           | —                     |
| Panchangam           | ✅ On-device: 5 angas + samvatsara/ayana/ruthu/masa, sunrise/sunset, Rahu/Yama/Gulika | Durmuhurtam, Varjyam, Amrita kalam                                            | Muhurtham finder      |
| Sankalpam            | ✅ Text (Telugu/Devanagari/Roman) + stitched audio                                    | Server-rendered single-file audio                                             | —                     |
| Puja catalog         | ✅ Nitya Puja (short) + 3 deity pujas (Ganapathi, Lakshmi, Shiva)                     | Festival pujas (Vinayaka Chavithi, Varalakshmi Vratam, Satyanarayana Vratam…) | Vratha kathas, homams |
| Samagri + Naivedyam  | ✅ Checklist + recipe cards                                                           | Shopping list share                                                           | —                     |
| Puja runner          | ✅ Audio + line-synced text, Chant/Guided modes, manual/auto advance, offline packs   | 108-name tap/haptic offering mode                                             | Voice commands        |
| Notifications        | ✅ Local prayer-time reminders                                                        | Festival reminders                                                            | —                     |
| Backend              | ✅ Supabase: auth (optional), profile sync, content packs, audio CDN                  | Admin CMS                                                                     | Subscriptions         |
| Languages (UI)       | ✅ English + Telugu                                                                   | Hindi, Kannada, Tamil UI                                                      | —                     |

---

## 3. Client-spec corrections & decisions (read before building)

1. **The mockup is a visual reference only.** It contains North-Indian/Hindi placeholder content (Devanagari Hindi Sankalpa line, "Aarav Sharma", "Shukle Paksha", "Mase"). The app is **Telugu Smartha**: all ritual text is Telugu script (Sanskrit in Telugu lipi), with Devanagari and Roman as optional display scripts. Copy the layout, palette, components and hierarchy; do **not** copy the text.
2. **"Step 4 of 16"** in the mockup conflates steps with the 16 upacharas. Step count is data-driven per puja (Nitya puja ≈ 12–20 steps; Shodashopachara is a section inside Pradhana Puja).
3. **Typo in the client spec:** `ఎవంగුණ` contains a Sinhala glyph (`ු`). The correct form is `ఏవం గుణ విశేషణ విశిష్టాయాం`. Treat any pasted client text as unverified input.
4. **No Swiss Ephemeris.** It is AGPL/commercial dual-licensed; linking it into a closed-source app requires a paid licence. Use `astronomy-engine` (MIT) + Lahiri ayanamsa computed in-house. Prokerala API is used **only** as a test oracle in dev (optional), never at runtime.
5. **The voice must be a natural, real pandit voice, never an AI voice.** Every sound the devotee hears in production (mantras, shlokas, Sankalpam, instructions, Harathi) is recorded by a real human pandit, and must sound like a pandit performing a real pooja at home, not like software speaking. Every Sankalpam variable (samvatsaram, tithi, nakshatram, gothram, etc.) is a **finite enumeration**, so the same pandit records each value once as an audio token (~250 clips). The only unbounded variable is the devotee's name, which follows §9.6.1: default **self-recite** (the devotee says their own name, as at a real pooja), optional **pandit voice clone** (same pandit's voice, consent required), and generic TTS is not allowed in production. See §9.6.1 for the full Voice Authenticity Policy.
6. **Sankalpam grammar is data-driven:** Sanskrit case endings change with the performer's gender and with spouse/family inclusion (`గోత్రోద్భవస్య` vs `గోత్రోద్భవాయాః`). Every enum value stores its **pre-declined locative form**; the builder never declines words algorithmically, except via approved suffix tables.
7. **Hindu day = sunrise to sunrise.** Vasaram before local sunrise is the previous weekday. Tithi/nakshatra for the Sankalpam = the values prevailing at the moment the puja starts (configurable to "at sunrise").
8. **Content authority:** a named pandit reviewer must sign off on all content before release (Gate in Phase 10). This is a non-code dependency; start sourcing in Phase 0.

---

## 4. Tech stack (final)

| Layer                      | Choice                                                                                                                                                                                     | Why                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Monorepo                   | **pnpm workspaces + Turborepo**                                                                                                                                                            | Shared pure-TS packages (panchangam, sankalpam, content) tested independently of the app                               |
| App framework              | **Expo (latest stable SDK, New Architecture on) + TypeScript strict**                                                                                                                      | One codebase, EAS build/update/submit, config plugins                                                                  |
| Navigation                 | **Expo Router** (file-based, typed routes)                                                                                                                                                 | Deep links to `pooja/[slug]`, modal player                                                                             |
| Styling                    | **NativeWind v4** + design tokens in `packages/ui/tokens.ts`                                                                                                                               | Tailwind ergonomics; tokens shared with Skia drawings                                                                  |
| Graphics/animation         | **react-native-reanimated**, **@shopify/react-native-skia**                                                                                                                                | Calendar dial, waveform disc, gold gradients, progress ring                                                            |
| Local state                | **Zustand** (+ `persist` → MMKV)                                                                                                                                                           | Profile, settings, checklist state                                                                                     |
| Player logic               | **XState v5** (`@xstate/react`)                                                                                                                                                            | The puja runner is a strict state machine (instruction → await action → chant → next); deterministic and testable      |
| Server state               | **TanStack Query v5**                                                                                                                                                                      | Content pack manifests, profile sync                                                                                   |
| Storage                    | **react-native-mmkv** (KV), **expo-file-system** (audio/content packs)                                                                                                                     | Fast, offline                                                                                                          |
| Audio                      | **react-native-track-player v4** (primary); `expo-audio` as fallback if RNTP blocks on the New Architecture in P0 spike                                                                    | Background playback, lock-screen controls, queue for stitched Sankalpam, rate control, audio-focus handling            |
| Astronomy                  | **astronomy-engine** (MIT)                                                                                                                                                                 | Sun/moon positions, rise/set; runs in JS on-device                                                                     |
| Timezones                  | **tz-lookup** + **date-fns-tz**                                                                                                                                                            | Correct local time for NRI locations                                                                                   |
| Transliteration            | **@indic-transliteration/sanscript** (build-time)                                                                                                                                          | Telugu → Devanagari / IAST generated at content build, not runtime                                                     |
| Validation                 | **zod**                                                                                                                                                                                    | Content schema, API payloads, env                                                                                      |
| i18n                       | **i18next + react-i18next + expo-localization**                                                                                                                                            | English/Telugu UI                                                                                                      |
| Location                   | **expo-location** + offline city list (`content/cities.json`)                                                                                                                              | GPS or manual city                                                                                                     |
| Notifications              | **expo-notifications** + **expo-background-task**                                                                                                                                          | Local prayer-time reminders, rescheduled daily                                                                         |
| Misc device                | **expo-keep-awake**, **expo-haptics**, **expo-image**, **expo-font**                                                                                                                       | Screen on during puja, tactile cues                                                                                    |
| Backend                    | **Supabase**: Postgres + RLS, Auth, Storage (audio + packs via CDN), Edge Functions (Deno)                                                                                                 | Minimal backend; the app works fully as a guest                                                                        |
| Chant & instruction voice  | **Real human pandit, studio-recorded** (no AI)                                                                                                                                             | Authentic svara, rhythm and devotional feel; credibility with traditional Telugu families                              |
| Devotee name               | Default **self-recite** (no audio needed). Optional: Edge Function → **pandit voice clone** (e.g., ElevenLabs Professional Voice Clone trained only on this pandit's consented recordings) | The name must sound like the same pandit or be spoken by the devotee; a generic TTS voice is not allowed in production |
| Audio render worker (v1.x) | **Cloud Run** container with ffmpeg (Node)                                                                                                                                                 | Optional server-side single-file Sankalpam if client-side queue gaps are audible                                       |
| Monitoring                 | **Sentry** (`@sentry/react-native`), **PostHog** (analytics, feature flags)                                                                                                                | Crash and funnel visibility                                                                                            |
| Testing                    | **Vitest** (packages), **jest-expo + RNTL** (app), **Maestro** (E2E)                                                                                                                       |                                                                                                                        |
| CI/CD                      | **GitHub Actions** + **EAS Build / Submit / Update** (channels: `dev`, `preview`, `production`)                                                                                            |                                                                                                                        |
| Lint/format                | ESLint (flat config) + Prettier + `tsc --noEmit`                                                                                                                                           | `pnpm verify` = lint + typecheck + test                                                                                |

> Expo Go is **not** supported (RNTP, MMKV and Skia need native code). Use EAS **development builds** from Phase 0.

---

## 5. Architecture

```
┌──────────────────────────── Mobile app (Expo) ─────────────────────────────┐
│ UI (Expo Router screens, NativeWind, Skia)                                 │
│   │                                                                        │
│   ├── stores/ (Zustand+MMKV): devotee, settings, checklist, downloads      │
│   ├── machines/pujaRunner.machine.ts (XState) ──► services/audio (RNTP)    │
│   ├── services/panchangam  ──► packages/panchangam (pure TS, on-device)    │
│   ├── services/sankalpam   ──► packages/sankalpam  (text + audio plan)     │
│   ├── services/content     ──► downloaded content packs (JSON + m4a)       │
│   └── services/notifications (local schedules from panchangam)             │
└───────────────┬────────────────────────────────────────────────────────────┘
                │ HTTPS (only for: sign-in, sync, pack download, optional name clone)
┌───────────────▼───────────── Supabase ─────────────────────────────────────┐
│ Auth │ Postgres (profiles, family, packs, sessions) + RLS │ Storage (CDN)  │
│ Edge Functions: name-voice (pandit clone, optional), pack-manifest,        │
│                 delete-account                                             │
└───────────────┬────────────────────────────────────────────────────────────┘
                │ (v1.x, optional)
         Cloud Run ffmpeg worker: render stitched Sankalpam → Storage
```

**Principles**

- **Offline-first:** Panchangam is computed on-device. Puja packs (JSON + audio) are downloaded before the first run and verified by checksum. The runner reads only local files.
- **Content as versioned packs:** `content/` in the repo → `pnpm content:build` → validated, transliterated `pack.json` + audio manifest → uploaded to Storage → `content_packs` row. The app checks the manifest and downloads diffs.
- **Guest-first:** no sign-in is required. Sign-in (Google / Apple / phone OTP) only enables multi-device sync and backup.

---

## 6. Repository structure

```
epooja/
├── apps/
│   └── mobile/
│       ├── app/                              # Expo Router
│       │   ├── _layout.tsx                   # fonts, providers, theme, i18n
│       │   ├── (onboarding)/
│       │   │   ├── welcome.tsx
│       │   │   ├── language.tsx
│       │   │   ├── devotee.tsx               # name, gender, gothram, nakshatram, rasi
│       │   │   ├── family.tsx
│       │   │   └── location.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx               # custom tab bar
│       │   │   ├── index.tsx                 # Today (Vedic Calendar – Today)
│       │   │   ├── poojas.tsx                # catalog
│       │   │   ├── calendar.tsx              # month panchangam
│       │   │   └── profile.tsx               # My Profile
│       │   ├── pooja/[slug]/index.tsx        # puja detail
│       │   ├── pooja/[slug]/prepare.tsx      # Pooja Preparation
│       │   ├── pooja/[slug]/recipe/[id].tsx
│       │   ├── player/[slug].tsx             # Chant Player (fullScreenModal)
│       │   └── settings/{index,audio,notifications,scripts,account}.tsx
│       ├── src/
│       │   ├── components/                   # screen-level composites
│       │   ├── machines/pujaRunner.machine.ts
│       │   ├── services/{audio,content,panchangam,sankalpam,notifications,location,nameVoice,sync}/
│       │   ├── stores/{devotee,settings,checklist,downloads,session}.ts
│       │   ├── hooks/
│       │   ├── i18n/{en,te}.json
│       │   └── lib/{supabase,sentry,analytics,env}.ts
│       ├── assets/{fonts,images,icons}/
│       ├── app.config.ts
│       └── eas.json
├── packages/
│   ├── panchangam/          # pure TS: astronomy → angas, timings (no RN imports)
│   ├── sankalpam/           # pure TS: text builder + audio plan builder
│   ├── content/             # zod schemas, types, loaders, transliteration build step
│   ├── ui/                  # tokens.ts, primitive components (Card, GoldButton, CheckRow…)
│   └── config/              # eslint, tsconfig, prettier presets
├── content/
│   ├── enums/               # samvatsara.json, masa.json, tithi.json, nakshatra.json, yoga.json, karana.json, vasara.json, ayana.json, ruthu.json, rasi.json, gotra.json, dik.json
│   ├── sankalpam/           # template.json, suffix-tables.json, geo-regions.json
│   ├── pujas/               # nitya-puja.json, ganapathi.json, lakshmi.json, shiva.json
│   ├── samagri/             # items.json (shared catalog with icons)
│   ├── naivedyam/           # recipes.json
│   ├── cities.json
│   ├── audio/manifest.json  # clip ids → paths, durations, loudness, checksum
│   └── REVIEW_QUEUE.md
├── supabase/
│   ├── migrations/
│   ├── functions/{name-voice,pack-manifest,delete-account}/
│   └── seed.sql
├── tools/
│   ├── content-build/       # validate → transliterate → pack → upload
│   ├── cue-tapper/          # tiny web tool: play audio, tap per line → cues JSON
│   └── panchangam-fixtures/ # scripts to build golden test fixtures
├── docs/
│   ├── reference/ui-reference.png
│   ├── adr/                 # architecture decision records
│   └── content-guide.md     # how pandits/editors author content
├── .github/workflows/{ci.yml,eas-preview.yml}
├── AGENTS.md                # condensed §0 + §15 rules for the agent
├── turbo.json
└── package.json
```

---

## 7. Design system (derived from the reference image)

### 7.1 Visual language

Temple-warm and festive: a **deep maroon** header band with a curved bottom edge, a **saffron-to-gold** gradient on the hero/profile headers, **cream** surfaces, **antique gold** accents and rings, soft warm shadows, and rounded cards. Photographic food thumbnails and small illustrated samagri icons.

### 7.2 Tokens (`packages/ui/tokens.ts`)

```ts
export const colors = {
  maroon: {
    950: '#2E0912',
    900: '#4A0F1E',
    800: '#5E1426',
    700: '#6E1A2E',
    600: '#7D2235',
    500: '#94304A',
  },
  saffron: { 600: '#E07F22', 500: '#F0A040', 400: '#F6B85C', 300: '#FAD08E', 200: '#FCE3B8' },
  gold: {
    700: '#A77B26',
    600: '#C09236',
    500: '#D4A548',
    400: '#E1BC68',
    300: '#E9CC85',
    200: '#F3E2B6',
  },
  cream: { 50: '#FFFBF5', 100: '#FFF6E9', 200: '#FBEFDB', 300: '#F3E3C4', 400: '#E9D3AA' },
  ink: { 900: '#2B1A12', 700: '#4A3325', 500: '#6B5444', 400: '#8C7563' },
  success: '#3E8E4F',
  danger: '#B3261E',
};
export const gradients = {
  saffronHeader: ['#F6B85C', '#F0A040', '#FBEFDB'], // top → bottom fade into cream
  goldCoin: ['#F3E2B6', '#D4A548', '#A77B26'], // radial: date dial, play button
  maroonHeader: ['#6E1A2E', '#4A0F1E'],
};
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const spacing = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48];
export const shadow = {
  card: { color: 'rgba(110,50,20,0.14)', y: 4, blur: 14 },
  raised: { color: 'rgba(110,50,20,0.22)', y: 8, blur: 24 },
};
```

Dark mode (v1.x): background `maroon.950`, cards `#2B1218`, text `cream.100`, accents gold.

### 7.3 Typography

| Role                      | Font                                         | Notes                                                                  |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| UI Latin (titles, labels) | **Mukta** (600 titles, 500 labels, 400 body) | Matches the mockup's clean semi-condensed sans; also covers Devanagari |
| UI Telugu                 | **Noto Sans Telugu**                         | Labels, buttons, instructions                                          |
| Mantra text: Telugu       | **Tiro Telugu** (fallback Noto Serif Telugu) | Larger size (20–24), line-height 1.6                                   |
| Mantra text: Devanagari   | **Tiro Devanagari Sanskrit**                 | Supports Vedic svara marks                                             |
| Transliteration           | Mukta Italic 400 / IAST                      | Diacritics must render (ā ṛ ṣ ṇ ṃ)                                     |

> **Spike (P1):** verify Vedic svara marks (U+0951/U+0952 and Vedic Extensions U+1CD0–1CFF) render on Telugu fonts on both platforms. If not, svara display is Devanagari-only and Telugu shows plain text.

### 7.4 Core components (`packages/ui` + `apps/mobile/src/components`)

| Component           | Spec (from mockup)                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CurvedHeader`      | Maroon or saffron gradient band, 180–240 px tall, convex bottom curve (Skia path), centred title in cream (maroon header) or maroon (saffron header)                |
| `AvatarRing`        | 96 px circle, 3 px gold ring, edit-badge bottom-right (maroon dot with pencil)                                                                                      |
| `FieldCard`         | Cream-200 fill, gold-300 1 px border, radius 12, small label (ink-500, 12) above value (ink-900, 16/600)                                                            |
| `FamilyChip`        | 56 px saffron circle with maroon person glyph, name below; horizontal scroll, "+" chip at end                                                                       |
| `DateDial`          | Skia gold coin (radial gradient + inner bevel ring + tick marks); weekday / day (48, bold) / month / year; small gold notch at top                                  |
| `AngaBadge`         | Gold circular icon (moon/star/leaf/calendar) + two-line label (`Tithi:` / value), placed at the 4 corners around the dial                                           |
| `SunTimesCard`      | Two columns: sunrise icon + time │ sunset icon + time; divider; cream card                                                                                          |
| `TimingRow`         | Bell icon (gold circle) + label + right-aligned time range; hairline separators                                                                                     |
| `CheckRow`          | Card row: checkbox (saffron fill when checked; maroon variant), label, illustrated icon at right; press → haptic                                                    |
| `RecipePreviewCard` | Saffron-gradient card, food photo left (radius 12), "Offerings Recipe Preview:" + title, maroon pill button "View Recipe"                                           |
| `ChantDisc`         | 220 px maroon disc with gold outer ring and saffron glow; animated waveform bars (Skia) driven by playback state + precomputed peak data; soft side waves radiating |
| `StepProgress`      | "Step N of M: {step title}" + slider (saffron track, maroon thumb) for position within step                                                                         |
| `MantraText`        | Current line highlighted (maroon, bold), next/previous dimmed; transliteration below; optional meaning toggle                                                       |
| `TransportControls` | Prev step │ gold coin play/pause (72 px) │ next step                                                                                                                |
| `ModeToggle`        | "Chant Mode ◯ Guided Narration Mode" switch, maroon track                                                                                                           |
| `TabBar`            | Cream bar, gold active pill, icons: Today (sun), Poojas (diya), Calendar, Profile                                                                                   |

### 7.5 Motion & feel

- Dial: slow idle shimmer (sweep gradient, 6 s loop) and a 300 ms spring on date change.
- Checkbox: scale 0.9→1 plus a light haptic.
- ChantDisc: bars animate only while playing and ease to a flat line on pause; ring pulses subtly on step change.
- Respect `reduceMotion` (disable shimmer and pulses).

---

## 8. Screen specifications

### 8.1 Onboarding (first run)

1. **Welcome:** brand, 3 value props, "Begin".
2. **Language:** UI language (తెలుగు / English) + mantra script (Telugu / Devanagari / Roman).
3. **Devotee:** name (Telugu & English fields; the name is shown on screen for self-recite; the English spelling is kept for display), gender (drives Sankalpam grammar), gothram (searchable list of pandit-recorded gotras + "other" free text → self-recite for that gotra, and the new gotra is added to the pandit recording queue), janma nakshatram (27), padam (optional 1–4), rasi (auto-suggested from nakshatra+padam, editable), "I don't know" allowed for each.
4. **Family:** add spouse/children/parents (name, relation, gender, optional nakshatram/rasi). Toggle "include in Sankalpam".
5. **Location:** GPS permission, or city search (offline list); shows the computed timezone.
   → lands on **Today**.

### 8.2 Today — "Vedic Calendar – Today" (mockup screen 2)

- Maroon curved header titled with localized "Vedic Calendar – Today".
- `DateDial` with 4 `AngaBadge`s: Tithi (top-left), Nakshatram (top-right), Ruthuvu (bottom-left), Masam (bottom-right). Tap the dial → full Panchangam sheet (all angas with end times, samvatsaram, ayanam, paksham, yogam, karanam, Rahu kalam, Yamagandam, Gulika).
- `SunTimesCard`.
- "Daily Prayer Timings": Morning / Midday / Evening (derived: Pratah sandhya from sunrise, Madhyahna around local noon, Sayam sandhya from sunset; exact windows in `content/timings.json`), each with a bell toggle for reminders.
- "Today's Puja" CTA card → default Nitya Puja (or the festival puja if today is a festival, v1.x).
- Date swipe left/right to view other days.

### 8.3 Poojas (catalog)

- Sections: Nitya, Deity pujas, Festivals (v1.x). Card: deity art, name (te/en), duration (short/full), "Downloaded" badge.

### 8.4 Pooja detail → Preparation (mockup screen 3)

- Detail: description, duration variants (Short ≈15 min / Full ≈45 min), steps overview accordion, Download button (size shown), "Prepare" and "Start".
- **Preparation:** maroon curved header "Pooja Preparation"; card "Essentials for Today's Ritual" with `CheckRow`s (per puja; persisted per puja per day); progress "4/6 ready"; `RecipePreviewCard` for the day's naivedyam; "Start Pooja" sticky button enabled always (never block), with a gentle warning if items are unchecked.

### 8.5 Recipe

- Hero photo, name (te/en), time, servings stepper (scales quantities), ingredients, steps, "ritual notes" (e.g., no onion/garlic, offer before tasting).

### 8.6 Chant Player (mockup screen 4)

- Saffron gradient background; title "{Puja name} – Chant Player".
- `ChantDisc`, `StepProgress`, `MantraText` (script per setting + transliteration), `TransportControls`, `ModeToggle`.
- Top-right overflow: speed (0.75/1/1.25), auto-advance on/off, text size, show meaning, samagri checklist sheet (the client's "Samagri checklist modal").
- **Action prompt overlay** (Guided mode): after the instruction clip, show a large card "ఇప్పుడు దీపం వెలిగించండి / Light the lamp now" with a "Done ✓" button (or auto-continue after N seconds if auto-advance is on).
- **Namavali mode:** during Ashtottaram, each name shows a flower/akshatalu tap target with a haptic per name, and a counter "37 / 108".
- Keep screen awake; lock-screen controls; resume after interruption; exit confirm with "Resume later" (session persisted).

### 8.7 My Profile (mockup screen 1)

- Saffron curved header, `AvatarRing`, `FieldCard`s (Name, Gotra, Birth Star, Moon Sign), Family Members row, edit icon top-right. Settings entry.

### 8.8 Calendar (month)

- Month grid; each cell shows the tithi short name and a marker for ekadashi/purnima/amavasya/festival. Tap → that day's Today view.

---

## 9. Domain specifications

### 9.1 Panchangam engine (`packages/panchangam`)

**Inputs:** `{ instant: Date, lat, lng, tz }`. **Output:** `PanchangamData` (§9.4). Pure, deterministic, no network.

**Astronomy**

- Tropical ecliptic longitudes of Sun and Moon from `astronomy-engine` (apparent, geocentric, of-date).
- **Lahiri (Chitrapaksha) ayanamsa:** implement `lahiriAyanamsa(jd)`; start with the linear model `23.85306° + (jd − 2451545.0)/365.25 × 50.2791″/3600` and validate against fixtures (tolerance < 30″). Replace with a precession-based model if fixtures fail.
- Sidereal longitude `λs = norm360(λtropical − ayanamsa)`.

**Angas**

| Item                             | Rule                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tithi                            | `floor(norm360(λmoon − λsun)/12) + 1` (1–30); 1–15 Shukla, 16–30 Krishna; 15 = Pournami, 30 = Amavasya                                                                                                                                     |
| Paksham                          | Shukla if tithi ≤ 15 else Krishna                                                                                                                                                                                                          |
| Nakshatram                       | `floor(λs_moon / (360/27)) + 1`; padam = `floor((λs_moon mod 13.333…)/3.333…) + 1`                                                                                                                                                         |
| Yogam                            | `floor(norm360(λs_sun + λs_moon) / (360/27)) + 1`                                                                                                                                                                                          |
| Karanam                          | half-tithi index k = `floor(norm360(λmoon − λsun)/6)` (0–59): k=0 Kimstughna; k=1…56 cycle [Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti]; k=57 Shakuni, 58 Chatushpada, 59 Naga                                                 |
| Vasaram                          | Weekday of the **most recent local sunrise**                                                                                                                                                                                               |
| Masam (Amanta/Chandramana)       | Find the new moons bracketing `instant`. Sun's sidereal rashi at the starting new moon = r (Mesha=0). Masa index = `(r + 1) mod 12` (Chaitra=0). If the Sun's rashi is the same at both new moons → **Adhika** masam of that name          |
| Ruthuvu                          | From masam (lunar): Vasanta = Chaitra, Vaishakha; Grishma = Jyeshtha, Ashadha; Varsha = Shravana, Bhadrapada; Sharad = Ashvayuja, Kartika; Hemanta = Margashira, Pushya; Shishira = Magha, Phalguna. Adhika takes its nija month's ruthuvu |
| Ayanam                           | Uttarayanam while the Sun's sidereal rashi ∈ {Makara…Mithuna}; else Dakshinayanam                                                                                                                                                          |
| Samvatsaram                      | 60-year cycle changing at Chaitra Shukla Pratipada (Ugadi). `index = ((Y − 1987) mod 60) + 1`, where Y = Gregorian year of the most recent Ugadi. Fixtures: 2024-25 Krodhi (38), 2025-26 Vishvavasu (39), 2026-27 Parabhava (40)           |
| Sunrise / sunset                 | `astronomy-engine` `SearchRiseSet` (upper limb, standard refraction; configurable)                                                                                                                                                         |
| Rahu kalam / Yamagandam / Gulika | Day length ÷ 8; segment (1-indexed) by weekday: Rahu Sun 8, Mon 2, Tue 7, Wed 5, Thu 6, Fri 4, Sat 3. Yama Sun 5, Mon 4, Tue 3, Wed 2, Thu 1, Fri 7, Sat 6. Gulika Sun 7, Mon 6, Tue 5, Wed 4, Thu 3, Fri 2, Sat 1 (verify with fixtures)  |
| Transition times                 | For each anga, find start/end instants by bracketing + bisection on the angular function (precision 30 s)                                                                                                                                  |

**Performance:** `getPanchangam(day)` < 20 ms on a mid-range Android; memoize per (date, lat/lng rounded to 0.01°).

**Golden fixtures:** `packages/panchangam/test/fixtures/*.json`: ≥ 60 cases (Hyderabad, Vijayawada, Tirupati, Visakhapatnam, New Jersey, Dallas, Dubai, London, Sydney) × dates spanning an adhika masam year, month boundaries, sunrise-straddling tithis, DST switches. Expected values are taken from a reference panchangam and hand-verified. Tolerances: anga identity exact; transition times ±2 min; sunrise ±1 min.

### 9.2 Enumerations (`content/enums/*.json`)

Each value: `{ id, index, te, iast, dev, locative: { te, iast }, audioTokenId }`. The `locative` field holds the pre-declined Sankalpam phrase (e.g., nakshatra Rohini → `రోహిణీ నక్షత్రే`). All are **PENDING_PANDIT_REVIEW** until signed.

Seed lists (IAST; the pandit finalizes Telugu spellings):

- **Samvatsara (60):** Prabhava, Vibhava, Śukla, Pramodūta, Prajotpatti, Āṅgīrasa, Śrīmukha, Bhāva, Yuva, Dhātu, Īśvara, Bahudhānya, Pramāthi, Vikrama, Vṛṣa, Citrabhānu, Svabhānu, Tāraṇa, Pārthiva, Vyaya, Sarvajit, Sarvadhāri, Virodhi, Vikṛti, Khara, Nandana, Vijaya, Jaya, Manmatha, Durmukhi, Hevilambi, Vilambi, Vikāri, Śārvari, Plava, Śubhakṛt, Śobhakṛt, Krodhi, Viśvāvasu, Parābhava, Plavaṅga, Kīlaka, Saumya, Sādhāraṇa, Virodhikṛt, Paridhāvi, Pramādīca, Ānanda, Rākṣasa, Nala, Piṅgala, Kālayukti, Siddhārthi, Raudri, Durmati, Dundubhi, Rudhirodgāri, Raktākṣi, Krodhana, Akṣaya.
- **Nakshatra (27, Telugu common forms):** అశ్విని, భరణి, కృత్తిక, రోహిణి, మృగశిర, ఆర్ద్ర, పునర్వసు, పుష్యమి, ఆశ్లేష, మఖ, పుబ్బ, ఉత్తర, హస్త, చిత్త, స్వాతి, విశాఖ, అనూరాధ, జ్యేష్ఠ, మూల, పూర్వాషాఢ, ఉత్తరాషాఢ, శ్రవణం, ధనిష్ఠ, శతభిషం, పూర్వాభాద్ర, ఉత్తరాభాద్ర, రేవతి.
- **Masa (12):** చైత్రం, వైశాఖం, జ్యేష్ఠం, ఆషాఢం, శ్రావణం, భాద్రపదం, ఆశ్వయుజం, కార్తీకం, మార్గశిరం, పుష్యం, మాఘం, ఫాల్గుణం (+ `adhika` prefix token).
- **Vasara (Sankalpam forms):** భాను (Sun), ఇందు (Mon), భౌమ (Tue), సౌమ్య (Wed), గురు/బృహస్పతి (Thu), భృగు (Fri), స్థిర (Sat) + వాసరే.
- **Yoga (27):** Viṣkambha, Prīti, Āyuṣmān, Saubhāgya, Śobhana, Atigaṇḍa, Sukarma, Dhṛti, Śūla, Gaṇḍa, Vṛddhi, Dhruva, Vyāghāta, Harṣaṇa, Vajra, Siddhi, Vyatīpāta, Varīyān, Parigha, Śiva, Siddha, Sādhya, Śubha, Śukla, Brahma, Indra, Vaidhṛti.
- **Karana (11), Rasi (12), Ayana (2), Ruthu (6), Dik (8: pūrva, āgneya, dakṣiṇa, nairṛti, paścima, vāyavya, uttara, īśānya), Gotra (curated ~60, pandit-supplied).**

### 9.3 Sankalpam engine (`packages/sankalpam`)

**Template** (`content/sankalpam/template.json`) is an ordered list of segments; each is either `fixed` (pre-recorded clip + text) or `slot` (resolved from Panchangam/devotee). Structure reference (IAST; the pandit finalizes):

```
mamopātta samasta durita kṣayadvārā śrī parameśvara prītyartham, śubhe śobhane muhūrte,
śrī mahāviṣṇor ājñayā pravartamānasya, adya brahmaṇaḥ dvitīya parārdhe, śvetavarāha kalpe,
vaivasvata manvantare, kaliyuge prathama pāde,
{GEO.dvipa} {GEO.varsha} {GEO.khanda} {GEO.meru} {GEO.srisaila_dik} {GEO.river_region}
śobhana gṛhe, samasta devatā brāhmaṇa harihara guru caraṇa sannidhau,
asmin vartamāna vyāvahārika cāndramānena {SAMVATSARA} nāma saṃvatsare, {AYANA} {RITU} {MASA} {PAKSHA}
{TITHI} {VASARA} {NAKSHATRA} {YOGA} {KARANA}
evaṃ guṇa viśeṣaṇa viśiṣṭāyāṃ śubha tithau,
{GOTRA} {SELF.gotrodbhava} {NAME} {SELF.namadheya} {SPOUSE_CLAUSE} {FAMILY_CLAUSE}
asmākaṃ saha kuṭumbānāṃ kṣema sthairya vijaya abhaya āyur ārogya aiśvarya abhivṛddhyartham,
dharma artha kāma mokṣa caturvidha phala puruṣārtha siddhyartham,
{DEITY} prītyartham, yāvacchakti dhyāna āvāhanādi ṣoḍaśopacāra pūjāṃ kariṣye ||
```

**Rules**

- **GEO block** (`geo-regions.json`): resolved from the location. For India: Jambūdvīpe, Bhāratavarṣe, Bharatakhaṇḍe, Meroḥ dakṣiṇa digbhāge. `srisaila_dik` = 8-point compass bearing from Srisailam (16.0733 N, 78.8683 E) to the user; river region by polygon lookup (e.g., Kṛṣṇā-Godāvaryoḥ madhya pradeśe), with manual override in settings. **Outside India:** the region table supplies the pandit-approved variant (e.g., the dvīpa/varṣa used by US Telugu temples). The builder never guesses; unknown region → user chooses from a pandit-approved list.
- **Gender suffix tables** (`suffix-tables.json`): male `gotrodbhavasya / nāmadheyasya`, female `gotrodbhavāyāḥ / nāmadheyāyāḥ`; spouse clause variants (`dharmapatnī sametasya` for a male performer; the female-performer variant is supplied by the pandit); family clause variants.
- **Name handling:** the name is inserted undeclined, followed by the declined `nāmadheya` form (standard practice).
- **Time basis:** angas at puja start (`sankalpaTimeBasis: 'now' | 'sunrise'`, default `now`).
- **Outputs:** `buildSankalpamText(input) → { te: string, dev: string, iast: string, segments: Segment[] }` and `buildSankalpamAudioPlan(input, manifest) → AudioPlanItem[]` (ordered clip ids + the self-recite/pandit-clone slot for the name (and for a custom gotra) + per-segment text cue offsets computed from manifest durations).
- **Snapshot tests:** 20 fixture inputs (male/female, with/without spouse, family of 4, NRI location, adhika masam) → approved text snapshots.

### 9.4 TypeScript models (`packages/content/src/types.ts`)

```ts
export type Script = 'te' | 'dev' | 'iast';
export type Gender = 'male' | 'female';
export type LocalizedText = { te: string; dev?: string; iast?: string; en?: string };

export interface FamilyMember {
  id: string;
  name: LocalizedText;
  relation: 'spouse' | 'son' | 'daughter' | 'father' | 'mother' | 'other';
  gender: Gender;
  nakshatraId?: string;
  rasiId?: string;
  includeInSankalpam: boolean;
}

export interface Devotee {
  id: string;
  name: LocalizedText;
  gender: Gender;
  gotraId?: string;
  gotraCustom?: string; // custom → self-recite until pandit records it
  nakshatraId?: string;
  nakshatraPada?: 1 | 2 | 3 | 4;
  rasiId?: string;
  location: {
    lat: number;
    lng: number;
    tz: string;
    cityId?: string;
    label: string;
    geoRegionId?: string;
  };
  family: FamilyMember[];
  prefs: {
    uiLang: 'te' | 'en';
    mantraScript: Script;
    showTransliteration: boolean;
    nameAudio: 'self_recite' | 'pandit_clone';
  }; // default 'self_recite'
  nameAudio?: { url: string; localPath?: string; hash: string };
  createdAt: string;
  updatedAt: string;
}

export interface AngaSpan<T extends string = string> {
  id: T;
  index: number;
  startsAt: string;
  endsAt: string;
}

export interface PanchangamData {
  date: string;
  tz: string;
  lat: number;
  lng: number;
  computedFor: string;
  samvatsara: { id: string; index: number };
  ayana: 'uttarayana' | 'dakshinayana';
  ritu: string;
  masa: { id: string; adhika: boolean };
  paksha: 'shukla' | 'krishna';
  tithi: AngaSpan;
  nakshatra: AngaSpan & { pada: 1 | 2 | 3 | 4 };
  yoga: AngaSpan;
  karana: AngaSpan;
  vasara: { id: string; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 };
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  rahuKalam: [string, string];
  yamagandam: [string, string];
  gulikaKalam: [string, string];
  prayerTimings: { id: 'morning' | 'midday' | 'evening'; start: string; end: string }[];
}

export interface SamagriItem {
  id: string;
  name: LocalizedText;
  icon: string; // asset key
  quantity?: LocalizedText;
  optional?: boolean;
  notes?: LocalizedText;
}

export interface NaivedyamRecipe {
  id: string;
  name: LocalizedText;
  image: string;
  timeMinutes: number;
  baseServings: number;
  ingredients: { id: string; name: LocalizedText; amount: number; unit: string }[];
  steps: LocalizedText[];
  ritualNotes?: LocalizedText[];
}

export type StepSection = 'poorvangam' | 'pradhana' | 'uttarangam';
export type Upachara =
  | 'dhyana'
  | 'avahana'
  | 'asana'
  | 'padya'
  | 'arghya'
  | 'achamaniya'
  | 'snana'
  | 'vastra'
  | 'yajnopavita'
  | 'gandha'
  | 'pushpa'
  | 'dhupa'
  | 'deepa'
  | 'naivedya'
  | 'tambula'
  | 'nirajana';

export interface MantraLine {
  id: string;
  text: LocalizedText;
  meaning?: LocalizedText;
  cue?: { startMs: number; endMs: number }; // relative to the step's chant clip
  repeat?: number;
}

export interface PujaStep {
  id: string;
  order: number;
  section: StepSection;
  upachara?: Upachara;
  title: LocalizedText;
  instruction?: {
    text: LocalizedText;
    audioId: string;
    action?: { kind: 'confirm' | 'timer'; seconds?: number; icon: string };
  };
  chant?: { audioId: string; lines: MantraLine[] };
  dynamic?: 'sankalpam'; // chant built at runtime by the sankalpam engine
  namavali?: { count: number; names: MantraLine[]; offering: 'pushpa' | 'akshata' | 'kumkuma' };
  samagriUsed?: string[];
  variants?: ('short' | 'full')[]; // which duration variants include this step
}

export interface PujaCatalogItem {
  id: string;
  slug: string;
  deity: string;
  category: 'nitya' | 'deity' | 'festival';
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  durations: { short?: number; full: number }; // minutes
  samagri: string[];
  naivedyam: string[];
  steps: PujaStep[];
  pack: { version: string; sizeBytes: number; audioIds: string[] };
  review: { status: 'PENDING_PANDIT_REVIEW' | 'APPROVED'; reviewer?: string; date?: string };
}

export interface AudioClip {
  id: string;
  path: string;
  durationMs: number;
  lufs: number;
  sha256: string;
  kind: 'chant' | 'instruction' | 'sankalpam_fixed' | 'sankalpam_token' | 'name_clone';
  voice: 'pandit_primary' | 'narrator_te' | 'pandit_clone' | 'dev_placeholder'; // dev_placeholder is blocked from production builds
  humanRecorded: boolean; // must be true for every chant/instruction/sankalpam clip in production
}
```

All of the above also exist as **zod schemas** (`packages/content/src/schemas.ts`); the content build fails on any violation.

### 9.5 Sample content (`content/pujas/nitya-puja.json`, abridged)

```json
{
  "id": "nitya-puja-short",
  "slug": "nitya-puja",
  "deity": "generic",
  "category": "nitya",
  "title": { "te": "నిత్య పూజ", "en": "Daily Nitya Puja" },
  "description": {
    "te": "⟨TODO_PANDIT⟩",
    "en": "A short daily Smartha puja with Ganapathi prarthana, sankalpam and panchopachara."
  },
  "image": "pujas/nitya.webp",
  "durations": { "short": 15, "full": 35 },
  "samagri": [
    "pasupu",
    "kumkuma",
    "akshatalu",
    "deepam",
    "pushpalu",
    "kalasham",
    "agarbatti",
    "karpuram"
  ],
  "naivedyam": ["panchamrutham"],
  "review": { "status": "PENDING_PANDIT_REVIEW" },
  "pack": { "version": "0.1.0", "sizeBytes": 0, "audioIds": [] },
  "steps": [
    {
      "id": "deeparadhana",
      "order": 1,
      "section": "poorvangam",
      "title": { "te": "దీపారాధన", "en": "Lighting the lamp" },
      "instruction": {
        "text": { "te": "ఇప్పుడు దీపం వెలిగించండి.", "en": "Light the lamp now." },
        "audioId": "instr.deeparadhana",
        "action": { "kind": "confirm", "icon": "diya" }
      },
      "chant": {
        "audioId": "chant.deeparadhana",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT: deeparadhana_shloka_line_1⟩" } }]
      },
      "samagriUsed": ["deepam"],
      "variants": ["short", "full"]
    },
    {
      "id": "achamanam",
      "order": 2,
      "section": "poorvangam",
      "title": { "te": "ఆచమనం", "en": "Achamanam" },
      "instruction": {
        "text": {
          "te": "కుడి అరచేతిలో కొద్దిగా నీరు తీసుకొని ప్రతి నామానికి ఒకసారి స్వీకరించండి.",
          "en": "Take a little water in the right palm and sip once for each name."
        },
        "audioId": "instr.achamanam",
        "action": { "kind": "confirm", "icon": "water" }
      },
      "chant": {
        "audioId": "chant.achamanam",
        "lines": [
          { "id": "l1", "text": { "te": "ఓం కేశవాయ స్వాహా" } },
          { "id": "l2", "text": { "te": "ఓం నారాయణాయ స్వాహా" } },
          { "id": "l3", "text": { "te": "ఓం మాధవాయ స్వాహా" } },
          { "id": "l4", "text": { "te": "⟨TODO_PANDIT: remaining_keshavadi_namas⟩" } }
        ]
      },
      "variants": ["short", "full"]
    },
    {
      "id": "ganapathi-dhyanam",
      "order": 3,
      "section": "poorvangam",
      "title": { "te": "విఘ్నేశ్వర ప్రార్థన", "en": "Prayer to Ganapathi" },
      "instruction": {
        "text": { "te": "చేతులు జోడించి నమస్కరించండి.", "en": "Join your palms in namaskaram." },
        "audioId": "instr.namaskaram"
      },
      "chant": {
        "audioId": "chant.shuklambaradharam",
        "lines": [
          { "id": "l1", "text": { "te": "శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజమ్ ।" } },
          { "id": "l2", "text": { "te": "ప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ॥" } }
        ]
      },
      "variants": ["short", "full"]
    },
    {
      "id": "pranayamam",
      "order": 4,
      "section": "poorvangam",
      "title": { "te": "ప్రాణాయామం", "en": "Pranayamam" },
      "chant": {
        "audioId": "chant.pranayamam",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["full"]
    },
    {
      "id": "sankalpam",
      "order": 5,
      "section": "poorvangam",
      "title": { "te": "సంకల్పం", "en": "Sankalpam" },
      "instruction": {
        "text": {
          "te": "కుడి చేతిలో అక్షతలు, నీరు తీసుకొని సంకల్పం చెప్పండి.",
          "en": "Hold akshatalu and water in the right hand for the Sankalpam."
        },
        "audioId": "instr.sankalpam",
        "action": { "kind": "confirm", "icon": "akshata" }
      },
      "dynamic": "sankalpam",
      "samagriUsed": ["akshatalu"],
      "variants": ["short", "full"]
    },
    {
      "id": "kalasharadhanam",
      "order": 6,
      "section": "poorvangam",
      "title": { "te": "కలశారాధన", "en": "Kalasha worship" },
      "instruction": {
        "text": {
          "te": "ఇప్పుడు అక్షతలు తీసుకొని కలశంపై చల్లండి.",
          "en": "Sprinkle akshatalu on the kalasham."
        },
        "audioId": "instr.kalasham",
        "action": { "kind": "confirm", "icon": "kalash" }
      },
      "chant": {
        "audioId": "chant.kalasharadhanam",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["full"]
    },
    {
      "id": "ashtottaram",
      "order": 7,
      "section": "pradhana",
      "upachara": "pushpa",
      "title": { "te": "అష్టోత్తర శతనామావళి", "en": "108 Names" },
      "namavali": {
        "count": 108,
        "offering": "pushpa",
        "names": [{ "id": "n1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "chant": { "audioId": "chant.ashtottaram.generic", "lines": [] },
      "variants": ["full"]
    },
    {
      "id": "naivedyam",
      "order": 8,
      "section": "uttarangam",
      "upachara": "naivedya",
      "title": { "te": "నైవేద్యం", "en": "Naivedyam" },
      "instruction": {
        "text": {
          "te": "నైవేద్యాన్ని దేవుని ముందు ఉంచండి.",
          "en": "Place the naivedyam before the deity."
        },
        "audioId": "instr.naivedyam",
        "action": { "kind": "confirm", "icon": "prasadam" }
      },
      "chant": {
        "audioId": "chant.naivedyam",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["short", "full"]
    },
    {
      "id": "harathi",
      "order": 9,
      "section": "uttarangam",
      "upachara": "nirajana",
      "title": { "te": "మంగళ హారతి", "en": "Mangala Harathi" },
      "instruction": {
        "text": {
          "te": "కర్పూరం వెలిగించి హారతి ఇవ్వండి.",
          "en": "Light camphor and offer harathi."
        },
        "audioId": "instr.harathi",
        "action": { "kind": "confirm", "icon": "harathi" }
      },
      "chant": {
        "audioId": "chant.harathi",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["short", "full"]
    },
    {
      "id": "mantrapushpam",
      "order": 10,
      "section": "uttarangam",
      "title": { "te": "మంత్రపుష్పం", "en": "Mantra Pushpam" },
      "chant": {
        "audioId": "chant.mantrapushpam",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["full"]
    },
    {
      "id": "kshamapana",
      "order": 11,
      "section": "uttarangam",
      "title": { "te": "ఆత్మ ప్రదక్షిణ & క్షమాపణ", "en": "Pradakshina & Kshamapana" },
      "chant": {
        "audioId": "chant.kshamapana",
        "lines": [{ "id": "l1", "text": { "te": "⟨TODO_PANDIT⟩" } }]
      },
      "variants": ["short", "full"]
    },
    {
      "id": "prasada-sweekaram",
      "order": 12,
      "section": "uttarangam",
      "title": { "te": "తీర్థ ప్రసాద స్వీకరణ", "en": "Receiving teertham & prasadam" },
      "instruction": {
        "text": { "te": "తీర్థం, ప్రసాదం స్వీకరించండి.", "en": "Receive teertham and prasadam." },
        "audioId": "instr.prasadam",
        "action": { "kind": "confirm", "icon": "prasadam" }
      },
      "variants": ["short", "full"]
    }
  ]
}
```

Full Shodashopachara template (`content/pujas/_shodashopachara.json`) is included by deity pujas: dhyana → avahana → asana → padya → arghya → achamaniya → snana (+ panchamruta) → vastra → yajnopavita → gandha → pushpa (+ anga puja + ashtottaram) → dhupa → deepa → naivedya → tambula → nirajana; followed by mantrapushpam, pradakshina, kshamapana. Suktams (Purusha/Sri/…) attach per deity.

### 9.6 Audio engine

#### 9.6.1 Voice Authenticity Policy (non-negotiable)

The app must sound like **a real Telugu Smartha pandit sitting in the devotee's pooja room**, never like an AI or a machine reading text.

| Audio                                                                       | Source                                                         | Allowed in production?                                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mantras, shlokas, suktams, Ashtottaram, Mantra Pushpam, Harathi             | Real pandit, studio-recorded, full natural recitation          | ✅ Required                                                          |
| Sankalpam fixed phrases + all variable tokens (tithi, nakshatram, gothram…) | Same real pandit, recorded in natural flow                     | ✅ Required                                                          |
| Guided Mode instructions ("ఇప్పుడు దీపం వెలిగించండి…")                      | Same pandit (preferred) or a warm native Telugu human narrator | ✅ Required                                                          |
| Devotee name: default                                                       | **Self-recite**: the devotee says their own name aloud         | ✅ Default                                                           |
| Devotee name: optional                                                      | Clone of **this same pandit's** voice, used for names only     | ✅ Only with signed consent + passing the naturalness test (Phase 7) |
| Generic TTS voice (Google, stock ElevenLabs, etc.)                          | Any use                                                        | ❌ Never                                                             |
| AI-generated chanting or AI "enhancement" of chants                         | Any use                                                        | ❌ Never (AI cannot reproduce Vedic svara, rhythm or bhakti bhava)   |
| AI placeholder clips                                                        | Dev builds only, `voice:'dev_placeholder'`                     | ❌ Build fails if found                                              |

**What "natural" means (recording direction for the pandit)**

- Chant exactly as in a real household pooja: traditional Vedic svara (udatta, anudatta, svarita), natural breathing, natural pace. Do not slow down or "announce" the words for the app.
- Keep the natural room warmth. Light noise cleanup only; **no** auto-tune, pitch correction, heavy compression or robotic de-essing.
- Instructions are spoken the way a purohit guides a family: warm, calm, conversational Telugu ("ఇప్పుడు కొంచెం అక్షతలు తీసుకోండి…"), not a formal announcement voice.
- Sankalpam tokens are recorded **inside full natural sentences** (carrier phrases) and cut out, so the joined Sankalpam flows like one continuous recitation with no word sounding isolated.
- Before full recording, run a 30-minute **pilot session**; the client and 3–5 Telugu devotees approve the voice and style before the full session is booked.

**Naturalness acceptance (Phase 7 and Phase 10)**

- A listening panel (pandit, client, 5 Telugu devotees) hears 10 complete Sankalpams. Stitched Sankalpam passes if listeners rate it ≥ 4/5 on "sounds like a real pandit" and cannot reliably point to the join points.
- Any clip rated "robotic" or "unnatural" is re-recorded, not patched in software.

**Production spec (for the recording studio / pandit)**

- Record at 48 kHz/24-bit in a quiet, slightly warm room (not a dead booth), one primary **human** pandit voice for all chants + Sankalpam; instructions by the same pandit (preferred) or one human Telugu narrator. Follow the recording direction in §9.6.1.
- Deliver AAC-LC `.m4a`, mono, 96 kbps (chant) / 64 kbps (instruction); loudness normalized to **−16 LUFS integrated, −1 dBTP**.
- **Sankalpam tokens:** recorded in a carrier phrase at constant pitch and tempo, then edited to 30 ms head/tail with zero-crossing cuts, so any token sequence stitches naturally. ~250 tokens: 60 samvatsara, 2 ayana, 6 ruthu, 12 masa + adhika, 2 paksha, 16 tithi, 7 vasara, 27 nakshatra, 27 yoga, 11 karana, 12 rasi, 8 dik, ~60 gotra, geo-region variants, gender/spouse/family suffix variants, ~20 deity names.
- Naming: `audio/{kind}/{group}/{id}.m4a` (e.g., `audio/sankalpam_token/tithi/dvadashi.m4a`).

**Playback (`services/audio`)**

- RNTP configured with `playsInSilentMode`, background audio mode (iOS `UIBackgroundModes: audio`, Android foreground service), capabilities play/pause/next/prev, audio-focus ducking; pause on call interruption and offer to resume.
- **Step playback:** Guided mode queue = `[instructionClip, (await action), chantClip]`; Chant mode = `[chantClip]`.
- **Sankalpam playback:** the audio plan from `buildSankalpamAudioPlan` is loaded as a queue of local token clips; name slot = `self_recite` pause by default (UI shows the name in large Telugu text, the devotee says it aloud, auto-continues after ~3 s or on tap), or the cached pandit-clone name clip if the user enabled it. Measure the inter-clip gap on both platforms in P6; if > 40 ms audible, enable the v1.x server render (Cloud Run ffmpeg, output cached by `hash(plan)` in Storage).
- **Text sync:** line cues (`startMs/endMs`) per chant clip; the highlight is driven by `useProgress(100ms)`. Stitched Sankalpam cues = cumulative token durations from the manifest.
- **Cue authoring:** `tools/cue-tapper`, a local web page that plays the clip and records tap timestamps per line, then exports JSON merged into the puja file.
- Rate control 0.75–1.25 (pitch-preserving where supported).

### 9.7 Puja runner state machine (`machines/pujaRunner.machine.ts`)

```
idle ─START→ preparing (ensure pack downloaded, build sankalpam plan, keepAwake on)
preparing ─READY→ step.entry
step.entry ─[guided && instruction]→ step.instruction ─END→ step.awaitingAction? ─CONFIRM|TIMEOUT→ step.chanting
step.entry ─[chant mode || no instruction]→ step.chanting
step.chanting ─END→ step.done ─[autoAdvance]→ next step.entry | ─NEXT→ next step.entry
any ─PAUSE→ paused ─RESUME→ (history)
any ─PREV/NEXT→ step.entry(of target)
last step.done → completed (log session, keepAwake off, show "Pooja sampoornam" screen)
any ─EXIT→ persisted (resume point saved)
```

Context: `{ pujaId, variant, mode, stepIndex, lineIndex, namavaliCount, startedAt }`. Unit-test every transition with the XState test model.

---

## 10. Phase plan & orchestration

### 10.1 Dependency graph

```
P0 Foundations
 ├─► P1 Design system + static screens ─────────────┐
 ├─► P2 Panchangam engine (pure TS) ──┐             │
 │                                    ├─► P3 Profile/onboarding/Today (live data)
 ├─► P4 Content schema + catalog + prep ────────────┤
 │                                    └─► P5 Sankalpam text engine
 │                                                  │
 └──────────────────────────────► P6 Audio engine + Puja runner (needs P1,P4,P5)
                                                    │
                                   P7 Sankalpam audio + name voice
                                                    │
                                   P8 Backend, sync, content pipeline
                                                    │
                                   P9 Notifications, calendar, i18n, a11y, polish
                                                    │
                                   P10 QA, pandit sign-off, store release
```

Parallel lanes after P0: **Lane A** P1 → P3 (UI); **Lane B** P2 → P5 (domain); **Lane C** P4 (content). Merge at P6.

**Non-code track (starts at P0, owner: you + client):** identify the pandit (voice + reviewer); run the 30-min pilot recording and get voice approval; book the full studio session (≈2–4 days); produce audio per §9.6.1; obtain written consent for voice use, plus separate consent if the pandit voice clone is used for names (names only).

---

### Phase 0 — Foundations (≈2 days)

**Tasks**

- pnpm + Turborepo monorepo per §6; `packages/config` with strict tsconfig, ESLint flat config, Prettier.
- `apps/mobile`: Expo (latest SDK), Expo Router, TypeScript strict, NativeWind v4, Reanimated, Skia, MMKV, Zustand, TanStack Query, i18next, Sentry, PostHog (env-gated).
- EAS: `development`, `preview`, `production` profiles; dev client builds for iOS & Android.
- **Spike:** RNTP on the New Architecture (play local m4a, background, lock screen). Record the decision in `docs/adr/0001-audio-library.md`.
- `app.config.ts`: bundle ids, `UIBackgroundModes: ['audio']`, permissions strings (location, notifications), scheme `epooja`.
- GitHub Actions `ci.yml`: install → `pnpm verify` (lint, typecheck, test) on every PR.
- `AGENTS.md` (condensed rules from §0 and §15). Copy the mockup to `docs/reference/ui-reference.png`.

**Gate:** dev build runs on both platforms showing a themed "Hello"; audio spike plays in background with lock-screen controls; CI green.

---

### Phase 1 — Design system & static screens (≈4 days)

**Tasks**

- `packages/ui/tokens.ts` (§7.2), NativeWind theme wired to the tokens, fonts loaded (§7.3), svara rendering spike.
- Build all §7.4 components with mock data; a Storybook-lite route `/_dev/components` (dev only).
- Static screens matching the mockup: My Profile, Today, Pooja Preparation, Chant Player, plus Tabs, Poojas list, Pooja detail, Recipe.
- Light theme only; layout tested at 360×640, 390×844, 430×932; Dynamic Type up to 130%.

**Acceptance:** side-by-side screenshots vs `ui-reference.png` for the 4 reference screens: same structure, palette, hierarchy (text content differs by design); no hardcoded colors outside tokens (lint rule); 60 fps dial/disc animations on a mid-range Android.

**Gate:** screenshots committed to `docs/screens/p1/`.

---

### Phase 2 — Panchangam engine (≈5 days, parallel with P1)

**Tasks**

- `packages/panchangam`: `getPanchangam({instant, lat, lng, tz})`, `getDayPanchangam(date, loc)`, `findTransitions(anga, from, to)`, `getMonth(year, month, loc)`, per §9.1.
- `content/enums/*` seed files (§9.2) with the zod schema.
- `tools/panchangam-fixtures`: fixture format + ≥60 verified cases (§9.1).
- Benchmarks in Vitest (`bench`).

**Acceptance:** all fixtures pass within tolerance; adhika masam detected correctly in the fixture year; vasaram-before-sunrise case correct; NRI DST cases correct; `getDayPanchangam` < 20 ms (Node bench as a proxy, re-checked on device in P3). 100% branch coverage on anga calculators.

**Gate:** `pnpm --filter panchangam test` green; `docs/adr/0002-panchangam.md` written (ayanamsa model, sunrise convention, time basis).

---

### Phase 3 — Onboarding, profile, location, live Today screen (≈4 days)

**Tasks**

- Onboarding flow §8.1; `stores/devotee.ts` persisted to MMKV; gothra/nakshatra/rasi pickers from enums with search in both scripts; rasi auto-suggest from nakshatra+padam.
- `services/location`: GPS → reverse lookup against `content/cities.json` (nearest city) + `tz-lookup`; manual city search; handles permission denial.
- Today screen wired to the Panchangam: dial, 4 badges, sun times, prayer timings, full-Panchangam bottom sheet, day swipe.
- Profile screen editable; family CRUD.

**Acceptance:** fresh install → onboarding → Today shows correct values for Hyderabad on 3 fixture dates (use a debug date override); airplane mode works; kill/relaunch preserves the profile; Maestro flow `onboarding.yaml` passes.

---

### Phase 4 — Content schema, catalog, preparation, recipes (≈4 days, parallel)

**Tasks**

- `packages/content`: types (§9.4) + zod schemas + loader; `tools/content-build`: validate → transliterate (Telugu → Devanagari/IAST via sanscript) → emit `dist/packs/{id}@{version}/pack.json` + audio manifest; fail on schema errors, report `TODO_PANDIT` count.
- Author `nitya-puja.json` (§9.5), `_shodashopachara.json`, ganapathi/lakshmi/shiva skeletons, `samagri/items.json` (with icon assets), `naivedyam/recipes.json` (Panchamrutham, Pulihora, Chalividi, Vadapappu, Payasam; content marked for review).
- Bundle a **seed pack** inside the app binary (Nitya Puja) so the first puja works offline without a download.
- Poojas catalog, Pooja detail, Preparation (checklist persisted per `pujaId+date`), Recipe screen with servings scaling.

**Acceptance:** `pnpm content:build` passes with 0 schema errors; `REVIEW_QUEUE.md` auto-generated; checklist state survives restart and resets next day; recipe scaling correct (unit test).

---

### Phase 5 — Sankalpam text engine (≈3 days)

**Tasks**

- `packages/sankalpam`: template loader, slot resolvers (Panchangam, GEO, devotee, family, deity), gender/spouse/family suffix tables, `buildSankalpamText`, `buildSankalpamAudioPlan` (stub durations until P7).
- GEO resolver: Srisailam bearing → dik; river region polygons (start: Telangana + AP coarse polygons); non-India region list; manual override.
- Snapshot tests (§9.3) in all 3 scripts.
- "Preview Sankalpam" screen in Profile (text only), showing today's Sankalpam.

**Acceptance:** 20 snapshot fixtures pass; any missing slot yields a visible `⟨MISSING:slot⟩` marker (never silently omitted); female-performer and family variants render per the suffix tables.

---

### Phase 6 — Audio engine & Puja Runner (≈6 days)

**Tasks**

- `services/audio` over RNTP (§9.6): setup, queue building, progress hook, interruption handling, rate control.
- `pujaRunner.machine.ts` (§9.7) + model-based tests.
- Chant Player screen wired: disc animation from play state, step progress, line highlight from cues, transport, Chant/Guided toggle, action-prompt overlay, namavali tap mode with haptics and counter, settings sheet, samagri checklist sheet.
- `services/content` downloads: pack manifest → download clips with checksum verification → `downloads` store; "Download for offline" and storage management in Settings.
- Session persistence (resume mid-puja) and a completion screen; `user_puja_sessions` logged locally.
- `expo-keep-awake` during the runner.
- `tools/cue-tapper` built; cue files for the placeholder/demo audio.

**Acceptance:** complete Nitya Puja end-to-end in both modes with placeholder audio (AI demo clips allowed only in dev builds, flagged `voice:'dev_placeholder'`; the production build step fails if any remain); lock-screen controls work; incoming call → pause → resume at the same step; airplane mode for the entire run; highlight drift < 150 ms against cues; Maestro `run-nitya.yaml` passes.

---

### Phase 7 — Sankalpam audio stitching & natural name voice (≈4 days)

**Tasks**

- Import the real token manifest (durations, LUFS, sha) → `buildSankalpamAudioPlan` with real durations and text cue offsets.
- Implement **self-recite** as the default name slot (§9.6.1): large on-screen name, a natural pause, auto-continue or tap.
- Optional (only if the pandit signs voice-clone consent): Edge Function `name-voice`: input `{ text }` → synthesize with the **pandit's own voice clone** (never a stock voice) → match loudness/EQ to the recorded tokens (−16 LUFS, same room tone) → store `names/{hash}.m4a` → return signed URL; rate-limited; called on profile save, cached on device.
- **Naturalness listening test** (pandit + client + 5 Telugu devotees): play 10 full Sankalpams with a cloned name vs self-recite. Ship the clone option only if listeners cannot reliably tell where the name was inserted (≥ 70% cannot identify it). Record the result in `docs/adr/0003-name-voice.md`.
- Measure inter-clip gaps on iOS & Android; if audible, implement the Cloud Run ffmpeg render (`POST /render {plan}` → cached single file) behind a feature flag.

**Acceptance:** the Sankalpam plays as a continuous recitation for 10 fixture profiles; text highlight tracks segments; the self-recite path works offline; clone failure or rejection falls back to self-recite automatically; no generic TTS voice exists anywhere in the production audio path.

---

### Phase 8 — Backend, auth, sync, content pipeline (≈4 days)

**Tasks**

- Supabase migrations:
  ```sql
  create table profiles (id uuid primary key references auth.users on delete cascade,
    devotee jsonb not null, updated_at timestamptz default now());
  create table content_packs (id text, version text, channel text default 'production',
    manifest_url text not null, size_bytes bigint, sha256 text, published_at timestamptz default now(),
    primary key (id, version));
  create table puja_sessions (id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade, puja_id text, variant text, mode text,
    started_at timestamptz, completed_at timestamptz, completed_steps int);
  create table favorites (user_id uuid references auth.users on delete cascade, puja_id text,
    primary key (user_id, puja_id));
  -- RLS: owner-only on profiles/puja_sessions/favorites; content_packs public read
  ```
- Auth: guest by default; optional Google + **Sign in with Apple (mandatory on iOS if Google is offered)**; phone OTP only if the client wants it (Indian SMS requires DLT registration via the SMS provider; plan lead time).
- Sync: last-write-wins on `devotee` with `updated_at`; guest → account merge on first sign-in.
- `pack-manifest` Edge Function returns the latest packs per channel; the app diff-downloads.
- `tools/content-build --upload --channel preview|production` → Storage + `content_packs` row.
- `delete-account` function (deletes auth user + rows + name-clone files). Privacy policy + in-app consent screen (DPDP Act 2023: purpose, consent, deletion).

**Acceptance:** sign-in on device A, edit profile, sign-in on device B shows it; content published to the `preview` channel appears only on preview builds; account deletion removes all user rows (integration test); RLS tests pass.

---

### Phase 9 — Notifications, calendar, localization, accessibility, polish (≈4 days)

**Tasks**

- Local reminders for prayer timings (next 7 days), rescheduled on app open and daily via `expo-background-task`; per-timing toggles; tz/location change → reschedule.
- Month Calendar screen (§8.8); ekadashi/purnima/amavasya markers from the engine; festival markers from `content/festivals/{samvatsara}.json` (pandit-authored table, not algorithmic, for v1).
- Full Telugu UI strings; script switcher applied everywhere; number/date formatting per locale.
- Accessibility: labels on all controls, 44 pt targets, contrast AA on cream/gold (fix gold-on-cream text by using gold-700 for text), screen-reader flow through the runner.
- Empty/error/loading states; haptics pass; app icon + splash (maroon/gold diya); dark mode (optional if time allows).

**Acceptance:** reminders fire at the correct local time after a location change; the whole app is usable in Telugu; an a11y audit checklist is completed in `docs/a11y.md`.

---

### Phase 10 — QA, content sign-off, release (≈5 days + review time)

**Tasks**

- **Voice gate:** every production clip has `humanRecorded: true`; zero `dev_placeholder` clips; naturalness panel passed (§9.6.1).
- **Pandit gate:** every content file `review.status = APPROVED`; `REVIEW_QUEUE.md` empty; build fails if any `TODO_PANDIT` or `PENDING` remains in the production channel.
- Panchangam field test: 14 consecutive days compared against a reference Telugu panchangam for 3 cities.
- Device matrix: iPhone SE-class, iPhone Pro-class, low-end Android (3 GB RAM, Android 10), mid Android, tablet sanity.
- Performance: cold start < 2.5 s on mid Android; runner memory stable over a 45-minute puja; no audio dropouts.
- Store assets: screenshots in the reference style, Telugu + English listings, privacy nutrition labels / Data Safety form.
- EAS Submit to TestFlight + Play internal testing → closed beta (20–50 families) → production.

**Gate / Definition of Done (v1.0):** §16 checklist fully met.

---

## 11. Testing strategy

| Layer      | Tool                     | Must cover                                                                       |
| ---------- | ------------------------ | -------------------------------------------------------------------------------- |
| Panchangam | Vitest + golden fixtures | Every anga, transitions, adhika masa, sunrise-straddle, DST, southern hemisphere |
| Sankalpam  | Vitest snapshots         | Gender, spouse, family, NRI geo, missing slots                                   |
| Content    | zod in `content:build`   | Schema, referential integrity (audioIds exist, samagri ids exist), cue ordering  |
| Runner     | XState model tests       | All transitions incl. interruptions and exit/resume                              |
| UI         | jest-expo + RNTL         | Checklist, pickers, player controls                                              |
| E2E        | Maestro                  | onboarding, run-nitya (both modes), offline run, profile edit, reminders toggle  |
| Audio      | Manual scripted checks   | Gaps, loudness consistency, lock screen, interruptions                           |

`pnpm verify` = `turbo run lint typecheck test`.

---

## 12. Analytics & monitoring (PostHog, privacy-safe)

Events: `onboarding_completed`, `puja_started {pujaId, variant, mode}`, `puja_step_completed`, `puja_completed {durationSec}`, `puja_abandoned {stepId}`, `pack_downloaded`, `reminder_toggled`. **Never** send name, gothram, nakshatram or location coordinates. Sentry with PII scrubbing.

---

## 13. Security & privacy

- Devotee data stays local unless the user signs in. Supabase RLS on all user tables. No service keys in the app.
- Location stored rounded to 0.01° when synced.
- Name-clone files are keyed by a hash, with no name in the path. Signed URLs only.
- The pandit's voice clone is used only for devotee names inside the Sankalpam, never to generate new mantras or any other speech (consent contract term).
- DPDP consent screen, privacy policy URL, in-app account deletion (required by both stores).

---

## 14. Open questions for the client (resolve before P4/P7)

1. Launch puja list beyond Nitya + Ganapathi/Lakshmi/Shiva? Which festivals first?
2. Who is the pandit (voice + reviewer)? Does the client approve their voice after the pilot session? Is the pandit willing to allow a voice clone used only for devotee names (otherwise self-recite only)?
3. Monetization: free, one-time, subscription, or paid festival packs? (affects P8 schema + store setup)
4. Is a Devanagari/Hindi audience in scope, or Telugu-only content?
5. Should NRI Sankalpam geography follow a specific temple's convention?
6. Is sign-in wanted at all for v1, or guest-only?

---

## 15. Agent rules (copy into `AGENTS.md`)

- TypeScript strict; no `any`; zod at every IO boundary.
- Pure packages must not import React Native or Expo.
- No colors, fonts or spacing literals in components; use tokens.
- No ritual text in `.tsx` files; only content JSON.
- Every new module ships with tests; every phase ends with `pnpm verify` green.
- Write an ADR for any deviation from this plan.
- Keep dependencies minimal and pinned; check Expo SDK compatibility (`npx expo install`) before adding native libs.
- Do not use Expo Go; test on dev builds.
- Never add AI/TTS-generated speech to production audio. Any AI clip is dev-only and flagged `dev_placeholder` (§9.6.1).
- Commit per task; phase summary in `CHANGELOG.md` listing what was built, what was skipped, and new `TODO_PANDIT` items.

---

## 16. Definition of Done — v1.0

- [ ] Onboarding → Today → Prepare → Run Nitya Puja → Complete works fully offline on iOS and Android.
- [ ] Panchangam matches the reference for 14 days × 3 cities; all fixtures green.
- [ ] Sankalpam text and audio are correct for male/female/family/NRI fixtures and approved by the pandit.
- [ ] 100% of production audio is a real human pandit voice; no generic TTS or AI chanting anywhere; naturalness panel passed.
- [ ] Chant and Guided modes, action prompts, namavali mode, resume, lock-screen controls, and interruption handling all work.
- [ ] 4 reference screens visually match `ui-reference.png` in layout/palette/components.
- [ ] Telugu + English UI; Telugu/Devanagari/Roman mantra scripts.
- [ ] Reminders fire correctly across a timezone change.
- [ ] All content `APPROVED`; zero `TODO_PANDIT` in the production channel.
- [ ] Sentry clean for the beta; crash-free sessions ≥ 99.5%.
- [ ] Store listings, privacy policy, and account deletion live.
