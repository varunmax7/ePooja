import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { AudioClip } from '@epooja/content';
import { useQueuePlayback } from '@/services/audio/useQueuePlayback.web';
import type { AudioQueueTrack } from '@/services/audio/queue';

/**
 * Exercises the web implementation directly by its full filename — Jest's
 * default platform resolution targets native, not web, so
 * `@/services/audio/useQueuePlayback` in a plain import would resolve to
 * `useQueuePlayback.ts` here, never this file. `useQueuePlayback.test.tsx`
 * covers that native file; this one is `expo-audio`'s surface instead of
 * `react-native-track-player`'s.
 */

interface MockPlayer {
  play: jest.Mock;
  pause: jest.Mock;
  replace: jest.Mock;
  remove: jest.Mock;
  addListener: jest.Mock;
  playbackRate: number;
}

let lastPlayer: MockPlayer | undefined;
let statusListener:
  | ((status: {
      playing: boolean;
      currentTime: number;
      duration: number;
      didJustFinish: boolean;
    }) => void)
  | undefined;
const mockCreateAudioPlayer = jest.fn((_url: string) => {
  const player: MockPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
    playbackRate: 1,
    addListener: jest.fn((_event: string, listener: typeof statusListener) => {
      statusListener = listener;
      return { remove: jest.fn() };
    }),
  };
  lastPlayer = player;
  return player;
});

jest.mock('expo-audio', () => ({
  createAudioPlayer: (url: string) => mockCreateAudioPlayer(url),
}));

function fireStatus(status: {
  playing?: boolean;
  currentTime?: number;
  duration?: number;
  didJustFinish?: boolean;
}) {
  statusListener?.({
    playing: false,
    currentTime: 0,
    duration: 0,
    didJustFinish: false,
    ...status,
  });
}

const CHANT_TRACK: AudioQueueTrack = { id: 'chant', kind: 'chant', clipId: 'chant.deeparadhana' };

const MANIFEST: AudioClip[] = [
  {
    id: 'chant.deeparadhana',
    path: 'https://example.com/deeparadhana.m4a',
    durationMs: 4000,
    lufs: -16,
    sha256: 'a'.repeat(64),
    kind: 'chant',
    voice: 'pandit_primary',
    humanRecorded: true,
  },
];

describe('useQueuePlayback (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastPlayer = undefined;
    statusListener = undefined;
  });

  afterEach(async () => {
    await cleanup();
  });

  it('calls onEnded without creating a player when no clip in the queue resolves', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([CHANT_TRACK], onEnded));

    await waitFor(() => {
      expect(onEnded).toHaveBeenCalledTimes(1);
    });
    expect(mockCreateAudioPlayer).not.toHaveBeenCalled();
  });

  it('creates a player for the resolved url and plays it', async () => {
    await renderHook(() => useQueuePlayback([CHANT_TRACK], jest.fn(), MANIFEST));

    expect(mockCreateAudioPlayer).toHaveBeenCalledWith('https://example.com/deeparadhana.m4a');
    expect(lastPlayer?.play).toHaveBeenCalledTimes(1);
  });

  it('reflects live status updates (playing/position/duration)', async () => {
    const { result } = await renderHook(() => useQueuePlayback([CHANT_TRACK], jest.fn(), MANIFEST));

    await act(() => {
      fireStatus({ playing: true, currentTime: 1.5, duration: 4 });
    });

    expect(result.current.playing).toBe(true);
    expect(result.current.position).toBe(1.5);
    expect(result.current.duration).toBe(4);
  });

  it('calls onEnded once the only track in the queue finishes', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useQueuePlayback([CHANT_TRACK], onEnded, MANIFEST));

    await act(() => {
      fireStatus({ didJustFinish: true });
    });

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(lastPlayer?.replace).not.toHaveBeenCalled();
  });

  it('advances to the next track rather than ending, when more than one resolves', async () => {
    const onEnded = jest.fn();
    const tracks: AudioQueueTrack[] = [
      { id: 'instruction', kind: 'instruction', clipId: 'instr' },
      CHANT_TRACK,
    ];
    const manifest: AudioClip[] = [
      { ...MANIFEST[0]!, id: 'instr', path: 'https://example.com/instr.m4a' },
      MANIFEST[0]!,
    ];

    await renderHook(() => useQueuePlayback(tracks, onEnded, manifest));
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith('https://example.com/instr.m4a');

    await act(() => {
      fireStatus({ didJustFinish: true });
    });

    expect(onEnded).not.toHaveBeenCalled();
    expect(lastPlayer?.replace).toHaveBeenCalledWith('https://example.com/deeparadhana.m4a');
    expect(lastPlayer?.play).toHaveBeenCalledTimes(2);
  });

  it('exposes play/pause/setRate wired to the player', async () => {
    const { result } = await renderHook(() => useQueuePlayback([CHANT_TRACK], jest.fn(), MANIFEST));

    result.current.play();
    result.current.pause();
    result.current.setRate(1.25);

    expect(lastPlayer?.play).toHaveBeenCalledTimes(2);
    expect(lastPlayer?.pause).toHaveBeenCalledTimes(1);
    expect(lastPlayer?.playbackRate).toBe(1.25);
  });
});
