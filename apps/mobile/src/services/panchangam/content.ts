import { parseEnumFile, parseTimingFile, type EnumFile, type TimingFile } from '@epooja/content';
import tithi from '@/../../../content/enums/tithi.json';
import nakshatra from '@/../../../content/enums/nakshatra.json';
import yoga from '@/../../../content/enums/yoga.json';
import karana from '@/../../../content/enums/karana.json';
import masa from '@/../../../content/enums/masa.json';
import ruthu from '@/../../../content/enums/ruthu.json';
import vasara from '@/../../../content/enums/vasara.json';
import samvatsara from '@/../../../content/enums/samvatsara.json';
import ayana from '@/../../../content/enums/ayana.json';
import rasi from '@/../../../content/enums/rasi.json';
import gotra from '@/../../../content/enums/gotra.json';
import timingsRaw from '@/../../../content/timings.json';

/**
 * The `content/enums/*.json` files the app needs — the Panchangam angas for
 * Today and Calendar, plus nakshatra/rasi/gotra for the onboarding pickers —
 * parsed once at import time.
 *
 * Bundled rather than fetched: the Panchangam must render with the device in
 * airplane mode (§5, offline-first), and these are the seed enums the app
 * ships with regardless of any content pack Phase 4 downloads later.
 */
export const ENUM_FILES = {
  tithi: parseEnumFile(tithi),
  nakshatra: parseEnumFile(nakshatra),
  yoga: parseEnumFile(yoga),
  karana: parseEnumFile(karana),
  masa: parseEnumFile(masa),
  ruthu: parseEnumFile(ruthu),
  vasara: parseEnumFile(vasara),
  samvatsara: parseEnumFile(samvatsara),
  ayana: parseEnumFile(ayana),
  rasi: parseEnumFile(rasi),
  gotra: parseEnumFile(gotra),
} as const satisfies Record<string, EnumFile>;

export type EnumKind = keyof typeof ENUM_FILES;

/**
 * Display metadata (labels, sandhya names) for the engine's three prayer
 * windows. The *parts* daylight is divided into are the engine's own
 * `DEFAULT_PRAYER_PARTS` — checked against this file in
 * `packages/panchangam/src/prayer-timing-alignment.test.ts` — so this is
 * never passed back into the engine; it only labels what it already computed.
 */
export const TIMINGS: TimingFile = parseTimingFile(timingsRaw);
