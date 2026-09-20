import { useState, type ComponentProps } from 'react';
import { TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { textStyles } from '../typography';
import { scaleTextStyle } from '../fontScale';
import { Txt } from './Txt';
import { useFontScale } from './FontScaleProvider';

export interface TextFieldProps
  extends Pick<
    ComponentProps<typeof TextInput>,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'autoCapitalize'
    | 'autoFocus'
    | 'keyboardType'
    | 'multiline'
    | 'onSubmitEditing'
    | 'returnKeyType'
  > {
  label: string;
  /** Telugu/Devanagari input wants the matching script face, not Mukta. */
  script?: 'latin' | 'telugu' | 'devanagari';
  error?: string;
  /** Shown under the field when there is no error — a hint or example. */
  hint?: string;
}

/**
 * A labelled text input in the §7.2/§7.3 palette and type scale — the one
 * primitive the four Phase 1 mockup screens had no need for, but every
 * onboarding and profile-editing form does.
 *
 * `allowFontScaling={false}` + `scaleTextStyle` for the same reason `Txt`
 * does it: RN scales `fontSize` without `lineHeight`, which would clip a
 * Telugu descender under Dynamic Type.
 */
export function TextField({
  label,
  script = 'latin',
  error,
  hint,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const fontScale = useFontScale();

  const variant = script === 'telugu' ? 'telugu' : script === 'devanagari' ? 'body' : 'body';
  const inputStyle = scaleTextStyle(textStyles[variant], fontScale);

  const borderColor = error
    ? colors.danger
    : focused
      ? (colors.gold['500'] as string)
      : (colors.gold['400'] as string);

  return (
    <View>
      <Txt variant="fieldLabel" tone="inkMuted">
        {label.toUpperCase()}
      </Txt>
      <View style={{ height: spacing[1] }} />
      <TextInput
        {...inputProps}
        allowFontScaling={false}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        placeholderTextColor={colors.ink['500'] as string}
        style={[
          inputStyle,
          {
            color: colors.ink['900'] as string,
            backgroundColor: colors.cream['200'] as string,
            borderWidth: focused ? 2 : 1,
            borderColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
          },
        ]}
      />
      {error ? (
        <Txt variant="label" tone="danger" style={{ marginTop: spacing[1] }}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="label" tone="inkMuted" style={{ marginTop: spacing[1] }}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
