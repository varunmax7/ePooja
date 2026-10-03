import {
  parseDeityNamesFile,
  parseEnumFile,
  parseGeoRegionsFile,
  parseSankalpamTemplateFile,
  parseSuffixTableFile,
} from '@epooja/content';
import type { SankalpamContent } from '@epooja/sankalpam';
import { ENUM_FILES } from '@/services/panchangam';
import paksha from '@/../../../content/enums/paksha.json';
import dik from '@/../../../content/enums/dik.json';
import template from '@/../../../content/sankalpam/template.json';
import suffixTables from '@/../../../content/sankalpam/suffix-tables.json';
import geoRegions from '@/../../../content/sankalpam/geo-regions.json';
import deityNames from '@/../../../content/sankalpam/deity-names.json';

/**
 * The `content/sankalpam/*` files, plus the two enums (`paksha`, `dik`) that
 * exist only for the Sankalpam template and so sit outside the Panchangam
 * screens' own `ENUM_FILES` (`@/services/panchangam`) — bundled the same
 * offline-first way (§5): the Sankalpam preview must render in airplane
 * mode exactly like Today does.
 */
export const SANKALPAM_CONTENT: SankalpamContent = {
  template: parseSankalpamTemplateFile(template),
  suffixTables: parseSuffixTableFile(suffixTables),
  geoRegions: parseGeoRegionsFile(geoRegions),
  deityNames: parseDeityNamesFile(deityNames),
  enums: {
    samvatsara: ENUM_FILES.samvatsara,
    ayana: ENUM_FILES.ayana,
    ruthu: ENUM_FILES.ruthu,
    masa: ENUM_FILES.masa,
    paksha: parseEnumFile(paksha),
    tithi: ENUM_FILES.tithi,
    vasara: ENUM_FILES.vasara,
    nakshatra: ENUM_FILES.nakshatra,
    yoga: ENUM_FILES.yoga,
    karana: ENUM_FILES.karana,
    gotra: ENUM_FILES.gotra,
    dik: parseEnumFile(dik),
  },
};
