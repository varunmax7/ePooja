import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import te from './locales/te';

/**
 * i18next instance for every UI string in the app (implementation.md §10
 * Phase 9: "Full Telugu UI strings; script switcher applied everywhere").
 *
 * This is deliberately separate from the mantra `script` setting
 * (`DisplayScript` in `services/panchangam/viewModel.ts`): `uiLang` picks the
 * language of interface chrome ("Settings" vs. "సెట్టింగులు"), `script` picks
 * the alphabet a *ritual* value renders in. A devotee can run an English
 * interface while reading Telugu nakshatra names, and often does (§9.3).
 *
 * No ritual text lives here — only UI chrome, same boundary `i18n/onboarding.ts`
 * already draws (§15 bans Telugu/Devanagari literals in `.tsx`, not in `i18n/`).
 */

export const NAMESPACES = Object.keys(en) as (keyof typeof en)[];

export const DEFAULT_NS = 'common';

// `i18next`'s default export carries `use`/`init`/`changeLanguage` as instance
// methods, not as the named exports eslint-plugin-import is warning about
// here — a known false positive for this package's dual CJS/ESM shape.
// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next).init({
  resources: {
    en,
    te,
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: DEFAULT_NS,
  ns: NAMESPACES,
  interpolation: {
    // React already escapes — double-escaping would turn "&" into "&amp;".
    escapeValue: false,
  },
});

export { i18next };
export { useSyncLanguage } from './useSyncLanguage';
