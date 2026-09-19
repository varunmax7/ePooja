import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import { setupTrackPlayer } from '@/services/audio';

/**
 * Phase 0 audio spike (§10 Phase 0). Verifies, on a real dev build:
 *   1. react-native-track-player initialises on the New Architecture
 *   2. a local m4a plays from the bundle
 *   3. playback continues in the background
 *   4. lock-screen / notification controls drive it
 *
 * The clip is a dev-only generated tone — never a voice. Production audio is a
 * real pandit recording and nothing else (§9.6.1).
 */
const SPIKE_CLIP = require('../../assets/audio-spike/spike-tone.m4a');

type Step = { label: string; done: boolean };

export default function AudioSpikeScreen() {
  const playback = usePlaybackState();
  const progress = useProgress(250);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Player set up on the New Architecture', done: false },
    { label: 'Local m4a queued from the app bundle', done: false },
    { label: 'Playback started', done: false },
  ]);

  const mark = useCallback((index: number) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, done: true } : s)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await setupTrackPlayer();
        if (cancelled) return;
        mark(0);

        const asset = Asset.fromModule(SPIKE_CLIP);
        await asset.downloadAsync();
        if (cancelled) return;

        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: 'spike-tone',
          url: asset.localUri ?? asset.uri,
          title: 'Audio spike tone',
          artist: 'ePooja · dev placeholder',
          duration: 20,
        });
        if (cancelled) return;
        mark(1);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      void TrackPlayer.reset();
      deactivateKeepAwake();
    };
  }, [mark]);

  const isPlaying = playback.state === State.Playing;

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
      deactivateKeepAwake();
      return;
    }
    await activateKeepAwakeAsync();
    await TrackPlayer.play();
    mark(2);
  }, [isPlaying, mark]);

  return (
    <ScrollView className="flex-1 bg-cream-50" contentContainerClassName="p-5 gap-4">
      <Text className="text-lg font-semibold text-ink-900">react-native-track-player spike</Text>
      <Text className="text-sm text-ink-500">
        Play, then lock the phone. Playback must continue and the lock screen must show working
        controls. Record the result in docs/adr/0001-audio-library.md.
      </Text>

      {error ? (
        <View className="rounded-md border border-danger bg-cream-200 p-4">
          <Text className="text-sm font-semibold text-danger">Spike failed</Text>
          <Text className="mt-1 text-sm text-ink-700">{error}</Text>
        </View>
      ) : null}

      <View className="rounded-md border border-gold-300 bg-cream-200 p-4">
        {steps.map((step) => (
          <Text key={step.label} className="py-1 text-sm text-ink-900">
            {step.done ? '✓' : '○'} {step.label}
          </Text>
        ))}
      </View>

      <View className="rounded-md border border-gold-300 bg-cream-200 p-4">
        <Text className="text-xs uppercase tracking-wide text-ink-500">State</Text>
        <Text className="mt-1 text-base text-ink-900">{String(playback.state ?? 'none')}</Text>
        <Text className="mt-2 text-xs uppercase tracking-wide text-ink-500">Position</Text>
        <Text className="mt-1 text-base text-ink-900">
          {progress.position.toFixed(1)}s / {progress.duration.toFixed(1)}s
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!ready}
        onPress={toggle}
        className={`rounded-pill px-5 py-4 ${ready ? 'bg-maroon-800' : 'bg-ink-400'}`}
      >
        <Text className="text-center text-base font-semibold text-cream-100">
          {isPlaying ? 'Pause' : 'Play'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
