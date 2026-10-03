import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import TrackPlayer, { Event } from 'react-native-track-player';
import type { AudioClip } from '@epooja/content';
import { useQueuePlayback } from '@/services/audio/useQueuePlayback';
import { resetTrackPlayerSetupForTests } from '@/services/audio/trackPlayer';
import type { AudioQueueTrack } from '@/services/audio/queue';

const CHANT_TRACK: AudioQueueTrack = { id: 'chant', kind: 'chant', clipId: 'chant.deeparadhana' };

const MANIFEST: AudioClip[] = [
  {
    id: 'chant.deeparadhana',
    path: 'audio/chant/nitya/deeparadhana.m4a',
    durationMs: 4000,
    lufs: -16,
    sha256: 'a'.repeat(64),
    kind: 'chant',
    voice: 'pandit_primary',
    humanRecorded: true,
  },
];

describe('useQueuePlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTrackPlayerSetupForTests();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('calls onEnded without loading anything when no clip in the queue resolves', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([CHANT_TRACK], onEnded));

    await waitFor(() => {
      expect(onEnded).toHaveBeenCalledTimes(1);
    });
    expect(TrackPlayer.add).not.toHaveBeenCalled();
  });

  it('treats a step with no tracks at all the same way — nothing to wait on', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([], onEnded));

    await waitFor(() => {
      expect(onEnded).toHaveBeenCalledTimes(1);
    });
  });

  it('loads and plays a track once its clip resolves against the manifest', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([CHANT_TRACK], onEnded, MANIFEST));

    await waitFor(() => {
      expect(TrackPlayer.add).toHaveBeenCalledWith([
        { id: 'chant', url: 'audio/chant/nitya/deeparadhana.m4a', title: 'chant' },
      ]);
    });
    expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it('calls onEnded when RNTP reports the queue ended', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([CHANT_TRACK], onEnded, MANIFEST));

    await waitFor(() => {
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    const handler = (TrackPlayer.addEventListener as jest.Mock).mock.calls.find(
      ([event]) => event === Event.PlaybackQueueEnded,
    )?.[1];
    expect(handler).toBeDefined();

    await act(() => {
      handler();
    });
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('exposes play/pause/setRate wired straight to TrackPlayer', async () => {
    const { result } = await renderHook(() => useQueuePlayback([CHANT_TRACK], jest.fn(), MANIFEST));
    await waitFor(() => {
      expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
    });

    result.current.play();
    result.current.pause();
    result.current.setRate(1.25);

    expect(TrackPlayer.play).toHaveBeenCalledTimes(2);
    expect(TrackPlayer.pause).toHaveBeenCalledTimes(1);
    expect(TrackPlayer.setRate).toHaveBeenCalledWith(1.25);
  });
});
