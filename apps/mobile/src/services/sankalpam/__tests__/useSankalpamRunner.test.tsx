import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import type { AudioPlanItem, SankalpamText } from '@epooja/sankalpam';
import { useSankalpamRunner } from '@/services/sankalpam/useSankalpamRunner';
import { INTER_LINE_PAUSE_MS } from '@/services/audio/devSpeech';

/**
 * Exercises the dev-only TTS path a `clips` run now takes
 * (`DEV_PLACEHOLDER_AUDIO_ENABLED`'s own note explains why it's dev-only):
 * before §9.6 recording exists, this is what actually speaks the Sankalpam
 * instead of the runner silently skipping straight to the next run.
 */

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/audio', () => ({
  ...jest.requireActual('@/services/audio'),
  DEV_PLACEHOLDER_AUDIO_ENABLED: true,
}));

function lastSpeakOptions() {
  const call = (Speech.speak as jest.Mock).mock.calls.at(-1);
  return call?.[1] as { onDone?: () => void } | undefined;
}

/** Flushes the microtask-based voice lookup, then the real inter-line pause timer. */
async function advanceToNextLine() {
  await act(async () => {
    jest.advanceTimersByTime(INTER_LINE_PAUSE_MS);
    await Promise.resolve();
  });
}

const CLIP_PLAN: AudioPlanItem[] = [
  { kind: 'clip', segmentId: 'seg1', clipId: 'c1', startMs: 0, endMs: 1000, durationMs: 1000 },
  { kind: 'clip', segmentId: 'seg2', clipId: 'c2', startMs: 1000, endMs: 2000, durationMs: 1000 },
];

const SANKALPAM_TEXT: SankalpamText = {
  te: 'line one text line two text',
  dev: '',
  iast: '',
  segments: [
    { id: 'seg1', resolution: { status: 'resolved', text: { te: 'line one text' } } },
    { id: 'seg2', resolution: { status: 'resolved', text: { te: 'line two text' } } },
  ],
};

describe('useSankalpamRunner (dev speech for a `clips` run)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
  });

  it('speaks each resolved segment of a `clips` run in order', async () => {
    await renderHook(() => useSankalpamRunner(CLIP_PLAN, [], true, jest.fn(), SANKALPAM_TEXT));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledWith('line one text', expect.anything());
    });
  });

  it('advances to the next segment, then completes once the run finishes', async () => {
    const onComplete = jest.fn();
    await renderHook(() => useSankalpamRunner(CLIP_PLAN, [], true, onComplete, SANKALPAM_TEXT));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    await advanceToNextLine();
    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledWith('line two text', expect.anything());
    });
    expect(onComplete).not.toHaveBeenCalled();

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    await advanceToNextLine();
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('completes without speaking anything when no sankalpamText is given', async () => {
    const onComplete = jest.fn();
    await renderHook(() => useSankalpamRunner(CLIP_PLAN, [], true, onComplete, undefined));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('never routes a `self_recite` run through speech', async () => {
    const plan: AudioPlanItem[] = [
      { kind: 'self_recite', segmentId: 'name', slot: 'NAME', startMs: 0, endMs: 3000, durationMs: 3000 },
    ];
    const { result } = await renderHook(() =>
      useSankalpamRunner(plan, [], true, jest.fn(), SANKALPAM_TEXT),
    );

    expect(result.current.awaitingSelfRecite).toBe(true);
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});
