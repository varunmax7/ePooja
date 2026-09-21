import { enumDisplay, enumValue } from '@epooja/content';
import type { PanchangamData } from '@epooja/panchangam';
import { ENUM_FILES, TIMINGS } from './content';

/**
 * Turns the engine's ids into the strings the Today and Calendar screens
 * show, in the devotee's chosen script (§7.3 `MantraScript`).
 *
 * This is the one place the app looks a Panchangam id up in `content/enums`;
 * every screen goes through it rather than reading `ENUM_FILES` directly, so
 * a script change or a future content-pack swap only touches this file.
 */

export type DisplayScript = 'te' | 'dev' | 'iast';

function label(kind: keyof typeof ENUM_FILES, id: string, script: DisplayScript): string {
  return enumDisplay(enumValue(ENUM_FILES[kind], id), script);
}

export interface AngaBadgeView {
  label: string;
  value: string;
}

export interface TodayView {
  tithi: AngaBadgeView;
  nakshatra: AngaBadgeView;
  ritu: AngaBadgeView;
  masa: AngaBadgeView;
  sunrise: string;
  sunset: string;
  prayerTimings: { id: string; label: string; range: string; start: string; end: string }[];
  inauspicious: { id: string; label: string; range: string }[];
}

/** `HH:mm` in the Panchangam's own timezone, for an ISO instant. */
function clock(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

function range(start: string, end: string, tz: string): string {
  return `${clock(start, tz)} – ${clock(end, tz)}`;
}

const PRAYER_LABELS: Record<string, { en: string; te: string }> = Object.fromEntries(
  TIMINGS.timings.map((t) => [t.id, { en: t.en, te: t.te }]),
);

/**
 * The Today screen's view of a day's Panchangam: four anga badges, sun times,
 * the prayer schedule and the inauspicious windows, all pre-formatted for the
 * devotee's script and timezone.
 *
 * Takes `script` and `uiLang` separately because they answer different
 * questions: `script` picks which alphabet a *ritual* value (a nakshatra
 * name) renders in, `uiLang` picks the language of an everyday *label*
 * ("Morning" vs. "ఉదయం") — a devotee can read Telugu ritual names while
 * keeping an English interface, and often does.
 */
export function toTodayView(
  data: PanchangamData,
  script: DisplayScript,
  uiLang: 'en' | 'te' = 'en',
): TodayView {
  const badge = (kind: 'tithi' | 'nakshatra' | 'ruthu' | 'masa', id: string): AngaBadgeView => ({
    label: kind === 'ruthu' ? 'Ruthuvu' : kind[0]!.toUpperCase() + kind.slice(1),
    value: label(kind === 'ruthu' ? 'ruthu' : kind, id, script),
  });

  return {
    tithi: badge('tithi', data.tithi.id),
    nakshatra: badge('nakshatra', data.nakshatra.id),
    ritu: badge('ruthu', data.ritu),
    masa: badge('masa', data.masa.id),
    sunrise: clock(data.sunrise, data.tz),
    sunset: clock(data.sunset, data.tz),
    prayerTimings: data.prayerTimings.map((timing) => ({
      id: timing.id,
      label:
        (uiLang === 'te' ? PRAYER_LABELS[timing.id]?.te : PRAYER_LABELS[timing.id]?.en) ??
        timing.id,
      range: range(timing.start, timing.end, data.tz),
      start: timing.start,
      end: timing.end,
    })),
    inauspicious: [
      {
        id: 'rahu',
        label: 'Rahu Kalam',
        range: range(data.rahuKalam[0], data.rahuKalam[1], data.tz),
      },
      {
        id: 'yamagandam',
        label: 'Yamagandam',
        range: range(data.yamagandam[0], data.yamagandam[1], data.tz),
      },
      {
        id: 'gulika',
        label: 'Gulika Kalam',
        range: range(data.gulikaKalam[0], data.gulikaKalam[1], data.tz),
      },
    ],
  };
}

export interface FullPanchangamView extends TodayView {
  samvatsara: string;
  ayana: string;
  paksha: string;
  yoga: AngaBadgeView;
  karana: AngaBadgeView;
  vasara: string;
  adhika: boolean;
}

const PAKSHA_LABEL: Record<PanchangamData['paksha'], string> = {
  shukla: 'Shukla Paksha',
  krishna: 'Krishna Paksha',
};

const AYANA_LABEL: Record<PanchangamData['ayana'], string> = {
  uttarayana: 'Uttarayanam',
  dakshinayana: 'Dakshinayanam',
};

/**
 * Everything the full-Panchangam bottom sheet shows (§8.2: "all angas with
 * end times, samvatsaram, ayanam, paksham, yogam, karanam" plus the three
 * inauspicious windows already in `TodayView`).
 */
export function toFullPanchangamView(
  data: PanchangamData,
  script: DisplayScript,
): FullPanchangamView {
  return {
    ...toTodayView(data, script),
    samvatsara: label('samvatsara', data.samvatsara.id, script),
    ayana: AYANA_LABEL[data.ayana],
    paksha: PAKSHA_LABEL[data.paksha],
    yoga: { label: 'Yoga', value: label('yoga', data.yoga.id, script) },
    karana: { label: 'Karana', value: label('karana', data.karana.id, script) },
    vasara: label('vasara', data.vasara.id, script),
    adhika: data.masa.adhika,
  };
}
