import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, elevation, radius, shadow, spacing } from '../tokens';
import { Txt } from './Txt';

export type ButtonTone = 'maroon' | 'gold' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Record<ButtonTone, string> = {
  maroon: colors.maroon['800'] as string,
  gold: colors.gold['500'] as string,
  ghost: 'transparent',
};

/**
 * The maroon pill button from the mockup (§7.4 `RecipePreviewCard`, "Start
 * Pooja"), plus a gold variant for secondary actions and a ghost variant for
 * tertiary ones.
 */
export function Button({
  label,
  onPress,
  tone = 'maroon',
  size = 'md',
  icon,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const paddingVertical = size === 'lg' ? spacing[4] : spacing[3];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: radius.pill,
          paddingVertical,
          paddingHorizontal: spacing[6],
          backgroundColor: disabled ? colors.ink['400'] : BACKGROUNDS[tone],
          opacity: pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderWidth: tone === 'ghost' ? 1 : 0,
          borderColor: colors.gold['400'],
        },
        tone === 'ghost' ? null : elevation(shadow.card),
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
        }}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={size === 'lg' ? 20 : 18}
            color={(tone === 'maroon' ? colors.cream['100'] : colors.maroon['900']) as string}
          />
        ) : null}
        <Txt
          variant={size === 'lg' ? 'cardTitle' : 'label'}
          tone={tone === 'maroon' ? 'cream' : 'maroon'}
        >
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}
