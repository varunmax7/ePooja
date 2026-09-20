import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { clampFontScale } from '../fontScale';

const FontScaleContext = createContext<number | null>(null);

export interface FontScaleProviderProps {
  /**
   * Overrides the OS text size. Two callers: the Phase 1 screenshot harness,
   * which has no OS setting to read on web, and (from Phase 9) the in-app
   * text-size preference.
   */
  scale?: number;
  children: ReactNode;
}

export function FontScaleProvider({ scale, children }: FontScaleProviderProps) {
  const value = useMemo(() => (scale === undefined ? null : clampFontScale(scale)), [scale]);
  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

/**
 * The font scale text should be laid out at: the override if one is set,
 * otherwise the OS text size, clamped to the range Phase 1 is proven at.
 */
export function useFontScale(): number {
  const override = useContext(FontScaleContext);
  const { fontScale } = useWindowDimensions();
  return clampFontScale(override ?? fontScale);
}
