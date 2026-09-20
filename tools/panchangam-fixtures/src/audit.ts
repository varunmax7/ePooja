/**
 * Reports how close the fixture set is to the §9.1 acceptance bar:
 * ≥ 60 cases **verified** against a reference panchangam.
 *
 * Run it before claiming Phase 2 is done: a green test suite only means the
 * engine still behaves as it did, not that a pandit or an almanac agrees.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FixtureFile } from './types';

const FIXTURE_DIR = join(import.meta.dirname, '../../../packages/panchangam/test/fixtures');
const REQUIRED_VERIFIED = 60;

function load(file: string): FixtureFile {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8')) as FixtureFile;
}

const verified = load('verified.json');
const snapshots = load('snapshots.json');
const all = [...verified.fixtures, ...snapshots.fixtures];

const byPlace = new Map<string, number>();
const byYear = new Map<string, number>();
for (const fixture of all) {
  byPlace.set(fixture.place.id, (byPlace.get(fixture.place.id) ?? 0) + 1);
  const year = fixture.date.slice(0, 4);
  byYear.set(year, (byYear.get(year) ?? 0) + 1);
}

const verifiedCount = verified.fixtures.length;
const shortfall = Math.max(0, REQUIRED_VERIFIED - verifiedCount);

console.log('Panchangam fixture audit (§9.1)\n');
console.log(`  total cases       ${all.length}`);
console.log(`  verified          ${verifiedCount}`);
console.log(`  engine snapshots  ${snapshots.fixtures.length}`);
console.log(`  places            ${byPlace.size} (${[...byPlace.keys()].join(', ')})`);
console.log(`  years             ${[...byYear.keys()].sort().join(', ')}`);
console.log('');

if (shortfall > 0) {
  console.log(
    `  ✗ ${shortfall} more verified cases needed to meet the §9.1 bar of ${REQUIRED_VERIFIED}.`,
  );
  console.log('    Verifying one case means: look the day up in a reference panchangam for that');
  console.log('    city, correct any value the engine got wrong, then set source: "verified"');
  console.log('    and name the reference.');
  process.exitCode = 1;
} else {
  console.log(`  ✓ ${verifiedCount} verified cases meet the §9.1 bar.`);
}
