import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Headless playback service — registered once at app entry. It handles the
 * lock-screen / notification / headset controls, which is exactly what the
 * Phase 0 audio spike has to prove (§10 Phase 0 Gate).
 *
 * Phase 6 extends this to drive the puja runner state machine (step advance,
 * interruption recovery) rather than only transport controls.
 */
export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + interval);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - interval));
  });
}
