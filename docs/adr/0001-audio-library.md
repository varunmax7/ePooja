# ADR 0001 — Audio library for the puja runner

- **Status:** Proposed — wired up and bundling, but **not yet verified on a device**
- **Date:** 2026-09-19
- **Phase:** 0
- **Deciders:** engineering (spike), to be confirmed on a device by the first
  person to run a dev build

## Context

The puja runner (§9.7) is the heart of the app. Its audio requirements are
unusually strict for a mobile app:

- **Background playback with lock-screen controls.** A devotee puts the phone
  down, does the physical offering with both hands, and the chant must keep
  playing with the screen locked, controllable from the lock screen.
- **A queue, not a single file.** The Sankalpam is stitched at runtime from
  ~250 pre-recorded pandit clips (§9.6, §3.5); gapless-ish queue playback is a
  core requirement, not a nicety.
- **Rate control** for devotees who want a slower chant.
- **Audio-focus / interruption handling.** A phone call mid-mantra must pause
  and resume cleanly, never drop the devotee into silence.
- **New Architecture (Fabric/TurboModules).** Expo SDK 57 / RN 0.86 runs the New
  Architecture with no opt-out.

## Options

1. **`react-native-track-player` v4** — purpose-built for this: queue, background
   service, lock-screen/notification controls, rate, interruption handling.
   Risk: it is a large native module and New Architecture support has
   historically lagged.
2. **`expo-audio`** — first-party, tracks the SDK, simple API. It does not give
   a managed queue or lock-screen transport controls, so the runner would have
   to implement its own queue and an OS-level media session.
3. **`expo-av`** — deprecated in favour of `expo-audio`. Not considered.

## Decision

Use **`react-native-track-player` v4** as the primary audio engine, with
`expo-audio` kept as the documented fallback (§4).

The app code does not import RNTP directly outside
`src/services/audio/*`; the rest of the app talks to that service. If the
verification below fails on a device, swapping the implementation behind that
boundary is a contained change and this ADR is superseded by ADR 0002.

## Known risk: New Architecture support

`expo-doctor` and the React Native Directory flag
`react-native-track-player@4.1.2` as **unsupported on the New Architecture**,
and the package ships no `codegenConfig` — it is a legacy native module that
runs through RN's bridgeless interop layer on RN 0.86. Interop works for many
legacy modules, but RNTP is not a simple one: it owns a headless service, a
media session and an audio-focus policy.

The v5 line (which targets the New Architecture directly) exists only as
`5.0.0-alpha0-nightly-*` and is not fit for a production dependency yet.

This is precisely the risk §4 anticipated ("`expo-audio` as fallback if RNTP
blocks on the New Architecture in P0 spike"). **The spike below is what decides
it, and it can only run on a device.** Until it does, treat this ADR as
provisional.

The doctor check is silenced for this one package via
`expo.doctor.reactNativeDirectoryCheck.exclude` in `apps/mobile/package.json`,
so the warning does not mask other dependency problems — it is tracked here
instead.

## Spike

`apps/mobile/app/_dev/audio-spike.tsx` is a dev-only screen that exercises the
decision end to end:

1. `setupTrackPlayer()` initialises the player on the New Architecture.
2. A local `m4a` is loaded from the app bundle and queued.
3. Playback starts; the screen shows live state and position.
4. Backgrounding and locking the device must keep audio playing, with working
   lock-screen / notification controls.

The clip (`assets/audio-spike/spike-tone.m4a`) is a generated tone, explicitly
**not** a voice — §9.6.1 forbids synthetic speech anywhere near this product,
including in spikes.

Unit coverage for the service boundary lives in
`src/services/audio/__tests__/playbackService.test.ts` (setup idempotency,
interruption handling, remote-control registration).

### Verification status

| Check                                      | iOS                   | Android               |
| ------------------------------------------ | --------------------- | --------------------- |
| Player sets up on the New Architecture     | ⬜ pending device run | ⬜ pending device run |
| Local m4a plays                            | ⬜                    | ⬜                    |
| Audio continues when backgrounded / locked | ⬜                    | ⬜                    |
| Lock-screen / notification controls work   | ⬜                    | ⬜                    |

> These boxes can only be ticked on an EAS **development build** on real
> hardware or a simulator — Expo Go cannot load RNTP, and the machine this was
> scaffolded on had no Xcode, CocoaPods, Android SDK or JDK installed. Run
> `pnpm --filter @epooja/mobile ios` (or `android`), open the shell screen,
> tap **Open audio spike**, press play, then lock the device. Update this table
> and the CHANGELOG with the result.

### If the spike fails

Switch `src/services/audio/*` to `expo-audio` and supersede this ADR with
ADR 0002. The runner then owns its own queue: `expo-audio` gives playback and
rate control but no managed queue and no lock-screen transport, so Phase 6 also
needs a media-session solution (`expo-audio` + a small native media session, or
the v1.x server-rendered single-file Sankalpam brought forward). Budget ~2 extra
days in Phase 6 for that path.

## Consequences

- Expo Go is unsupported from Phase 0 onward; all testing uses dev builds.
- `UIBackgroundModes: ['audio']` (iOS) and `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
  (Android) are set in `app.config.ts` — both are required by RNTP and by the
  product requirement itself.
- RNTP has no JS implementation outside a native build, so Jest uses the mock in
  `src/services/audio/__mocks__/trackPlayer.js`.
- If the queue produces audible gaps between Sankalpam clips (§9.6), the
  fallback is the server-rendered single-file Sankalpam (Cloud Run + ffmpeg,
  v1.x) rather than a different client library.
