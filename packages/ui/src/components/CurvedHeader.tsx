import { Canvas, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { colors, gradients, spacing } from '../tokens';
import { Txt } from './Txt';

export type HeaderTone = 'maroon' | 'saffron';

export interface CurvedHeaderProps {
  title: string;
  subtitle?: string;
  tone?: HeaderTone;
  /** 180–240 px per §7.4; taller when the header carries an avatar. */
  height?: number;
  /** Rendered over the band, e.g. the profile avatar. */
  children?: ReactNode;
  /** Slot at the top-right, e.g. an edit button. */
  action?: ReactNode;
}

/**
 * §7.4 `CurvedHeader`: a gradient band with a convex bottom curve, drawn as a
 * Skia path so the curve stays smooth at any width.
 *
 * The maroon band carries cream text (Today, Preparation); the saffron band
 * carries maroon text (Profile).
 */
export function CurvedHeader({
  title,
  subtitle,
  tone = 'maroon',
  height = 200,
  children,
  action,
}: CurvedHeaderProps) {
  const { width } = useWindowDimensions();
  const curve = 34;

  // Band with a convex bottom edge: down both sides, then a quadratic bulge.
  const path = Skia.Path.Make();
  path.moveTo(0, 0);
  path.lineTo(width, 0);
  path.lineTo(width, height - curve);
  path.quadTo(width / 2, height + curve, 0, height - curve);
  path.close();

  const stops = tone === 'maroon' ? gradients.maroonHeader : gradients.saffronHeader;
  const textTone = tone === 'maroon' ? 'cream' : 'maroon';

  return (
    <View style={{ height, width: '100%' }}>
      <Canvas style={{ position: 'absolute', width, height: height + curve }}>
        <Path path={path}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[...stops]} />
        </Path>
      </Canvas>

      {action ? (
        <View style={{ position: 'absolute', right: spacing[5], top: spacing[6] }}>{action}</View>
      ) : null}

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing[6],
          paddingBottom: spacing[3],
          gap: spacing[2],
        }}
      >
        <Txt variant="screenTitle" tone={textTone} align="center">
          {title}
        </Txt>
        {subtitle ? (
          <Txt
            variant="teluguLabel"
            tone={textTone}
            align="center"
            style={{ color: tone === 'maroon' ? colors.gold['300'] : colors.maroon['700'] }}
          >
            {subtitle}
          </Txt>
        ) : null}
        {children}
      </View>
    </View>
  );
}
