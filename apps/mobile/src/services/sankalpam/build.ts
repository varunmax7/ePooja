import type { Devotee } from '@epooja/content';
import { buildSankalpamText, type SankalpamInput, type SankalpamText } from '@epooja/sankalpam';
import type { PanchangamData } from '@epooja/panchangam';
import { SANKALPAM_CONTENT } from './content';

/**
 * Turns the devotee's own record plus a computed `PanchangamData` into the
 * §9.3 Sankalpam, for the "Preview Sankalpam" card on Profile (§10 Phase 5).
 *
 * Returns `null` only when the devotee has no location yet (onboarding
 * incomplete) — everything else a devotee can leave blank (gotra,
 * nakshatra…) is the engine's own `⟨MISSING:slot⟩` business, not this
 * wrapper's.
 */
export function buildDevoteeSankalpam(
  devotee: Devotee,
  panchangam: PanchangamData,
  deity: string,
): SankalpamText {
  const input: SankalpamInput = {
    devotee: {
      name: devotee.name,
      gender: devotee.gender,
      gotraId: devotee.gotraId,
      gotraCustom: devotee.gotraCustom,
      family: devotee.family,
    },
    panchangam: {
      samvatsaraId: panchangam.samvatsara.id,
      ayana: panchangam.ayana,
      rituId: panchangam.ritu,
      masaId: panchangam.masa.id,
      paksha: panchangam.paksha,
      tithiId: panchangam.tithi.id,
      vasaraId: panchangam.vasara.id,
      nakshatraId: panchangam.nakshatra.id,
      yogaId: panchangam.yoga.id,
      karanaId: panchangam.karana.id,
    },
    location: {
      lat: devotee.location.lat,
      lng: devotee.location.lng,
      // No country on file yet (an unmatched GPS fix with no nearby listed
      // city): the GEO resolver's own fallback region applies, same as any
      // other unlisted country — never a guess made here.
      countryCode: devotee.location.countryCode ?? '',
      riverRegionOverride: devotee.location.geoRegionId,
    },
    deity,
  };

  return buildSankalpamText(input, SANKALPAM_CONTENT);
}
