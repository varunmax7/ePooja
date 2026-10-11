import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDayPanchangam,
  getMonth,
  type GeoLocation,
  type PanchangamData,
} from '@epooja/panchangam';
import { useDevoteeStore } from '@/stores/devotee';
import { useSettingsStore, resolveToday } from '@/stores/settings';
import { FESTIVAL_FILES } from './content';
import { toFullPanchangamView, toMonthView, toTodayView, type DisplayScript } from './viewModel';

/**
 * The engine is pure and synchronous (§9.1) — no network, no I/O — so wrapping
 * it in `useQuery` is not about fetching, it's about the two things a plain
 * `useMemo` would not give: caching across the day-swipe so paging back to a
 * date already computed is instant, and a stable "day" identity to key
 * everything else in the tree off.
 */

export function panchangamQueryKey(date: string, location: GeoLocation): unknown[] {
  return ['panchangam', date, location.lat, location.lng, location.tz];
}

function computePanchangam(date: string, location: GeoLocation): PanchangamData {
  // `getDayPanchangam` takes a plain `yyyy-MM-dd` and resolves sunrise in the
  // location's own timezone itself (§9.1 vasara rule) — the printed-panchangam
  // convention the Today screen wants, and the same convention the §9.1
  // fixtures are checked against.
  return getDayPanchangam(date, location, { basis: 'sunrise' });
}

/** Which calendar date the Today screen is showing right now. */
export function useTodayDate(): {
  date: string;
  goToDate: (date: string) => void;
  goToToday: () => void;
} {
  const location = useDevoteeStore((s) => s.devotee?.location);
  const debugDate = useSettingsStore((s) => s.debugDate);
  const viewingDate = useSettingsStore((s) => s.viewingDate);
  const setViewingDate = useSettingsStore((s) => s.setViewingDate);

  const todaysDate = resolveToday(debugDate, new Date(), location?.tz ?? 'UTC', __DEV__);

  return {
    date: viewingDate ?? todaysDate,
    goToDate: setViewingDate,
    goToToday: () => {
      setViewingDate(null);
    },
  };
}

/** The raw engine output for a date, memoized and cached across navigation. */
export function usePanchangam(date: string, location: GeoLocation | undefined) {
  return useQuery({
    queryKey: location ? panchangamQueryKey(date, location) : ['panchangam', 'no-location'],
    queryFn: () => computePanchangam(date, location as GeoLocation),
    enabled: location !== undefined,
    // The engine is deterministic and offline; there is nothing to go stale.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** The Today screen's formatted view for the devotee's current location and date. */
export function useTodayView(script: DisplayScript, uiLang: 'en' | 'te') {
  const { date, goToDate, goToToday } = useTodayDate();
  const location = useDevoteeStore((s) => s.devotee?.location);
  const query = usePanchangam(date, location);

  const view = useMemo(
    () => (query.data ? toTodayView(query.data, script, uiLang) : null),
    [query.data, script, uiLang],
  );

  return { ...query, date, goToDate, goToToday, view, raw: query.data };
}

/** The full-Panchangam sheet's view for a given date. */
export function useFullPanchangamView(
  date: string,
  script: DisplayScript,
  uiLang: 'en' | 'te' = 'en',
) {
  const location = useDevoteeStore((s) => s.devotee?.location);
  const query = usePanchangam(date, location);

  const view = useMemo(
    () => (query.data ? toFullPanchangamView(query.data, script, uiLang) : null),
    [query.data, script, uiLang],
  );

  return { ...query, view };
}

function computeMonth(year: number, month: number, location: GeoLocation): PanchangamData[] {
  return getMonth(year, month, location);
}

export function monthQueryKey(year: number, month: number, location: GeoLocation): unknown[] {
  return ['panchangam-month', year, month, location.lat, location.lng, location.tz];
}

/** The raw per-day engine output for a whole Gregorian month, cached the same way `usePanchangam` is. */
export function useMonthPanchangam(year: number, month: number, location: GeoLocation | undefined) {
  return useQuery({
    queryKey: location ? monthQueryKey(year, month, location) : ['panchangam-month', 'no-location'],
    queryFn: () => computeMonth(year, month, location as GeoLocation),
    enabled: location !== undefined,
    // Same reasoning as `usePanchangam`: pure and offline, never stale.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** The Calendar screen's month grid for the devotee's current location. */
export function useMonthView(year: number, month: number, uiLang: 'en' | 'te' = 'en') {
  const location = useDevoteeStore((s) => s.devotee?.location);
  const { date: todayDate } = useTodayDate();
  const query = useMonthPanchangam(year, month, location);

  const view = useMemo(() => {
    if (!query.data) return null;
    const samvatsaraId = query.data[0]?.samvatsara.id;
    const festivalFile = samvatsaraId ? FESTIVAL_FILES[samvatsaraId] : undefined;
    return toMonthView(year, month, query.data, todayDate, festivalFile, uiLang);
  }, [query.data, year, month, todayDate, uiLang]);

  return { ...query, view };
}
