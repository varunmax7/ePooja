import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { useDevSpeechPlayback } from '@/services/audio/useDevSpeechPlayback';
import {
  DEFAULT_SPEECH_RATE,
  INTER_LINE_PAUSE_MS,
  NOT_YET_RECORDED_NOTICE,
} from '@/services/audio/devSpeech';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([]),
}));

function lastSpeakOptions() {
  const call = (Speech.speak as jest.Mock).mock.calls.at(-1);
  return call?.[1] as {
    onDone?: () => void;
    onError?: (error: Error) => void;
  };
}

/** Flushes the microtask-based voice lookup, then the real inter-line pause timer. */
async function advanceToNextLine() {
  await act(async () => {
    jest.advanceTimersByTime(INTER_LINE_PAUSE_MS);
    await Promise.resolve();
  });
}

describe('useDevSpeechPlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
  });

  it('calls onEnded without speaking anything when there is no text', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useDevSpeechPlayback([], onEnded));

    await waitFor(() => {
      expect(onEnded).toHaveBeenCalledTimes(1);
    });
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('speaks a "not yet recorded" notice, instead of staying silent, when every line is an unapproved placeholder', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useDevSpeechPlayback(['⟨TODO_PANDIT: x⟩', ''], onEnded));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledWith(
        NOT_YET_RECORDED_NOTICE,
        expect.objectContaining({ language: 'en-US' }),
      );
    });
    expect(onEnded).not.toHaveBeenCalled();

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    await waitFor(() => {
      expect(onEnded).toHaveBeenCalledTimes(1);
    });
  });

  it('speaks a Telugu line with a Telugu language tag, at the natural default rate', async () => {
    await renderHook(() => useDevSpeechPlayback(['కుడి చేతిలో అక్షతలు'], jest.fn()));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledTimes(1);
    });
    expect(Speech.speak).toHaveBeenCalledWith(
      'కుడి చేతిలో అక్షతలు',
      expect.objectContaining({ language: 'te-IN', rate: DEFAULT_SPEECH_RATE }),
    );
  });

  it('picks the best available voice for the line\'s language', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValueOnce([
      { identifier: 'te-default', language: 'te-IN', quality: 'Default' },
      { identifier: 'te-enhanced', language: 'te-IN', quality: 'Enhanced' },
    ]);

    await renderHook(() => useDevSpeechPlayback(['కుడి చేతిలో అక్షతలు'], jest.fn()));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledWith(
        'కుడి చేతిలో అక్షతలు',
        expect.objectContaining({ voice: 'te-enhanced' }),
      );
    });
  });

  it('speaks each line in order, with a pause between them, calling onEnded only once the last one finishes', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useDevSpeechPlayback(['line one', 'line two'], onEnded));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledTimes(1);
    });
    expect(Speech.speak).toHaveBeenCalledWith('line one', expect.anything());

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    expect(Speech.speak).toHaveBeenCalledTimes(1); // still waiting out the pause

    await advanceToNextLine();
    expect(onEnded).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledTimes(2);
    expect(Speech.speak).toHaveBeenCalledWith('line two', expect.anything());

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    await advanceToNextLine();

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('skips a line and keeps going when expo-speech reports an error for it', async () => {
    const onEnded = jest.fn();
    await renderHook(() => useDevSpeechPlayback(['line one', 'line two'], onEnded));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));

    await act(() => {
      lastSpeakOptions()?.onError?.(new Error('synth failed'));
    });
    await advanceToNextLine();

    expect(onEnded).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith('line two', expect.anything());
  });

  it('drops a placeholder line but still speaks the rest', async () => {
    await renderHook(() => useDevSpeechPlayback(['⟨TODO_PANDIT: x⟩', 'real line'], jest.fn()));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledTimes(1);
    });
    expect(Speech.speak).toHaveBeenCalledWith('real line', expect.anything());
  });

  it('wires play/pause to expo-speech resume/pause', async () => {
    const { result } = await renderHook(() => useDevSpeechPlayback(['line one'], jest.fn()));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));

    await act(() => {
      result.current.pause();
    });
    expect(Speech.pause).toHaveBeenCalledTimes(1);

    await act(() => {
      result.current.play();
    });
    expect(Speech.resume).toHaveBeenCalledTimes(1);
  });

  it('applies a new rate starting with the next line, not the one already speaking', async () => {
    const { result } = await renderHook(() =>
      useDevSpeechPlayback(['line one', 'line two'], jest.fn()),
    );
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));
    result.current.setRate(1.25);

    await act(() => {
      lastSpeakOptions()?.onDone?.();
    });
    await advanceToNextLine();

    expect(Speech.speak).toHaveBeenLastCalledWith(
      'line two',
      expect.objectContaining({ rate: 1.25 }),
    );
  });

  it('stops expo-speech on unmount', async () => {
    const { unmount } = await renderHook(() => useDevSpeechPlayback(['line one'], jest.fn()));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));

    await act(async () => {
      unmount();
    });

    expect(Speech.stop).toHaveBeenCalledTimes(1);
  });
});
