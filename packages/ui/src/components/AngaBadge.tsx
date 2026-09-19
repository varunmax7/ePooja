import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors, elevation, shadow, spacing } from '../tokens.js';
import { Txt } from './Txt.js';

export type AngaBadgeKind = 'tithi' | 'nakshatra' | 'ritu' | 'masa';

export interface AngaBadgeProps {
  kind: AngaBadgeKind;
  /** e.g. "Tithi:" — already localized by the caller. */
  label: string;
  /** The value, in the devotee's script. */
  value: string;
  align?: 'left' | 'right';
}

const ICONS: Record<AngaBadgeKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  tithi: 'moon-waning-crescent',
  nakshatra: 'star-four-points',
  ritu: 'leaf',
  masa: 'calendar-month-outline',
};

/**
 * §7.4 `AngaBadge`: a gold circular icon with a two-line label, placed at the
 * four corners around the date dial (§8.2).
 */
export function AngaBadge({ kind, label, value, align = 'left' }: AngaBadgeProps) {
  const rowDirection = align === 'right' ? 'row-reverse' : 'row';

  return (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing[2] }}>
      <View
        style={[
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.gold['200'],
            borderWidth: 1,
            borderColor: colors.gold['400'],
            alignItems: 'center',
            justifyContent: 'center',
          },
          elevation(shadow.card),
        ]}
      >
        <MaterialCommunityIcons
          name={ICONS[kind]}
          size={18}
          color={colors.maroon['700'] as string}
        />
      </View>

      <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <Txt variant="fieldLabel" tone="inkMuted">
          {label}
        </Txt>
        <Txt variant="teluguLabel" tone="maroon" numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}
