import {
  parseNaivedyamFile,
  parsePujaFile,
  parseSamagriFile,
  type NaivedyamRecipe,
  type PujaCatalogItem,
  type PujaCategory,
  type SamagriItem,
} from '@epooja/content';
import nityaPuja from '@/../../../content/pujas/nitya-puja.json';
import ganapathiPuja from '@/../../../content/pujas/ganapathi-puja.json';
import lakshmiPuja from '@/../../../content/pujas/lakshmi-puja.json';
import shivaPuja from '@/../../../content/pujas/shiva-puja.json';
import samagriFile from '@/../../../content/samagri/items.json';
import naivedyamFile from '@/../../../content/naivedyam/recipes.json';

/**
 * The seed pack: the puja, samagri and naivedyam content bundled inside the
 * app binary (§10 Phase 4), parsed and validated once at import time.
 *
 * Bundled rather than downloaded so a devotee's first puja works offline the
 * moment they install (§5, offline-first) — Phase 8's downloaded packs layer
 * on top of this, they do not replace it. Parsing here rather than trusting
 * the JSON means a content change that breaks §9.4 fails loudly in a dev
 * build rather than rendering a half-empty puja on a devotee's screen.
 *
 * These read `content/*.json` directly, not `tools/content-build/dist`: the
 * build's transliteration only fills `dev`/`iast`, which nothing in Phase 4
 * displays — the screens show `te` and `en`. Pointing the app at built packs
 * is Phase 8 work, alongside the download path that makes versioned packs
 * meaningful.
 */

export const PUJAS: readonly PujaCatalogItem[] = [
  parsePujaFile(nityaPuja),
  parsePujaFile(ganapathiPuja),
  parsePujaFile(lakshmiPuja),
  parsePujaFile(shivaPuja),
];

export const SAMAGRI: readonly SamagriItem[] = parseSamagriFile(samagriFile).items;
export const RECIPES: readonly NaivedyamRecipe[] = parseNaivedyamFile(naivedyamFile).recipes;

export const PUJA_BY_SLUG: ReadonlyMap<string, PujaCatalogItem> = new Map(
  PUJAS.map((puja) => [puja.slug, puja]),
);
export const SAMAGRI_BY_ID: ReadonlyMap<string, SamagriItem> = new Map(
  SAMAGRI.map((item) => [item.id, item]),
);
export const RECIPE_BY_ID: ReadonlyMap<string, NaivedyamRecipe> = new Map(
  RECIPES.map((recipe) => [recipe.id, recipe]),
);

/** The puja a `[slug]` route is for, or undefined if the slug is unknown. */
export function pujaBySlug(slug: string | undefined): PujaCatalogItem | undefined {
  return slug === undefined ? undefined : PUJA_BY_SLUG.get(slug);
}

/**
 * The samagri a puja needs, in the order the puja lists them.
 *
 * Silently skips an id with no matching item rather than rendering a blank
 * row — `pnpm content:build` already fails on an unknown reference, so a
 * miss here means the app is running against content the build never saw.
 */
export function samagriForPuja(puja: PujaCatalogItem): SamagriItem[] {
  return puja.samagri
    .map((id) => SAMAGRI_BY_ID.get(id))
    .filter((item): item is SamagriItem => item !== undefined);
}

/** The naivedyam recipes a puja calls for, in the order the puja lists them. */
export function recipesForPuja(puja: PujaCatalogItem): NaivedyamRecipe[] {
  return puja.naivedyam
    .map((id) => RECIPE_BY_ID.get(id))
    .filter((recipe): recipe is NaivedyamRecipe => recipe !== undefined);
}

export interface CatalogSection {
  category: PujaCategory;
  title: string;
  pujas: PujaCatalogItem[];
}

const CATEGORY_TITLES: Record<PujaCategory, string> = {
  nitya: 'Daily',
  deity: 'Deity poojas',
  festival: 'Festivals',
};

/** The §8.3 catalog: Nitya, then Deity, then Festival; empty sections omitted. */
export function catalogSections(pujas: readonly PujaCatalogItem[] = PUJAS): CatalogSection[] {
  return (['nitya', 'deity', 'festival'] as const)
    .map((category) => ({
      category,
      title: CATEGORY_TITLES[category],
      pujas: pujas.filter((puja) => puja.category === category),
    }))
    .filter((section) => section.pujas.length > 0);
}
