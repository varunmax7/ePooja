import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { colors, spacing } from '../tokens';
import { Txt } from './Txt';

export interface FamilyChipProps {
  name: string;
  /** Renders the trailing "+" chip instead of a person. */
  add?: boolean;
  onPress?: () => void;
}

const SIZE = 56;

/**
 * §7.4 `FamilyChip`: a 56 px saffron circle with a maroon person glyph and the
 * name underneath. The profile screen scrolls these horizontally and ends with
 * an "add" chip.
 */
export function FamilyChip({ name, add = false, onPress }: FamilyChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={{ alignItems: 'center', width: SIZE + spacing[4] }}
    >
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: add ? colors.cream['200'] : colors.saffron['300'],
          borderWidth: add ? 1 : 0,
          borderColor: colors.gold['400'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={add ? 'plus' : 'account'}
          size={add ? 24 : 30}
          color={(add ? colors.gold['700'] : colors.maroon['800']) as string}
        />
      </View>
      <View style={{ height: spacing[1] }} />
      <Txt variant="label" tone="inkMuted" align="center" numberOfLines={1}>
        {name}
      </Txt>
    </Pressable>
  );
}
