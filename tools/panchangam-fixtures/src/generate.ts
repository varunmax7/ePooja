/**
 * Builds the regression half of the golden fixture set (§9.1).
 *
 * IMPORTANT: everything this script writes is marked `engine-snapshot`. A
 * snapshot is the engine's own output — it locks in today's behaviour so a
 * refactor cannot silently change it, but it is NOT evidence that the values
 * are right. Promoting a fixture to `verified` is a human act: check the row
 * against a reference panchangam, replace the values it got wrong, set
 * `source: "verified"` and name the `reference`.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDayPanchangam } from '@epooja/panchangam';
import { PLACES, type Fixture, type FixtureFile, type FixturePlace } from './types.js';

const OUTPUT = join(
  import.meta.dirname,
  '../../../packages/panchangam/test/fixtures/snapshots.json',
);

function localTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function snapshot(place: FixturePlace, date: string, why: string): Fixture {
  const day = getDayPanchangam(date, place);

  return {
    id: `${place.id}-${date}`,
    place,
    date,
    source: 'engine-snapshot',
    why,
    expect: {
      samvatsara: day.samvatsara,
      ayana: day.ayana,
      ritu: day.ritu,
      masa: day.masa,
      paksha: day.paksha,
      tithi: { id: day.tithi.id, index: day.tithi.index },
      nakshatra: {
        id: day.nakshatra.id,
        index: day.nakshatra.index,
        pada: day.nakshatra.pada,
      },
      yoga: { id: day.yoga.id, index: day.yoga.index },
      karana: { id: day.karana.id, index: day.karana.index },
      vasara: day.vasara,
      sunrise: localTime(day.sunrise, place.tz),
      sunset: localTime(day.sunset, place.tz),
      rahuKalam: [localTime(day.rahuKalam[0], place.tz), localTime(day.rahuKalam[1], place.tz)],
      tithiEndsAt: day.tithi.endsAt,
      nakshatraEndsAt: day.nakshatra.endsAt,
    },
  };
}

function datesBetween(from: string, days: number, step = 1): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  for (let i = 0; i < days; i += step) {
    out.push(new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

function build(): Fixture[] {
  const fixtures: Fixture[] = [];

  // Fourteen consecutive days in three Telugu cities (§9.1).
  for (const place of [PLACES.hyderabad!, PLACES.vijayawada!, PLACES.tirupati!]) {
    for (const date of datesBetween('2026-09-14', 14)) {
      fixtures.push(snapshot(place, date, 'Fourteen consecutive days in a Telugu city'));
    }
  }

  // The adhika masa year (§9.1): Adhika Shravana ran 18 Jul – 16 Aug 2023.
  for (const date of [
    '2023-07-17',
    '2023-07-18',
    '2023-08-01',
    '2023-08-15',
    '2023-08-16',
    '2023-08-17',
  ]) {
    fixtures.push(snapshot(PLACES.hyderabad!, date, 'Adhika Shravana 2023 boundary'));
  }

  // Month boundaries: Ugadi (year and masa roll over together).
  for (const date of [
    '2024-04-08',
    '2024-04-09',
    '2025-03-29',
    '2025-03-30',
    '2026-03-19',
    '2026-03-20',
  ]) {
    fixtures.push(snapshot(PLACES.hyderabad!, date, 'Ugadi — samvatsara and masa roll over'));
  }

  // Sankranti days, where ayana and the solar rasi change.
  for (const date of ['2026-01-14', '2026-01-15', '2026-07-16', '2026-07-17']) {
    fixtures.push(snapshot(PLACES.vijayawada!, date, 'Sankranti — ayana boundary'));
  }

  // NRI locations, including both DST switches in each zone.
  const nriDates: Record<string, string[]> = {
    newJersey: ['2026-03-07', '2026-03-08', '2026-10-31', '2026-11-01'],
    dallas: ['2026-03-08', '2026-11-01'],
    london: ['2026-03-28', '2026-03-29', '2026-10-24', '2026-10-25'],
    sydney: ['2026-04-04', '2026-04-05', '2026-10-03', '2026-10-04'],
    dubai: ['2026-06-21', '2026-12-21'],
  };
  for (const [placeId, dates] of Object.entries(nriDates)) {
    const place = PLACES[placeId];
    if (!place) throw new Error(`Unknown place ${placeId}`);
    for (const date of dates) {
      fixtures.push(snapshot(place, date, 'NRI location — DST switch or solstice'));
    }
  }

  // Visakhapatnam across a full moon and a new moon.
  for (const date of ['2026-09-11', '2026-09-26', '2026-10-10']) {
    fixtures.push(snapshot(PLACES.visakhapatnam!, date, 'Amavasya / Pournami day'));
  }

  return fixtures;
}

const fixtures = build();
const file: FixtureFile = {
  note:
    'Engine snapshots, NOT verified values. They lock in current behaviour so refactors cannot ' +
    'change it silently. Phase 2 acceptance needs ≥ 60 fixtures verified against a reference ' +
    'panchangam — see content/REVIEW_QUEUE.md.',
  tolerances: { sunriseMinutes: 1, transitionMinutes: 2 },
  fixtures,
};

writeFileSync(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
console.log(`Wrote ${fixtures.length} snapshot fixtures to ${OUTPUT}`);
