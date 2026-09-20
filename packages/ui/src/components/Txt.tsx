import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { colors } from '../tokens';
import { textStyles, type TextStyleName } from '../typography';

export type TxtTone = 'ink' | 'inkMuted' | 'cream' | 'maroon' | 'gold' | 'danger' | 'success';

const TONES: Record<TxtTone, string> = {
  ink: colors.ink['900'] as string,
  inkMuted: colors.ink['500'] as string,
  cream: colors.cream['100'] as string,
  maroon: colors.maroon['800'] as string,
  gold: colors.gold['700'] as string,
  danger: colors.danger,
  success: colors.success,
};

export interface TxtProps extends Omit<TextProps, 'style'> {
  variant?: TextStyleName;
  tone?: TxtTone;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

/**
 * Every piece of text in the app goes through this component.
 *
 * It exists so that §15's "no font or colour literals in components" is the
 * easy path: a screen picks a named §7.3 style and a tone, never a size or a
 * hex value. It also means Dynamic Type and script switching have one place to
 * change.
 */
export function Txt({
  variant = 'body',
  tone = 'ink',
  align,
  style,
  children,
  ...rest
}: TxtProps) {
  return (
    <Text
      style={[textStyles[variant], { color: TONES[tone] }, align ? { textAlign: align } : null, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
