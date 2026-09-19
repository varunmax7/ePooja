# ADR 0002 — Panchangam engine: ayanamsa, sunrise convention, time basis

- **Status:** Accepted
- **Date:** 2026-09-19
- **Phase:** 2
- **Supersedes:** nothing
- **Required by:** §10 Phase 2 Gate

## Context

Every screen in the app and every variable in the Sankalpam comes out of this
engine, so the conventions it picks are visible to the devotee. §9.1 fixes most
of them; this ADR records the ones it left open and the places the
implementation had to make a call.

## Decisions

### 1. Ayanamsa: Lahiri, linear model

`lahiriAyanamsa(jd) = 23.85306° + (jd − 2451545.0) / 365.25 × 50.2791″`

as §9.1 specifies, giving ≈24.20° for 2026. This is a pure function of Julian
Day with no ephemeris dependency, which keeps the engine offline and fast.

§9.1 allows replacing it with a precession-based model "if fixtures fail". No
fixture has failed on it, but no fixture has really tested it either: the
verified fixture set does not yet contain a case where a few arc-seconds of
ayanamsa decide a nakshatra boundary. **Do not read the passing suite as
validation of the ayanamsa.** When the reference-panchangam fixtures land
(§9.1, ≥ 60 verified cases), check them specifically for boundary-straddling
nakshatras; if the linear model drifts past the 30″ tolerance, replace it and
supersede this ADR.

No Swiss Ephemeris, per §3.4 — it is AGPL/commercial dual-licensed.

### 2. Apparent, of-date longitudes

Sun from `SunPosition` and Moon from `EclipticGeoMoon`: both apparent,
geocentric, true-ecliptic-of-date, as §9.1 requires.

This differs slightly from astronomy-engine's own `MoonPhase` /
`SearchMoonPhase`, which use geometric J2000 vectors with aberration off. The
gap is ~20″ of solar aberration ≈ **45 seconds of time** at a tithi boundary.
That is inside the ±2 min §9.1 allows for transition times, and the
cross-validation tests in `transitions.test.ts` assert exactly that — they use
the phase search as an independent oracle while allowing for the definitional
difference.

### 3. Sunrise convention

`SearchRiseSet` with its defaults: **upper limb, standard refraction**, at the
observer's coordinates. `GeoLocation.altitudeMeters` is passed as the
observer's elevation, not as a horizon-dip correction, so elevation moves
sunrise by seconds rather than minutes. A hill-town dip correction is out of
scope for v1; if a pandit disputes a sunrise for a high-altitude city, that is
the thing to revisit.

Where the Sun neither rises nor sets — above the Arctic circle in summer, which
a devotee in Tromsø or Anchorage can genuinely hit — the engine throws
`NoSunriseError` rather than inventing a day. Phase 3 has to handle it in the
UI (the likely answer: offer a reference location, as traditional practice does
for high latitudes).

### 4. Time basis: the Hindu day runs sunrise to sunrise

Per §3.7. Two consequences the code makes explicit:

- **Vasaram** is the weekday of the _most recent sunrise_. At 04:30 local, the
  vasara is still yesterday's — the engine returns `sthira` (Saturday) for an
  instant that a phone's clock calls Sunday.
- `getDayPanchangam(date, loc)` defaults to `basis: 'sunrise'` — the values
  prevailing at sunrise, which is what a printed panchangam shows. A puja that
  starts in the evening passes `basis: 'instant'`, which is what the Sankalpam
  needs. The default is the conservative one because the Today screen is the
  main consumer.

### 5. Masa, adhika and the samvatsara year

Amanta (Chandramana), per §9.1: the Sun's sidereal rashi at the opening new
moon names the month; if it has not changed by the next new moon, the month is
**adhika**. Verified against Adhika Shravana 2023 (17 Jul – 16 Aug), including
the boundary behaviour — the adhika month still holds at sunrise on its last
day, and nija Shravana's first sunrise is 17 August.

The samvatsara year opens at Chaitra Shukla Pratipada. Where an **adhika
Chaitra** occurs, `currentYearStart` takes the _first_ Chaitra (the adhika one)
as the year's opening. This is a convention choice — it is rare enough that a
pandit should confirm it before the first release that spans one.

### 6. Prayer timings: fifths of daylight

§9.4 requires `prayerTimings` with ids `morning`, `midday` and `evening`, but
§9.1 does not define them. The engine splits daylight into the five traditional
parts (pratah, sangava, madhyahna, aparahna, sayahna) and surfaces the first,
third and fifth. This is a reasonable reading, not an authority — flag it in
the pandit review along with the content.

### 7. Festival dates are not panchangam data

A discovered edge case worth recording: in 2026, Chaitra Shukla Pratipada runs
19 Mar 06:53 → 20 Mar 04:52 IST and so prevails at **neither** day's sunrise.
The engine correctly reports Amavasya at sunrise on the 19th and Shukla Dvitiya
on the 20th. Published calendars put Ugadi on 19 March, applying the kshaya
tithi rule (observe on the day the tithi begins).

That rule is _festival_ logic, not panchangam logic, and is not implemented
here. Phase 9 (festival reminders) and any festival puja in v1.x must implement
it rather than assuming "tithi at sunrise" picks the right day. The samvatsara
calculation is unaffected — it keys off the new moon instant, not the observed
Ugadi date.

## Deviations from the plan

1. **Benchmarks are not Vitest `bench`.** §10 Phase 2 asks for "Benchmarks in
   Vitest (`bench`)"; Vitest 5 no longer exports a `bench` API. `pnpm bench`
   runs a standalone harness (`bench/panchangam.bench.ts`) that prints
   mean/p95 and fails if a budgeted path exceeds 10 ms, and
   `src/performance.test.ts` asserts the §9.1 20 ms budget inside the normal
   suite so CI catches regressions.
2. **`PanchangamData` lives in `@epooja/panchangam`, not `@epooja/content`.**
   §9.4 lists the type under `packages/content/src/types.ts`. Putting it there
   would make the engine depend on the content package (or duplicate the type).
   The engine owns it; Phase 4's content package re-exports it.

## Measured behaviour (Node, M-series Mac)

| path                          | mean    | p95     |
| ----------------------------- | ------- | ------- |
| `getPanchangam` (cold)        | 1.51 ms | 1.70 ms |
| `getDayPanchangam` (cold)     | 1.49 ms | 1.57 ms |
| `getDayPanchangam` (memoized) | ~0 ms   | ~0 ms   |
| `getMonth` (30 days, cold)    | 44.7 ms | 45.1 ms |

The §9.1 budget is 20 ms on a mid-range Android; Node is the proxy until
Phase 3 measures on device. The margin is large, so the month view should stay
comfortable even at a 10× device penalty.

## Consequences

- The engine is pure and offline: no network, no clock reads, no locale lookups
  beyond the IANA zone passed in. It memoizes per date, per location rounded to
  0.01°, capped at 256 entries.
- `content/enums/*.json` must keep the same ids, in the same order, as the
  engine's enumerations. `src/enum-alignment.test.ts` enforces it — that seam
  is where the Sankalpam resolves each value's audio token.
- Correctness evidence is split in two on purpose: `test/fixtures/verified.json`
  (independent authority) and `test/fixtures/snapshots.json` (regression guard
  only). The Phase 2 acceptance bar of ≥ 60 **verified** cases is **not yet
  met** — see `content/REVIEW_QUEUE.md`.
