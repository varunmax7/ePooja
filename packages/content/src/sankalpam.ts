import { z } from 'zod';
import { reviewSchema } from './review';
import { contentTextSchema } from './localizedText';
import { RELATIONS, type Relation } from './devotee';

/**
 * Schemas for `content/sankalpam/*.json` (§9.3): the template, the gender/
 * spouse/family suffix tables, and the GEO region + river-polygon tables.
 *
 * §3.6, non-negotiable: every value here is either transcribed verbatim from
 * a source (the §9.3 structure reference, itself traditional Sanskrit given
 * directly in the plan) or a `⟨TODO_PANDIT: …⟩` placeholder. The *only*
 * declension `@epooja/sankalpam` performs is picking the right pre-written
 * row from `suffix-tables.json` by gender — it never conjugates or declines
 * text itself.
 */

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

/** Every slot name the §9.3 template can reference. */
export const SANKALPAM_SLOTS = [
  'GEO.dvipa',
  'GEO.varsha',
  'GEO.khanda',
  'GEO.meru',
  'GEO.srisaila_dik',
  'GEO.river_region',
  'SAMVATSARA',
  'AYANA',
  'RITU',
  'MASA',
  'PAKSHA',
  'TITHI',
  'VASARA',
  'NAKSHATRA',
  'YOGA',
  'KARANA',
  'GOTRA',
  'SELF.gotrodbhava',
  'NAME',
  'SELF.namadheya',
  'SPOUSE_CLAUSE',
  'FAMILY_CLAUSE',
  'DEITY',
] as const;

export type SankalpamSlot = (typeof SANKALPAM_SLOTS)[number];

const fixedSegmentSchema = z.object({
  type: z.literal('fixed'),
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  text: contentTextSchema,
});

const slotSegmentSchema = z.object({
  type: z.literal('slot'),
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  slot: z.enum(SANKALPAM_SLOTS),
  /**
   * Whether an unresolved value here is a normal, silent state (the clause
   * simply doesn't appear — a bachelor's SPOUSE_CLAUSE) or something the
   * text must visibly flag (§10 Phase 5: "any missing slot yields a visible
   * ⟨MISSING:slot⟩ marker, never silently omitted").
   */
  optional: z.boolean().default(false),
});

export const sankalpamSegmentSchema = z.discriminatedUnion('type', [
  fixedSegmentSchema,
  slotSegmentSchema,
]);

export type SankalpamSegment = z.infer<typeof sankalpamSegmentSchema>;

