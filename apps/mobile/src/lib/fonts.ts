import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
} from '@expo-google-fonts/mukta';
import {
  NotoSansTelugu_400Regular,
  NotoSansTelugu_500Medium,
  NotoSansTelugu_600SemiBold,
} from '@expo-google-fonts/noto-sans-telugu';
import { TiroDevanagariSanskrit_400Regular } from '@expo-google-fonts/tiro-devanagari-sanskrit';
import {
  TiroTelugu_400Regular,
  TiroTelugu_400Regular_Italic,
} from '@expo-google-fonts/tiro-telugu';
import { fontFamily } from '@epooja/ui';

/**
 * The §7.3 faces, keyed by the names `@epooja/ui` typography tokens use.
 *
 * Tiro Telugu and Tiro Devanagari Sanskrit are the mantra faces: they are
 * designed for Sanskrit typesetting and carry the Vedic svara marks, which the
 * `/_dev/svara` spike checks on a real device (§7.3).
 */
export const appFonts = {
  [fontFamily.uiTitle]: Mukta_600SemiBold,
  [fontFamily.uiLabel]: Mukta_500Medium,
  [fontFamily.uiBody]: Mukta_400Regular,
  [fontFamily.uiTelugu]: NotoSansTelugu_400Regular,
  [fontFamily.uiTeluguMedium]: NotoSansTelugu_500Medium,
  [fontFamily.uiTeluguSemiBold]: NotoSansTelugu_600SemiBold,
  [fontFamily.mantraTelugu]: TiroTelugu_400Regular,
  [fontFamily.mantraDevanagari]: TiroDevanagariSanskrit_400Regular,
  [fontFamily.transliteration]: TiroTelugu_400Regular_Italic,
} as const;
