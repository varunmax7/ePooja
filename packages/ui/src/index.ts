/**
 * @epooja/ui — the design system (§7).
 *
 * Tokens are framework-free so Skia drawings, the NativeWind theme and tests
 * all read the same values. Components here are the §7.4 primitives; screen
 * composites live in `apps/mobile/src/components`.
 */

export {
  colors,
  gradients,
  radius,
  spacing,
  shadow,
  elevation,
  type Colors,
  type ColorScale,
  type ShadowToken,
} from './tokens';

export {
  fontFamily,
  textStyles,
  mantraStyleFor,
  mantraVariantFor,
  type FontFamily,
  type MantraScript,
  type TextStyleName,
  type TextStyleToken,
} from './typography';

export { clampFontScale, scaleTextStyle, MAX_FONT_SCALE, MIN_FONT_SCALE } from './fontScale';

export {
  FontScaleProvider,
  useFontScale,
  type FontScaleProviderProps,
} from './components/FontScaleProvider';

export { Txt, type TxtProps, type TxtTone } from './components/Txt';
export { Card, type CardProps, type CardTone } from './components/Card';
export { Button, type ButtonProps, type ButtonTone } from './components/Button';
export { FieldCard, type FieldCardProps } from './components/FieldCard';
export { AvatarRing, type AvatarRingProps } from './components/AvatarRing';
export { FamilyChip, type FamilyChipProps } from './components/FamilyChip';
export { CheckRow, type CheckRowProps } from './components/CheckRow';
export { TimingRow, type TimingRowProps } from './components/TimingRow';
export { SunTimesCard, type SunTimesCardProps } from './components/SunTimesCard';
export { AngaBadge, type AngaBadgeKind, type AngaBadgeProps } from './components/AngaBadge';
export {
  CurvedHeader,
  CURVE_OVERHANG,
  type CurvedHeaderProps,
  type HeaderTone,
} from './components/CurvedHeader';
export { DateDial, type DateDialProps } from './components/DateDial';
export { ChantDisc, type ChantDiscProps } from './components/ChantDisc';
export { StepProgress, type StepProgressProps } from './components/StepProgress';
export { MantraText, type MantraLineView, type MantraTextProps } from './components/MantraText';
export { TransportControls, type TransportControlsProps } from './components/TransportControls';
export { ModeToggle, type ModeToggleProps, type PlayerMode } from './components/ModeToggle';
export { RecipePreviewCard, type RecipePreviewCardProps } from './components/RecipePreviewCard';
export { ProgressPill, type ProgressPillProps } from './components/ProgressPill';

export const UI_PACKAGE = {
  name: '@epooja/ui',
} as const;