export const sankalpamTemplateFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('sankalpam-template'),
    note: z.string().optional(),
    review: reviewSchema,
    segments: z.array(sankalpamSegmentSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.segments.forEach((segment, position) => {
      if (ids.has(segment.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate segment id ${segment.id}`,
          path: ['segments', position, 'id'],
        });
      }
      ids.add(segment.id);
    });
  });

export type SankalpamTemplateFile = z.infer<typeof sankalpamTemplateFileSchema>;

export function parseSankalpamTemplateFile(data: unknown): SankalpamTemplateFile {
  return sankalpamTemplateFileSchema.parse(data);
}

// ---------------------------------------------------------------------------
// Suffix tables
// ---------------------------------------------------------------------------

/** One declined term, by the performer's (or family member's) gender. */
const genderedTermSchema = z.object({
  male: contentTextSchema,
  female: contentTextSchema,
});

/** The same relations §9.4's `FamilyMember` uses — the family clause is keyed
 * by how each member relates to the performer, not by anything sankalpam-specific. */
export const RELATION_KINDS = RELATIONS;
export type RelationKind = Relation;

export const suffixTableFileSchema = z.object({
  $schema: z.string().optional(),
  kind: z.literal('sankalpam-suffix-tables'),
  note: z.string().optional(),
  review: reviewSchema,
  /** {GOTRA} names the gotra bare; this is the separate declined suffix word. */
  gotrodbhava: genderedTermSchema,
  /** {NAME} is inserted undeclined; this is the separate declined suffix word. */
  namadheya: genderedTermSchema,
  /**
   * The spouse clause, keyed by the *performer's* gender — "accompanied by
   * [spouse]" declines to match whoever is doing the sankalpam, not the
   * spouse. Only fills in when the spouse exists and is marked
   * `includeInSankalpam`.
   */
  spouseClause: genderedTermSchema,
  /**
   * One term per relation, for the family clause — a family member's own
   * gender does not change these (the clause declines to the *performer's*
   * gender, same principle as `spouseClause`), so this is keyed by relation
   * only, and the performer's gender is applied by
   * `familyClauseSuffix` below.
   */
  familyTerms: z.record(z.enum(RELATION_KINDS), contentTextSchema),
  /** The closing "…sametasya/sametāyāḥ"-type word the family clause ends on. */
  familyClauseSuffix: genderedTermSchema,
});

export type SuffixTableFile = z.infer<typeof suffixTableFileSchema>;

export function parseSuffixTableFile(data: unknown): SuffixTableFile {
  return suffixTableFileSchema.parse(data);
}

// ---------------------------------------------------------------------------
// GEO regions
// ---------------------------------------------------------------------------

const geoRegionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  label: z.string().min(1),
  /**
   * ISO 3166-1 alpha-2 codes this region applies to. Empty means "matches
   * whatever no other region does" — exactly one region may use this, as
   * the fallback the resolver reaches for last.
   */
  countryCodes: z.array(z.string().regex(/^[A-Z]{2}$/)),
  dvipa: contentTextSchema,
  varsha: contentTextSchema,
  khanda: contentTextSchema,
  meru: contentTextSchema,
  /**
   * Whether `srisaila_dik` and `river_region` are computed for this region
   * (true only for India — the bearing-from-Srisailam and the river-basin
   * conventions are specifically Andhra/Telangana traditions) or omitted
   * from the sankalpam entirely, the way a region outside India's rivers
   * would not sensibly name one.
   */
  computeSrisailaDik: z.boolean(),
  computeRiverRegion: z.boolean(),
});

export type GeoRegion = z.infer<typeof geoRegionSchema>;

/** A simple lat/lng polygon, exterior ring only — enough for a coarse region check. */
const polygonSchema = z
  .array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]))
  .min(3, 'a polygon needs at least three points');

const riverRegionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys'),
  label: z.string().min(1),
  text: contentTextSchema,
  /** [lat, lng] pairs, in order, describing a coarse (§10 Phase 5) boundary. */
  polygon: polygonSchema,
});

export type RiverRegion = z.infer<typeof riverRegionSchema>;

export const geoRegionsFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('sankalpam-geo-regions'),
    note: z.string().optional(),
    review: reviewSchema,
    /** [lat, lng] of the Srisailam jyotirlinga (§9.1's fixed reference point). */
    srisailam: z.tuple([z.number(), z.number()]),
    regions: z.array(geoRegionSchema).min(1),
    riverRegions: z.array(riverRegionSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.regions.forEach((region, position) => {
      if (ids.has(region.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate region id ${region.id}`,
          path: ['regions', position, 'id'],
        });
      }
      ids.add(region.id);
    });

    const riverIds = new Set<string>();
    file.riverRegions.forEach((region, position) => {
      if (riverIds.has(region.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate river region id ${region.id}`,
          path: ['riverRegions', position, 'id'],
        });
      }
      riverIds.add(region.id);
    });

    const fallbacks = file.regions.filter((region) => region.countryCodes.length === 0);
    if (fallbacks.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: `exactly one region must be the fallback (empty countryCodes); found ${fallbacks.length}`,
        path: ['regions'],
      });
    }
  });

export type GeoRegionsFile = z.infer<typeof geoRegionsFileSchema>;

export function parseGeoRegionsFile(data: unknown): GeoRegionsFile {
  return geoRegionsFileSchema.parse(data);
}

// ---------------------------------------------------------------------------
// Deity names (the {DEITY} slot)
// ---------------------------------------------------------------------------

export const deityNamesFileSchema = z.object({
  $schema: z.string().optional(),
  kind: z.literal('sankalpam-deity-names'),
  note: z.string().optional(),
  review: reviewSchema,
  /** Keyed by `PujaCatalogItem.deity`. */
  names: z.record(z.string(), contentTextSchema),
});

export type DeityNamesFile = z.infer<typeof deityNamesFileSchema>;

export function parseDeityNamesFile(data: unknown): DeityNamesFile {
  return deityNamesFileSchema.parse(data);
}
