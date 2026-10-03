import type { Devotee } from '@epooja/content';
import type { PanchangamData } from '@epooja/panchangam';
import { buildDevoteeSankalpam } from '@/services/sankalpam';

/**
 * §10 Phase 5: the "Preview Sankalpam" card renders live, so the wrapper
 * that feeds it (`buildDevoteeSankalpam`) is tested against a real,
 * complete devotee + a real `getDayPanchangam` shape — proving the id
 * mapping into `@epooja/sankalpam`'s input lines up, not just that the
 * package itself works (already covered in `@epooja/sankalpam`'s own
 * fixture tests).
 */

const DEVOTEE: Devotee = {
  id: 'd1',
  name: { te: 'రాముడు', en: 'Ramudu' },
  gender: 'male',
  gotraCustom: 'భరద్వాజ',
  family: [],
  location: {
    lat: 17.385,
    lng: 78.4867,
    tz: 'Asia/Kolkata',
    cityId: 'hyderabad',
    label: 'Hyderabad, Telangana',
    countryCode: 'IN',
  },
  prefs: { uiLang: 'en', mantraScript: 'te', showTransliteration: true, nameAudio: 'self_recite' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const PANCHANGAM: PanchangamData = {
  date: '2026-01-01',
  tz: 'Asia/Kolkata',
  lat: 17.385,
  lng: 78.4867,
  computedFor: '2026-01-01T06:30:00.000Z',
  samvatsara: { id: 'vishvavasu', index: 39 },
  ayana: 'dakshinayana',
  ritu: 'sharad',
  masa: { id: 'ashvayuja', adhika: false },
  paksha: 'shukla',
  tithi: {
    id: 'shukla_10',
    index: 10,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-01-02T00:00:00.000Z',
  },
  nakshatra: {
    id: 'rohini',
    index: 4,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-01-02T00:00:00.000Z',
    pada: 1,
  },
  yoga: {
    id: 'siddhi',
    index: 16,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-01-02T00:00:00.000Z',
  },
  karana: {
    id: 'bava',
    index: 2,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-01-01T12:00:00.000Z',
  },
  vasara: { id: 'bhanu', weekday: 0 },
  sunrise: '2026-01-01T00:40:00.000Z',
  sunset: '2026-01-01T12:30:00.000Z',
  rahuKalam: ['2026-01-01T03:00:00.000Z', '2026-01-01T04:30:00.000Z'],
  yamagandam: ['2026-01-01T05:00:00.000Z', '2026-01-01T06:30:00.000Z'],
  gulikaKalam: ['2026-01-01T07:00:00.000Z', '2026-01-01T08:30:00.000Z'],
  prayerTimings: [],
};

describe('buildDevoteeSankalpam', () => {
  it("builds the full Sankalpam text from the devotee's record and today's Panchangam", () => {
    const text = buildDevoteeSankalpam(DEVOTEE, PANCHANGAM, 'ganapathi');

    expect(text.te.length).toBeGreaterThan(50);
    expect(text.te).toContain('గోత్రోద్భవస్య'); // male suffix
    expect(text.te).toContain('భరద్వాజ'); // self-recited custom gotra
    expect(text.te).toContain('గణపతి'); // deity
    expect(text.te).not.toContain('⟨MISSING');
  });

  it('falls back to the fallback GEO region for a devotee with no country on file yet', () => {
    const devotee: Devotee = {
      ...DEVOTEE,
      location: { ...DEVOTEE.location, countryCode: undefined },
    };
    const text = buildDevoteeSankalpam(devotee, PANCHANGAM, 'ganapathi');
    expect(text.te).toContain('⟨TODO_PANDIT: geo_generic_nri_dvipa_te⟩');
  });

  it("renders ⟨MISSING:GOTRA⟩ for a devotee who skipped gotra entirely (§8.1 'I don't know')", () => {
    const devotee: Devotee = { ...DEVOTEE, gotraId: undefined, gotraCustom: undefined };
    const text = buildDevoteeSankalpam(devotee, PANCHANGAM, 'ganapathi');
    expect(text.te).toContain('⟨MISSING:GOTRA⟩');
  });
});
