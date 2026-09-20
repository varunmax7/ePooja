import { Canvas, Circle, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Pressable, View } from 'react-native';
import { colors, gradients, spacing } from '../tokens';
import { Txt } from './Txt';

export interface DateDialProps {
  weekday: string;
  day: string;
  month: string;
  year: string;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * §7.4 `DateDial`: a gold coin — radial gradient, inner bevel ring, tick marks
 * and a small notch at the top — carrying the weekday, day, month and year.
 *
 * Skia rather than nested Views because the bevel and the 24 ticks would
 * otherwise be two dozen absolutely-positioned elements, and §7.5 wants a
 * sweep shimmer on this at 60 fps.
 */
export function DateDial({
  weekday,
  day,
  month,
  year,
  size = 220,
  onPress,
  accessibilityLabel,
}: DateDialProps) {
  const r = size / 2;
  const ticks = Skia.Path.Make();

  // 24 tick marks around the rim, with the top one left out for the notch.
  for (let i = 0; i < 24; i += 1) {
    if (i === 0) continue;
    const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
    const outer = r * 0.93;
    const inner = i % 6 === 0 ? r * 0.84 : r * 0.88;
    ticks.moveTo(r + Math.cos(angle) * inner, r + Math.sin(angle) * inner);
    ticks.lineTo(r + Math.cos(angle) * outer, r + Math.sin(angle) * outer);
  }

  const notch = Skia.Path.Make();
  notch.moveTo(r - 7, r * 0.1);
  notch.lineTo(r + 7, r * 0.1);
  notch.lineTo(r, r * 0.26);
  notch.close();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel ?? `${weekday} ${day} ${month} ${year}`}
      onPress={onPress}
      style={{ width: size, height: size }}
    >
      <Canvas style={{ position: 'absolute', width: size, height: size }}>
        <Circle cx={r} cy={r} r={r - 2}>
          <RadialGradient
            c={vec(r * 0.72, r * 0.6)}
            r={r * 1.25}
            colors={[...gradients.goldCoin]}
          />
        </Circle>

        {/* Inner bevel ring */}
        <Circle
          cx={r}
          cy={r}
          r={r * 0.79}
          style="stroke"
          strokeWidth={2}
          color={colors.gold['200'] as string}
          opacity={0.9}
        />
        <Circle
          cx={r}
          cy={r}
          r={r * 0.74}
          style="stroke"
          strokeWidth={1}
          color={colors.gold['700'] as string}
          opacity={0.35}
        />

        <Group>
          <Path
            path={ticks}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            color={colors.gold['700'] as string}
            opacity={0.5}
          />
          <Path path={notch} color={colors.maroon['800'] as string} opacity={0.85} />
        </Group>
      </Canvas>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Txt variant="dialCaption" tone="maroon">
          {weekday.toUpperCase()}
        </Txt>
        <Txt variant="dialDay" tone="maroon">
          {day}
        </Txt>
        <Txt variant="dialCaption" tone="maroon">
          {month}
        </Txt>
        <View style={{ height: spacing[1] }} />
        <Txt variant="fieldLabel" tone="gold">
          {year}
        </Txt>
      </View>
    </Pressable>
  );
}
