import { CITIES } from '@/services/location/cities';
import { resolveFromCity, resolveFromCoords } from '@/services/location/resolve';

describe('resolveFromCoords', () => {
  it('labels a fix inside a listed city with that city', () => {
    const location = resolveFromCoords(CITIES, { lat: 17.41, lng: 78.47 });

    expect(location.cityId).toBe('hyderabad');
    expect(location.label).toBe('Hyderabad, Telangana');
    expect(location.tz).toBe('Asia/Kolkata');
  });

  it("gives an NRI location its own timezone, not the nearest city's", () => {
    // Way off the coast, closest by list to San Francisco but not tz-adjacent.
    const location = resolveFromCoords(CITIES, { lat: 37.7749, lng: -122.4194 });
    expect(location.tz).toBe('America/Los_Angeles');
  });

  it('says "near" a city rather than claiming to be in it, once too far away', () => {
    // Rural Telangana, well outside any listed city radius.
    const location = resolveFromCoords(CITIES, { lat: 18.2, lng: 79.3 });

    expect(location.cityId).toBeUndefined();
    expect(location.label).toMatch(/^Near /);
    expect(location.tz).toBe('Asia/Kolkata');
  });

  it('still says "near" the closest listing however far off it is', () => {
    // Mid-Pacific: the nearest listed city is thousands of km away, but the
    // list spans the whole globe, so `nearestCity` always finds one.
    const location = resolveFromCoords(CITIES, { lat: 10, lng: -160 });
    expect(location.label).toMatch(/^Near /);
    expect(location.tz.length).toBeGreaterThan(0);
  });

  it('falls back to raw coordinates when there is no city list at all', () => {
    const location = resolveFromCoords([], { lat: 17.41, lng: 78.47 });
    expect(location.cityId).toBeUndefined();
    expect(location.label).toBe('17.41, 78.47');
    expect(location.tz).toBe('Asia/Kolkata');
  });
});

describe('resolveFromCity', () => {
  it('turns a manually chosen city straight into a DevoteeLocation', () => {
    const dallas = CITIES.find((c) => c.id === 'dallas-tx');
    if (!dallas) throw new Error('fixture city missing');

    expect(resolveFromCity(dallas)).toEqual({
      lat: dallas.lat,
      lng: dallas.lng,
      tz: 'America/Chicago',
      cityId: 'dallas-tx',
      label: 'Dallas, Texas',
    });
  });
});
