import { parseCityFile, type City } from '@epooja/content';
import raw from '@/../../../content/cities.json';

/**
 * The offline city list, parsed and validated once at import time.
 *
 * A schema failure here is a build-time content bug — `pnpm content:build`
 * (Phase 4) will eventually catch it before the app ever ships — so this
 * throws rather than silently serving an empty list a devotee would search
 * and find nothing in.
 */
export const CITIES: readonly City[] = parseCityFile(raw).cities;
