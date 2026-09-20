import { Platform } from 'react-native';
import { clampFontScale } from '@epooja/ui';

/**
 * Dev-only Dynamic Type override, read from `?fontScale=1.3` in the URL.
 *
 * Web is not a shipping target (§2) — it exists so the design system can be
 * rendered and screenshotted for the Phase 1 gate (`docs/screens/p1/`), and
 * there is no OS text size to read there. On a device this returns undefined,
 * so `useFontScale` falls through to the real accessibility setting.
 */
export function readFontScaleOverride(): number | undefined {
  if (!__DEV__ || Platform.OS !== 'web') return undefined;

  const search = globalThis.location?.search;
  if (!search) return undefined;

  const raw = new URLSearchParams(search).get('fontScale');
  if (raw === null) return undefined;

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? clampFontScale(parsed) : undefined;
}
