import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
} from 'react-native-track-player';

let setupPromise: Promise<void> | null = null;

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
  })();

  return setupPromise;
}

/** Test seam: forget the memoised setup (used by unit tests only). */
export function resetTrackPlayerSetupForTests(): void {
  setupPromise = null;
}
