import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  distanceKm,
  nearestCity,
  parseCityFile,
  searchCities,
  type City,
} from './cities';

const CONTENT_DIR = join(import.meta.dirname, '../../../content');

const file = parseCityFile(
  JSON.parse(readFileSync(join(CONTENT_DIR, 'cities.json'), 'utf8')) as unknown,
);
const cities = file.cities;

/** A zone's UTC offset in hours, handling the half- and quarter-hour zones. */
function utcOffsetHours(tz: string, at = new Date('2026-01-15T12:00:00Z')): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value;
  if (name === undefined) throw new Error(`No offset for ${tz}`);
  if (name === 'GMT') return 0;

  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
  if (!match) throw new Error(`Unparsed offset ${name} for ${tz}`);

  const [, sign, hours, minutes] = match;
  const magnitude = Number(hours) + Number(minutes) / 60;
  return sign === '-' ? -magnitude : magnitude;
}

function byId(id: string): City {
  const city = cities.find((c) => c.id === id);
  if (!city) throw new Error(`No city ${id} in content/cities.json`);
  return city;
}

describe('content/cities.json', () => {
  it('parses, and is still pending a native speaker', () => {
    expect(cities.length).toBeGreaterThan(100);
    expect(file.review.status).toBe('PENDING_PANDIT_REVIEW');
  });

  it('carries the places §9.1 names in its fixtures', () => {
    for (const id of ['hyderabad', 'vijayawada', 'tirupati', 'visakhapatnam', 'dubai']) {
      expect(byId(id), id).toBeTruthy();
    }
    // New Jersey, Dallas, London and Sydney by region/name rather than by id.
    expect(cities.some((c) => c.region === 'New Jersey')).toBe(true);
    expect(byId('dallas-tx').tz).toBe('America/Chicago');
    expect(byId('london').tz).toBe('Europe/London');
    expect(byId('sydney').tz).toBe('Australia/Sydney');
  });

  it('gives every Telugu-district city a Telugu name, and invents none elsewhere', () => {
    const telugu = cities.filter((c) => c.region === 'Telangana' || c.region === 'Andhra Pradesh');
    expect(telugu.length).toBeGreaterThan(40);
    expect(telugu.every((c) => c.nameTe !== undefined)).toBe(true);

    const elsewhere = cities.filter(
      (c) => c.region !== 'Telangana' && c.region !== 'Andhra Pradesh',
    );
    expect(elsewhere.every((c) => c.nameTe === undefined)).toBe(true);
  });

  it('puts every city in a plausible place', () => {
    // A coordinate/timezone mismatch is the failure that silently shifts every
    // sunrise on that screen, so check the two agree to within three hours of
    // solar time — enough slack for wide zones like Asia/Shanghai, tight
    // enough to catch a swapped sign or a copied-down wrong zone.
    for (const city of cities) {
      const solarHours = city.lng / 15;
      expect(
        Math.abs(solarHours - utcOffsetHours(city.tz)),
        `${city.id} (${city.tz})`,
      ).toBeLessThan(3);
    }
  });
});

describe('distanceKm', () => {
  it('is zero for a point against itself', () => {
    expect(distanceKm(byId('hyderabad'), byId('hyderabad'))).toBe(0);
  });

  it('matches known separations to within a percent', () => {
    // Hyderabad–Vijayawada is about 250 km great-circle (the ~270 km everyone
    // quotes is the road).
    expect(distanceKm(byId('hyderabad'), byId('vijayawada'))).toBeGreaterThan(245);
    expect(distanceKm(byId('hyderabad'), byId('vijayawada'))).toBeLessThan(255);
    // Hyderabad–London is about 7720 km great-circle.
    expect(distanceKm(byId('hyderabad'), byId('london'))).toBeGreaterThan(7650);
    expect(distanceKm(byId('hyderabad'), byId('london'))).toBeLessThan(7800);
  });

  it('measures across the antimeridian the short way', () => {
    const west = { lat: 0, lng: -179.5 };
    const east = { lat: 0, lng: 179.5 };
    expect(distanceKm(west, east)).toBeLessThan(120);
  });
});

describe('nearestCity', () => {
  it('finds the city a devotee is standing in', () => {
    const match = nearestCity(cities, { lat: 17.41, lng: 78.47 });
    expect(match?.city.id).toBe('hyderabad');
    expect(match?.distanceKm).toBeLessThan(10);
  });

  it('reports how far the nearest listing is, for a place not on the list', () => {
    // Somewhere in rural Telangana, between Warangal and Karimnagar.
    const match = nearestCity(cities, { lat: 18.2, lng: 79.3 });
    expect(match).not.toBeNull();
    expect(match?.distanceKm).toBeGreaterThan(20);
  });

  it('does not jump hemispheres', () => {
    expect(nearestCity(cities, { lat: -33.9, lng: 151.2 })?.city.id).toBe('sydney');
  });

  it('returns null for an empty list rather than guessing', () => {
    expect(nearestCity([], { lat: 0, lng: 0 })).toBeNull();
  });
});

describe('searchCities', () => {
  it('finds a city by a prefix of its name', () => {
    expect(searchCities(cities, 'vij')[0]?.id).toBe('vijayawada');
    expect(searchCities(cities, 'hyd')[0]?.id).toBe('hyderabad');
  });

  it('finds a city by its Telugu name', () => {
    expect(searchCities(cities, 'విజయవాడ')[0]?.id).toBe('vijayawada');
    expect(searchCities(cities, 'హైదరాబాద్')[0]?.id).toBe('hyderabad');
  });

  it('finds a city by its region, for a devotee who knows the state not the town', () => {
    const results = searchCities(cities, 'new jersey');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => c.region === 'New Jersey')).toBe(true);
  });

  it('ranks an exact name above a city that merely starts with it', () => {
    expect(searchCities(cities, 'delhi')[0]?.id).toBe('delhi');
  });

  it('ignores case and returns nothing for an empty query', () => {
    expect(searchCities(cities, 'HYDERABAD')[0]?.id).toBe('hyderabad');
    expect(searchCities(cities, '   ')).toEqual([]);
  });

  it('honours the limit', () => {
    expect(searchCities(cities, 'a', 5).length).toBeLessThanOrEqual(5);
  });
});
