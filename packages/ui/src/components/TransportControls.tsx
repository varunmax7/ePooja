import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { Pressable, View } from 'react-native';
import { colors, elevation, gradients, shadow, spacing } from '../tokens';

export interface TransportControlsProps {
  playing: boolean;
  onPlayPause: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  labels: {
    play: string;
    pause: string;
    previous: string;
    next: string;
  };
}

const COIN = 72;

/**
 * §7.4 `TransportControls`: previous step │ a 72 px gold coin play/pause │
 * next step. The coin reuses the `goldCoin` gradient from the date dial so the
 * two read as the same material.
 */
export function TransportControls({
  playing,
  onPlayPause,
  onPrevious,
  onNext,
  labels,
}: TransportControlsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[7],
      }}
    >
      <StepButton icon="skip-previous" label={labels.previous} onPress={onPrevious} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? labels.pause : labels.play}
        onPress={onPlayPause}
        style={({ pressed }) => [
          { width: COIN, height: COIN, opacity: pressed ? 0.9 : 1 },
          elevation(shadow.raised),
        ]}
      >
        <Canvas style={{ position: 'absolute', width: COIN, height: COIN }}>
          <Circle cx={COIN / 2} cy={COIN / 2} r={COIN / 2}>
            <RadialGradient
              c={vec(COIN * 0.35, COIN * 0.3)}
              r={COIN * 0.9}
              colors={[...gradients.goldCoin]}
            />
          </Circle>
        </Canvas>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons
            name={playing ? 'pause' : 'play'}
            size={34}
            color={colors.maroon['900'] as string}
          />
        </View>
      </Pressable>

      <StepButton icon="skip-next" label={labels.next} onPress={onNext} />
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: 'skip-previous' | 'skip-next';
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={12}
      style={{ opacity: onPress ? 1 : 0.4 }}
    >
      <MaterialCommunityIcons name={icon} size={32} color={colors.maroon['800'] as string} />
    </Pressable>
  );
}
