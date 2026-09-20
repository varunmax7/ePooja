/**
 * Typography tokens (§7.3).
 *
 * Font family names must match the keys `apps/mobile/src/lib/fonts.ts` loads;
 * `src/typography.test.ts` checks that the two stay in step.
 */

export const fontFamily = {
  /** UI Latin: titles 600, labels 500, body 400. Also covers Devanagari. */
  uiTitle: 'Mukta_600SemiBold',
  uiLabel: 'Mukta_500Medium',
  uiBody: 'Mukta_400Regular',
  /** UI Telugu: labels, buttons, purohit instructions. */
  uiTelugu: 'NotoSansTelugu_400Regular',
  uiTeluguMedium: 'NotoSansTelugu_500Medium',
  uiTeluguSemiBold: 'NotoSansTelugu_600SemiBold',
  /** Mantra text. */
  mantraTelugu: 'TiroTelugu_400Regular',
  mantraDevanagari: 'TiroDevanagariSanskrit_400Regular',
  /**
   * Transliteration: §7.3 asks for Mukta Italic, but Mukta ships no italic cut.
   * The Tiro italic is used instead — it carries the IAST diacritics
   * (ā ṛ ṣ ṇ ṃ) properly, which is what the requirement is really about.
   */
  transliteration: 'TiroTelugu_400Regular_Italic',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

export interface TextStyleToken {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

/**
 * Named text styles. Screens pick one of these rather than setting a size.
 *
 * Mantra styles use the larger 20–24 px with the 1.6 line-height §7.3 requires,
 * so that svara marks above and below the line are never clipped.
 */
export const textStyles = {
  screenTitle: { fontFamily: fontFamily.uiTitle, fontSize: 22, lineHeight: 30 },
  sectionTitle: { fontFamily: fontFamily.uiTitle, fontSize: 17, lineHeight: 24 },
  cardTitle: { fontFamily: fontFamily.uiTitle, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.uiBody, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fontFamily.uiLabel, fontSize: 13, lineHeight: 18 },
  fieldLabel: { fontFamily: fontFamily.uiLabel, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  fieldValue: { fontFamily: fontFamily.uiTitle, fontSize: 16, lineHeight: 22 },
  dialDay: { fontFamily: fontFamily.uiTitle, fontSize: 48, lineHeight: 54 },
  dialCaption: { fontFamily: fontFamily.uiLabel, fontSize: 13, lineHeight: 18 },
  telugu: { fontFamily: fontFamily.uiTelugu, fontSize: 15, lineHeight: 24 },
  teluguLabel: { fontFamily: fontFamily.uiTeluguMedium, fontSize: 13, lineHeight: 22 },
  mantraTelugu: { fontFamily: fontFamily.mantraTelugu, fontSize: 22, lineHeight: 35 },
  mantraTeluguSmall: { fontFamily: fontFamily.mantraTelugu, fontSize: 18, lineHeight: 29 },
  mantraDevanagari: { fontFamily: fontFamily.mantraDevanagari, fontSize: 22, lineHeight: 35 },
  transliteration: { fontFamily: fontFamily.transliteration, fontSize: 14, lineHeight: 22 },
} as const satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;

/** Mantra script the devotee reads (§2, settings). */
export type MantraScript = 'te' | 'dev' | 'iast';

/**
 * The named style a mantra line uses in a given script.
 *
 * Components ask for the *name*, not the token: `Txt` looks the token up and
 * applies Dynamic Type to it, and a style passed in by hand would overwrite
 * the scaled metrics with the unscaled ones.
 */
export function mantraVariantFor(script: MantraScript): TextStyleName {
  if (script === 'dev') return 'mantraDevanagari';
  if (script === 'iast') return 'transliteration';
  return 'mantraTelugu';
}

/** The text style a mantra line uses in a given script. */
export function mantraStyleFor(script: MantraScript): TextStyleToken {
  return textStyles[mantraVariantFor(script)];
}
