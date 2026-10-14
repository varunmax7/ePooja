import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { isTodoPandit, stepsForVariant, type ContentText, type PujaCatalogItem } from '@epooja/content';
import type { MantraScript } from '@epooja/ui';

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

/**
 * "15 / 35 min" when a puja has both variants, "35 min" when it has one.
 * `unit` is the caller's translated minute-unit word (Phase 9, `t('poojas:minUnit')`)
 * — this stays a plain function, not a hook, so it works outside components too.
 */
export function durationLabel(puja: PujaCatalogItem, unit = 'min'): string {
  const { short, full } = puja.durations;
  return short === undefined ? `${full} ${unit}` : `${short} / ${full} ${unit}`;
}

/** How many steps the short variant runs — what the catalog card advertises. */
export function shortStepCount(puja: PujaCatalogItem): number {
  return stepsForVariant(puja, 'short').length;
}

/** The English title, falling back to Telugu for content that has no `en`. */
export function pujaTitle(puja: PujaCatalogItem): string {
  return puja.title.en?.trim() || puja.title.te;
}

/**
 * §0.4's own convention tags unauthored ritual text with its raw
 * `⟨TODO_PANDIT: id⟩` placeholder token, so it's easy to grep
 * (`content/REVIEW_QUEUE.md`'s whole point) — but that internal token
 * leaking onto a devotee's screen reads as the app being broken, not as a
 * known, tracked gap. Only ever reachable running a dev build against
 * incomplete content in the first place: the Phase 10 production gate
 * refuses to ship while any placeholder remains, so a plain, deliberately
 * non-ritual English label here (regardless of `uiLang`/`script`) is fine —
 * same reasoning as `services/audio/devSpeech.ts`'s spoken
 * `NOT_YET_RECORDED_NOTICE`.
 */
const NOT_YET_RECORDED_LABEL = '(not yet recorded)';

/**
 * A `ContentText` in the devotee's chosen mantra script (§7.3), falling back
 * to Telugu for a script a piece of content has no form in yet — content is
 * never silently blank just because `dev`/`iast` have not been authored.
 */
export function contentTextFor(text: ContentText, script: MantraScript): string {
  const resolved =
    script === 'dev' ? text.dev ?? text.te : script === 'iast' ? text.iast ?? text.te : text.te;
  return isTodoPandit(resolved) ? NOT_YET_RECORDED_LABEL : resolved;
}
