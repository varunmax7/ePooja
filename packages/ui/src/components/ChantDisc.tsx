import { Canvas, Circle, Group, RoundedRect, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../tokens.js';

export interface ChantDiscProps {
  playing: boolean;
  size?: number;
  /** Precomputed loudness peaks, 0–1, one per bar (§7.4). */
  peaks?: readonly number[];
  /** Respect the OS setting: no shimmer or pulse when motion is reduced (§7.5). */
  reduceMotion?: boolean;
}

const BAR_COUNT = 28;
const DEFAULT_PEAKS = Array.from({ length: BAR_COUNT }, (_, i) =>
  // A calm, chant-like envelope rather than random noise.
  0.35 + 0.45 * Math.abs(Math.sin((i / BAR_COUNT) * Math.PI * 3)),
);

/**
 * §7.4 `ChantDisc`: a maroon disc with a gold outer ring and a saffron glow,
 * carrying waveform bars that animate only while playing and ease flat on
 * pause (§7.5).
 */
export function ChantDisc({
  playing,
  size = 220,
  peaks = DEFAULT_PEAKS,
  reduceMotion = false,
}: ChantDiscProps) {
  const r = size / 2;
  const amplitude = useSharedValue(0);

  useEffect(() => {
    if (playing && !reduceMotion) {
      amplitude.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else if (playing) {
      amplitude.value = withTiming(0.7, { duration: 200 });
    } else {
      amplitude.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
    }

    return () => {
      cancelAnimation(amplitude);
    };
  }, [playing, reduceMotion, amplitude]);

  const barWidth = 4;
  const gap = 3;
  const totalWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
  const startX = r - totalWidth / 2;
  const maxBarHeight = r * 0.62;

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image">
      <Canvas style={{ width: size, height: size }}>
        {/* Saffron glow */}
        <Circle cx={r} cy={r} r={r - 2} color={colors.saffron['300'] as string} opacity={0.35} />
        {/* Gold outer ring */}
        <Circle
          cx={r}
          cy={r}
          r={r - 8}
          style="stroke"
          strokeWidth={5}
          color={colors.gold['500'] as string}
        />
        {/* Maroon disc */}
        <Circle cx={r} cy={r} r={r - 14} color={colors.maroon['800'] as string} />

        <Group origin={vec(r, r)}>
          {peaks.slice(0, BAR_COUNT).map((peak, index) => (
            <WaveBar
              key={index}
              x={startX + index * (barWidth + gap)}
              centerY={r}
              width={barWidth}
              peak={peak}
              maxHeight={maxBarHeight}
              amplitude={amplitude}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

function WaveBar({
  x,
  centerY,
  width,
  peak,
  maxHeight,
  amplitude,
}: {
  x: number;
  centerY: number;
  width: number;
  peak: number;
  maxHeight: number;
  amplitude: { value: number };
}) {
  const height = useDerivedValue(() => {
    const flat = 3;
    return flat + peak * maxHeight * amplitude.value;
  });
  const y = useDerivedValue(() => centerY - height.value / 2);

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={2}
      color={colors.gold['300'] as string}
    />
  );
}
