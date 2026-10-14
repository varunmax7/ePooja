import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
} from 'react-native-track-player';

let setupPromise: Promise<void> | null = null;
let setupFailed = false;

/**
 * Whether a previous `setupTrackPlayer()` call is known to have failed —
 * observed for real on the web platform, whose RNTP shim can fail
 * `setupPlayer` outright (it loads `shaka-player` under the hood). Checked
 * by `useQueuePlayback`'s `play`/`pause`/`setRate` *before* calling into
 * `TrackPlayer` at all, so a devotee tapping a transport control repeatedly
 * never re-attempts a call already known to throw — not just catching the
 * throw after the fact, but not making it in the first place.
 */
export function isTrackPlayerUnavailable(): boolean {
  return setupFailed;
}

/**
 * Idempotent player setup (§9.6). A puja may be started, backgrounded and
 * resumed many times; `setupPlayer` must only run once per process.
 */
export function setupTrackPlayer(): Promise<void> {
  setupPromise ??= (async () => {
    await TrackPlayer.setupPlayer({
      // A phone call or another app's audio must duck/pause the chant and
      // resume it afterwards, never leave the devotee mid-mantra in silence.
      autoHandleInterruptions: true,
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.SpokenAudio,
      iosCategoryOptions: [IOSCategoryOptions.DuckOthers],
    });

    await TrackPlayer.updateOptions({
      android: {
        // Playback is part of a ritual in progress: pause but keep the notification
        // alive so the devotee can resume from the lock screen.
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    });
  })().catch((error: unknown) => {
    setupFailed = true;
    throw error;
  });

  return setupPromise;
}

/** Test seam: forget the memoised setup (used by unit tests only). */
export function resetTrackPlayerSetupForTests(): void {
  setupPromise = null;
  setupFailed = false;
}
