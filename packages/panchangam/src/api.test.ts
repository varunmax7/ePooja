import { describe, expect, it } from 'vitest';
import * as api from './index';

/**
 * The package's public surface. App code (Phase 3), the Sankalpam builder
 * (Phase 5) and the notification scheduler (Phase 9) all consume this barrel,
 * so removing an export is a breaking change and should fail here first.
 */
describe('public API', () => {
  it('exports the four entry points §10 Phase 2 names', () => {
    expect(typeof api.getPanchangam).toBe('function');
    expect(typeof api.getDayPanchangam).toBe('function');
    expect(typeof api.findTransitions).toBe('function');
    expect(typeof api.getMonth).toBe('function');
  });

  it('exports the enumerations the content packs mirror', () => {
    expect(api.SAMVATSARA_IDS).toHaveLength(60);
    expect(api.NAKSHATRA_IDS).toHaveLength(27);
    expect(api.YOGA_IDS).toHaveLength(27);
    expect(api.KARANA_IDS).toHaveLength(11);
    expect(api.MASA_IDS).toHaveLength(12);
    expect(api.RITU_IDS).toHaveLength(6);
    expect(api.VASARA_IDS).toHaveLength(7);
  });

  it('declares Lahiri as the ayanamsa (§3.4: no Swiss Ephemeris)', () => {
    expect(api.PANCHANGAM_PACKAGE.ayanamsa).toBe('lahiri');
    expect(api.PANCHANGAM_PACKAGE.name).toBe('@epooja/panchangam');
  });

  it('exports the kalam tables so the UI can label them', () => {
    expect(api.RAHU_SEGMENTS).toHaveLength(7);
    expect(api.YAMA_SEGMENTS).toHaveLength(7);
    expect(api.GULIKA_SEGMENTS).toHaveLength(7);
  });

  it('exports the error the UI has to handle', () => {
    expect(api.NoSunriseError.prototype).toBeInstanceOf(Error);
  });
});
