/**
 * The handful of non-Latin display strings the onboarding screens need
 * before the app has any real i18n setup (Phase 9 does that in full).
 *
 * Not ritual content — no Sankalpam or mantra text lives here, only UI
 * chrome ("Telugu" as a language name, a familiar mantra as a script
 * sample) — but still text in the Telugu/Devanagari script, so it goes in
 * this `i18n` directory rather than a `.tsx` file: §15's ban on script
 * literals in components exempts files under `i18n` for exactly this reason.
 */

export const TELUGU_LANGUAGE_NAME = 'తెలుగు';

/** A mantra every devotee already knows, used only to preview a script choice. */
export const SCRIPT_SAMPLES = {
  te: 'ఓం నమః శివాయ',
  dev: 'ॐ नमः शिवाय',
} as const;

/** Placeholder for the Telugu name field (§8.1 devotee step) — "your name". */
export const TELUGU_NAME_PLACEHOLDER = 'మీ పేరు';
