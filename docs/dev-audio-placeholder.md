# Dev-only placeholder audio

**What this is:** a short, non-speech chime wired into the Puja Runner's
transport controls so Play/Pause/progress/auto-advance can actually be
exercised locally — on web now too — while `§9.6` recording hasn't started.

**What this is not, and does not do:** it does not satisfy `§9.6`/`§16`'s
voice requirement, does not produce or claim to produce a pandit's voice,
and does not move any item in `content/REVIEW_QUEUE.md` closer to done. No
phase is "complete" because of this — it's a local testing aid, nothing
else. The chime is never a mantra, never speech, never shipped.

## Why it exists

Pressing Play previously did nothing audible, because `content/audio/` is
genuinely empty (nothing but a `.gitkeep` — true since Phase 4) and no
pandit has recorded anything yet. That's correct, expected behaviour for a
production build. For local development, though, it meant the entire audio
pipeline — queue resolution, playback, progress reporting, the
end-of-queue → `AUDIO_ENDED` → auto-advance chain — had never actually
been exercised end-to-end on _any_ platform, only reasoned about.

## The web story, and why it took three tries to get right

1. First attempt: just add the chime to the manifest. Didn't work —
   `react-native-track-player`'s web build dynamically imports
   `shaka-player` inside `setupPlayer()`, and `metro.config.js` has an
   explicit, pre-existing rule stubbing that import to an empty module on
   `platform === 'web'` (comment: "the product ships on iOS and Android...
   web exists only so the design system can be rendered and
   screenshotted"). `setupPlayer()` therefore always failed on web,
   regardless of the manifest.
2. Second attempt: add `shaka-player` as a real dependency, reasoning it
   was simply missing. Wrong diagnosis — Metro stubs the import outright,
   so the installed package is never even consulted on web. This was
   reverted before being committed.
3. **What actually fixes it:** RNTP was never going to work on web by this
   app's own design, so the web platform needed a _different_ audio engine
   entirely, not a different fix to RNTP. `expo-audio` was already a
   dependency (unused until now) with genuine, lightweight web support — it
   wraps the browser's own `<audio>` element directly, no `shaka-player`
   involved. `useQueuePlayback` is now two files:
   - **`useQueuePlayback.ts`** — unchanged, RNTP-backed, native only.
   - **`useQueuePlayback.web.ts`** — new, `expo-audio`-backed. Same public
     shape (`playing`/`position`/`duration`/`play`/`pause`/`setRate`), same
     content-gap behaviour (an unresolved queue calls `onEnded` on the next
     tick rather than stalling), same handling of a multi-track queue
     (plays each resolved track in order, calling `onEnded` only once the
     last one finishes).

   Metro's `.web.ts` resolution picks the right file automatically — every
   caller imports `useQueuePlayback` from the `services/audio` barrel and
   never has to know which one backs it. `useQueuePlayback.web.test.tsx`
   exercises the web file directly (by its full filename — Jest's default
   platform resolution targets native, so a plain import wouldn't reach it)
   with a mocked `expo-audio`.

`shaka-player` was never re-added, and the `metro.config.js` stub was left
exactly as it was — RNTP genuinely doesn't need to run on web now, for the
chime or anything else.

## What was built

- **`apps/mobile/src/services/audio/playback.types.ts`** — the
  `QueuePlayback` interface, pulled out so neither `useQueuePlayback.ts` nor
  `useQueuePlayback.web.ts` has to import from the other (which Metro's
  platform resolution would otherwise point back at whichever file is
  "self" on a given platform).
- **`apps/mobile/src/services/audio/useQueuePlayback.web.ts`** — described
  above.
- **`apps/mobile/src/services/audio/devPlaceholder.ts`** —
  `devPlaceholderManifestFor(tracks)`, a pure function that builds one
  `AudioClip` per distinct clip id a step's queue asks for, all pointing at
  the same chime. Every entry is tagged `voice: 'dev_placeholder'`,
  `humanRecorded: false` — the exact shape `isProductionSafe`
  (`@epooja/content`) already existed to refuse unconditionally, from
  before this chime was ever added.
- **The chime itself**: "Airplane Chime Sound Effect.ogg", **CC0 1.0
  Universal** (public domain dedication), from Wikimedia Commons, uploaded
  by Sharelk:
  <https://commons.wikimedia.org/wiki/File:Airplane_Chime_Sound_Effect.ogg>.
  ~2.9 seconds, non-speech, referenced by its permanent
  `upload.wikimedia.org` URL rather than copied into this repo — no
  licensing ambiguity (CC0 waives all rights; attribution here is a
  courtesy, not a requirement) and no asset-bundling plumbing needed.
  Confirmed CORS-permissive (`access-control-allow-origin: *`), so both the
  native `fetch`/RNTP path and the browser's own `<audio>` element can load
  it directly.
- **`app/player/[slug].tsx`** — the one call site. `DEV_PLACEHOLDER_AUDIO_ENABLED`
  (`__DEV__ && NODE_ENV !== 'test'`) gates it: on in an actual `expo start`
  session (web or native dev client alike), off in every unit/screen test
  (which rely on an unresolved queue ending a step immediately — the chime
  resolving instead would leave them waiting on an event their mocked audio
  engine never fires), off in any production build regardless of `__DEV__`'s
  own value there.

## Verifying it

```bash
pnpm --filter @epooja/mobile exec expo start --web
```

Start a puja, press Play on any step. The chime should play, the progress
bar should move, and the step should auto-advance once it ends — proving
the pipeline, not the content. This now works identically on a native dev
client (`expo run:ios` / `expo run:android`), via the unchanged RNTP path.

## What still blocks the real thing

Unchanged: `content/REVIEW_QUEUE.md`'s "Pandit voice recording" row. Zero
production clips exist; the Phase 10 production gate
(`tools/content-build/src/productionGate.ts`) still refuses a production
release regardless of anything in this file.
