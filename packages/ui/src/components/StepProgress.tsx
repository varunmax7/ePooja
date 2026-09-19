import { View } from 'react-native';
import { colors, radius, spacing } from '../tokens.js';
import { Txt } from './Txt.js';

export interface StepProgressProps {
  /** Already localized, e.g. "Step 4 of 16: Kalasha Puja". */
  caption: string;
  /** Position within the current step, 0–1. */
  progress: number;
  elapsed?: string;
  remaining?: string;
}

/**
 * §7.4 `StepProgress`: the step caption plus a saffron track with a maroon
 * thumb showing the position inside that step.
 *
 * §3.2: the step count is data-driven per puja — the mockup's "Step 4 of 16"
 * conflated steps with the sixteen upacharas, which are a section inside the
 * Pradhana Puja, not the whole ritual.
 */
export function StepProgress({ caption, progress, elapsed, remaining }: StepProgressProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ gap: spacing[2], alignSelf: 'stretch' }}>
      <Txt variant="label" tone="maroon" align="center">
        {caption}
      </Txt>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
        style={{
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.saffron['200'],
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: 6,
            width: `${clamped * 100}%`,
            borderRadius: radius.pill,
            backgroundColor: colors.saffron['500'],
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: `${clamped * 100}%`,
            marginLeft: -8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.maroon['800'],
            borderWidth: 2,
            borderColor: colors.cream['100'],
          }}
        />
      </View>

      {elapsed || remaining ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="fieldLabel" tone="inkMuted">
            {elapsed ?? ''}
          </Txt>
          <Txt variant="fieldLabel" tone="inkMuted">
            {remaining ?? ''}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
