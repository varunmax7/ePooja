import { useEffect } from 'react';
import i18next from 'i18next';
import { useDevoteeStore } from '@/stores/devotee';
import { useOnboardingDraft } from '@/stores/onboardingDraft';

/**
 * Keeps i18next's active language in step with the devotee's choice of
 * `prefs.uiLang` (§9.4).
 *
 * Before onboarding finishes there is no devotee yet — only the wizard's own
 * draft — and the devotee + family + location screens right after the
 * language step should already render in the language just picked, not wait
 * for `createDevotee` at the very end. So this follows the draft until a
 * devotee exists, then the devotee's own persisted preference after.
 *
 * i18next's instance lives outside the component tree (`i18n/index.ts`), so
 * a store subscription rather than a render-time read is what makes a change
 * in Profile take effect without a reload. Mounted once, at the root.
 */
export function useSyncLanguage(): void {
  const devoteeLang = useDevoteeStore((s) => s.devotee?.prefs.uiLang);
  const draftLang = useOnboardingDraft((s) => s.uiLang);
  const uiLang = devoteeLang ?? draftLang;

  useEffect(() => {
    // eslint-disable-next-line import/no-named-as-default-member -- see i18n/index.ts
    if (i18next.language !== uiLang) void i18next.changeLanguage(uiLang);
  }, [uiLang]);
}
