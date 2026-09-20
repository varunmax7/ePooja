import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { Txt } from './Txt';

export interface CheckRowProps {
  label: string;
  /** Telugu label shown under the English one, when the devotee reads Telugu. */
  secondary?: string;
  checked: boolean;
  onToggle: () => void;
  /** MaterialCommunityIcons name for the illustrated samagri icon at the right. */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  optional?: boolean;
  optionalLabel?: string;
}

/**
 * §7.4 `CheckRow`: a card row with a checkbox (saffron when checked), the item
 * label, and an illustrated icon on the right. Pressing it fires a haptic —
 * the caller wires `expo-haptics`, since this package stays device-free.
 */
export function CheckRow({
  label,
  secondary,
  checked,
  onToggle,
  icon = 'flower-outline',
  optional = false,
  optionalLabel = 'optional',
}: CheckRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[1],
        gap: spacing[3],
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: checked ? colors.saffron['500'] : colors.gold['400'],
          backgroundColor: checked ? colors.saffron['500'] : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <MaterialCommunityIcons name="check" size={16} color={colors.maroon['900'] as string} />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <Txt variant="cardTitle" tone={checked ? 'inkMuted' : 'ink'}>
          {label}
          {optional ? ` · ${optionalLabel}` : ''}
        </Txt>
        {secondary ? (
          <Txt variant="teluguLabel" tone="inkMuted">
            {secondary}
          </Txt>
        ) : null}
      </View>

      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.cream['300'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={colors.maroon['700'] as string} />
      </View>
    </Pressable>
  );
}
