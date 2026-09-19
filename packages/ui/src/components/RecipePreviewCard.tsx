import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { View, type ImageSourcePropType } from 'react-native';
import { colors, elevation, radius, shadow, spacing } from '../tokens.js';
import { Button } from './Button.js';
import { Txt } from './Txt.js';

export interface RecipePreviewCardProps {
  /** e.g. "Offerings Recipe Preview:" — localized by the caller. */
  eyebrow: string;
  title: string;
  subtitle?: string;
  buttonLabel: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
}

/**
 * §7.4 `RecipePreviewCard`: a saffron-gradient card with the food photo on the
 * left, the eyebrow and dish name beside it, and a maroon pill button.
 */
export function RecipePreviewCard({
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  image,
  onPress,
}: RecipePreviewCardProps) {
  return (
    <LinearGradient
      colors={[colors.saffron['300'] as string, colors.saffron['500'] as string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: radius.lg,
          padding: spacing[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[4],
        },
        elevation(shadow.card),
      ]}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: colors.cream['200'],
        }}
      >
        {image ? <Image source={image} style={{ width: '100%', height: '100%' }} /> : null}
      </View>

      <View style={{ flex: 1, gap: spacing[1] }}>
        <Txt variant="fieldLabel" tone="maroon">
          {eyebrow}
        </Txt>
        <Txt variant="cardTitle" tone="ink">
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="teluguLabel" tone="inkMuted">
            {subtitle}
          </Txt>
        ) : null}
        <View style={{ height: spacing[1] }} />
        <Button label={buttonLabel} tone="maroon" onPress={onPress} />
      </View>
    </LinearGradient>
  );
}
