import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors, elevation, shadow, spacing } from '../tokens';
import { Txt } from './Txt';

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
 *
 * Two of these share a row, and the values are pandit-supplied Telugu of
 * unknown length that grows again under Dynamic Type — so the badge shrinks
 * (RN defaults `flexShrink` to 0, which is what pushes the far badge off the
 * screen at 360 px) and the text truncates rather than the row overflowing.
 */
export function AngaBadge({ kind, label, value, align = 'left' }: AngaBadgeProps) {
  const rowDirection = align === 'right' ? 'row-reverse' : 'row';

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: spacing[2],
        flexShrink: 1,
        minWidth: 0,
      }}
    >
      <View
        style={[
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            flexShrink: 0,
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

      <View
        style={{
          alignItems: align === 'right' ? 'flex-end' : 'flex-start',
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <Txt variant="fieldLabel" tone="inkMuted" numberOfLines={1}>
          {label}
        </Txt>
        <Txt variant="teluguLabel" tone="maroon" numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}
