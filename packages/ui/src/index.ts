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
} from './tokens.js';

export {
  fontFamily,
  textStyles,
  mantraStyleFor,
  type FontFamily,
  type MantraScript,
  type TextStyleName,
  type TextStyleToken,
} from './typography.js';

export { Txt, type TxtProps, type TxtTone } from './components/Txt.js';
export { Card, type CardProps, type CardTone } from './components/Card.js';
export { Button, type ButtonProps, type ButtonTone } from './components/Button.js';
export { FieldCard, type FieldCardProps } from './components/FieldCard.js';
export { AvatarRing, type AvatarRingProps } from './components/AvatarRing.js';
export { FamilyChip, type FamilyChipProps } from './components/FamilyChip.js';
export { CheckRow, type CheckRowProps } from './components/CheckRow.js';
export { TimingRow, type TimingRowProps } from './components/TimingRow.js';
export { SunTimesCard, type SunTimesCardProps } from './components/SunTimesCard.js';
export { AngaBadge, type AngaBadgeKind, type AngaBadgeProps } from './components/AngaBadge.js';
export { CurvedHeader, type CurvedHeaderProps, type HeaderTone } from './components/CurvedHeader.js';
export { DateDial, type DateDialProps } from './components/DateDial.js';
export { ChantDisc, type ChantDiscProps } from './components/ChantDisc.js';
export { StepProgress, type StepProgressProps } from './components/StepProgress.js';
export {
  MantraText,
  type MantraLineView,
  type MantraTextProps,
} from './components/MantraText.js';
export {
  TransportControls,
  type TransportControlsProps,
} from './components/TransportControls.js';
export { ModeToggle, type ModeToggleProps, type PlayerMode } from './components/ModeToggle.js';
export {
  RecipePreviewCard,
  type RecipePreviewCardProps,
} from './components/RecipePreviewCard.js';
export { ProgressPill, type ProgressPillProps } from './components/ProgressPill.js';

export const UI_PACKAGE = {
  name: '@epooja/ui',
} as const;
