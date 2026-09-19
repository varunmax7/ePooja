import { View } from 'react-native';
import { colors, radius, spacing } from '../tokens.js';
import { Txt } from './Txt.js';

export interface ProgressPillProps {
  /** e.g. "4/6 ready" — localized by the caller. */
  label: string;
  done: number;
  total: number;
}

/**
 * The "4/6 ready" progress chip on the Preparation screen (§8.4), with a gold
 * fill that tracks the checklist.
 */
export function ProgressPill({ label, done, total }: ProgressPillProps) {
  const ratio = total === 0 ? 0 : Math.min(1, Math.max(0, done / total));
  const complete = done >= total && total > 0;

  return (
    <View
      style={{
        borderRadius: radius.pill,
        backgroundColor: colors.cream['300'],
        overflow: 'hidden',
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${ratio * 100}%`,
          backgroundColor: complete ? colors.success : colors.gold['300'],
          opacity: complete ? 0.35 : 0.9,
        }}
      />
      <Txt variant="label" tone={complete ? 'success' : 'maroon'}>
        {label}
      </Txt>
    </View>
  );
}
