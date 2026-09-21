import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { stepsForVariant, type PujaCatalogItem } from '@epooja/content';

/**
 * Presentation helpers shared by the catalog, detail and preparation screens.
 *
 * `image` in the content is an asset key for artwork that does not exist yet
 * (§9.4 leaves deity illustration for a later phase), so the catalog draws a
 * glyph instead — chosen here, by deity, rather than stored in the content,
 * because it is a property of this app's icon set, not of the ritual.
 */
type GlyphName = keyof typeof MaterialCommunityIcons.glyphMap;

const DEITY_ICONS: Record<string, GlyphName> = {
  generic: 'candle',
  ganapathi: 'flower-tulip',
  lakshmi: 'flower-poppy',
  shiva: 'meditation',
};

export function pujaIcon(puja: PujaCatalogItem): GlyphName {
  return DEITY_ICONS[puja.deity] ?? 'candle';
}

/** "15 / 35 min" when a puja has both variants, "35 min" when it has one. */
export function durationLabel(puja: PujaCatalogItem): string {
  const { short, full } = puja.durations;
  return short === undefined ? `${full} min` : `${short} / ${full} min`;
}

/** How many steps the short variant runs — what the catalog card advertises. */
export function shortStepCount(puja: PujaCatalogItem): number {
  return stepsForVariant(puja, 'short').length;
}

/** The English title, falling back to Telugu for content that has no `en`. */
export function pujaTitle(puja: PujaCatalogItem): string {
  return puja.title.en?.trim() || puja.title.te;
}
