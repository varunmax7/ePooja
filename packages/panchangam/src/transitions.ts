import { KARANA_ARC, NAKSHATRA_ARC, TITHI_ARC, YOGA_ARC, karanaFromHalfIndex } from './angas';
import { moonSiderealLongitude, moonSunElongation, sunSiderealLongitude } from './astronomy';
import { addDays, bisect, deltaAngle, norm360 } from './math';
import type { AngaKind, AngaSpan } from './types';

/**
 * Every anga is a slice of one monotonically increasing angle, so one
 * bracket-and-bisect routine finds all their boundaries (§9.1).
 */
interface AngaDefinition {
  /** The angle whose progress defines the anga, in degrees. */
  progress: (instant: Date) => number;
  /** Width of one anga in degrees. */
  arc: number;
  /** Number of angas in a full turn. */
  count: number;
  /** Stable id for an index (1-based). */
  idFor: (index: number) => string;
}

export const NAKSHATRA_IDS = [
  'ashvini',
  'bharani',
  'krittika',
  'rohini',
  'mrigashira',
  'ardra',
  'punarvasu',
  'pushyami',
  'ashlesha',
  'makha',
  'pubba',
  'uttara',
  'hasta',
  'chitta',
  'svati',
  'vishakha',
  'anuradha',
  'jyeshtha',
  'mula',
  'purvashadha',
  'uttarashadha',
  'shravanam',
  'dhanishta',
  'shatabhisham',
  'purvabhadra',
  'uttarabhadra',
  'revati',
] as const;

export const YOGA_IDS = [
  'vishkambha',
  'priti',
  'ayushman',
  'saubhagya',
  'shobhana',
  'atiganda',
  'sukarma',
  'dhriti',
  'shula',
  'ganda',
  'vriddhi',
  'dhruva',
  'vyaghata',
  'harshana',
  'vajra',
  'siddhi',
  'vyatipata',
  'variyan',
  'parigha',
  'shiva',
  'siddha',
  'sadhya',
  'shubha',
  'shukla',
  'brahma',
  'indra',
  'vaidhriti',
] as const;

/** Tithi ids are positional: 1–15 shukla, 16–30 krishna (§9.1). */
export function tithiId(index: number): string {
  const withinPaksha = index <= 15 ? index : index - 15;
  const paksha = index <= 15 ? 'shukla' : 'krishna';
  if (index === 15) return 'pournami';
  if (index === 30) return 'amavasya';
  return `${paksha}_${withinPaksha}`;
}

function indexedId(ids: readonly string[], index: number): string {
  const id = ids[index - 1];
  /* c8 ignore next -- index is always within range for its anga */
  if (!id) throw new Error(`Unreachable anga index ${index}`);
  return id;
}

const DEFINITIONS: Record<AngaKind, AngaDefinition> = {
  tithi: {
    progress: moonSunElongation,
    arc: TITHI_ARC,
    count: 30,
    idFor: tithiId,
  },
  nakshatra: {
    progress: moonSiderealLongitude,
    arc: NAKSHATRA_ARC,
    count: 27,
    idFor: (index) => indexedId(NAKSHATRA_IDS, index),
  },
  yoga: {
    progress: (instant) => norm360(sunSiderealLongitude(instant) + moonSiderealLongitude(instant)),
    arc: YOGA_ARC,
    count: 27,
    idFor: (index) => indexedId(YOGA_IDS, index),
  },
  karana: {
    progress: moonSunElongation,
    arc: KARANA_ARC,
    count: 60,
    idFor: (index) => karanaFromHalfIndex(index - 1).id,
  },
};

/**
 * Instant at which `progress` reaches `targetDegrees`, searched away from
 * `anchor` in `direction` (§9.1: bracket, then bisect to 30 s).
 */
function findCrossing(
  progress: (instant: Date) => number,
  targetDegrees: number,
  anchor: Date,
  direction: -1 | 1,
  maxDays = 4,
): Date {
  const f = (t: Date): number => deltaAngle(progress(t), targetDegrees);
  const anchorSign = Math.sign(f(anchor));

  for (let span = 0.25; span <= maxDays; span *= 2) {
    const other = addDays(anchor, direction * span);
    if (Math.sign(f(other)) !== anchorSign) {
      return direction === -1 ? bisect(f, other, anchor) : bisect(f, anchor, other);
    }
  }

  /* c8 ignore next 2 -- no anga is wider than four days */
  throw new Error(`No ${direction === -1 ? 'start' : 'end'} found near ${anchor.toISOString()}`);
}

/** The anga of `kind` prevailing at `instant`, with its start and end. */
export function angaAt(kind: AngaKind, instant: Date): AngaSpan {
  const def = DEFINITIONS[kind];
  const value = def.progress(instant);
  const ordinal = Math.floor(value / def.arc);
  const index = ordinal + 1;

  const startsAt = findCrossing(def.progress, ordinal * def.arc, instant, -1);
  const endsAt = findCrossing(def.progress, ((ordinal + 1) % def.count) * def.arc, instant, 1);

  return {
    id: def.idFor(index),
    index,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

/**
 * Every anga of `kind` overlapping `[from, to]`, in order (§10 Phase 2 API).
 * Used by the month view and by reminder scheduling.
 */
export function findTransitions(kind: AngaKind, from: Date, to: Date): AngaSpan[] {
  if (to.getTime() <= from.getTime()) return [];

  const spans: AngaSpan[] = [];
  let cursor = from;

  // A tithi never exceeds ~26 h, so the number of steps is bounded by the range.
  for (let guard = 0; guard < 400; guard += 1) {
    const span = angaAt(kind, cursor);
    spans.push(span);

    const end = new Date(span.endsAt);
    if (end.getTime() >= to.getTime()) break;
    cursor = new Date(end.getTime() + 60_000);
  }

  return spans;
}
