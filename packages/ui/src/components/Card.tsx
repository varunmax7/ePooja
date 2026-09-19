import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, elevation, radius, shadow, spacing } from '../tokens.js';

export type CardTone = 'cream' | 'creamRaised' | 'outlined' | 'maroon';

export interface CardProps {
  tone?: CardTone;
  /** Index into the §7.2 spacing scale. */
  padding?: number;
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const TONE_STYLES: Record<CardTone, ViewStyle> = {
  cream: { backgroundColor: colors.cream['100'] },
  creamRaised: { backgroundColor: colors.cream['50'] },
  outlined: {
    backgroundColor: colors.cream['200'],
    borderWidth: 1,
    borderColor: colors.gold['300'],
  },
  maroon: { backgroundColor: colors.maroon['800'] },
};

/**
 * The rounded, warm-shadowed surface everything else sits on (§7.1).
 * `outlined` is the cream-200 + gold-300 hairline treatment §7.4 gives
 * `FieldCard` and the samagri rows.
 */
export function Card({ tone = 'cream', padding = 4, raised = false, style, children }: CardProps) {
  return (
    <View
      style={[
        {
          borderRadius: radius.md,
          padding: spacing[padding],
        },
        TONE_STYLES[tone],
        elevation(raised ? shadow.raised : shadow.card),
        style,
      ]}
    >
      {children}
    </View>
  );
}
