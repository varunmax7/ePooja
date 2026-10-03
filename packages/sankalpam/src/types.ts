import type {
  ContentText,
  Devotee,
  DeityNamesFile,
  EnumFile,
  GeoRegionsFile,
  SankalpamSlot,
  SankalpamTemplateFile,
  SuffixTableFile,
} from '@epooja/content';

/**
 * The panchangam facts the §9.3 template needs — deliberately a narrow,
 * independent shape rather than importing `PanchangamData` from
 * `@epooja/panchangam`. The two packages sit side by side in the
 * architecture (§5): the engine computes the day, a caller decides which
 * instant's angas to use (§3.7 "now" vs. "at sunrise") and hands the ids
 * across. `@epooja/sankalpam` stays pure text assembly and never computes a
 * Panchangam itself.
 */
export interface SankalpamPanchangamInput {
  samvatsaraId: string;
  ayana: 'uttarayana' | 'dakshinayana';
  rituId: string;
  masaId: string;
  paksha: 'shukla' | 'krishna';
  tithiId: string;
  vasaraId: string;
  nakshatraId: string;
  yogaId: string;
  karanaId: string;
}

export interface SankalpamLocationInput {
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  /** A devotee's manual choice from Settings, overriding the polygon lookup. */
  riverRegionOverride?: string;
}

export interface SankalpamInput {
  devotee: Pick<Devotee, 'name' | 'gender' | 'gotraId' | 'gotraCustom' | 'family'>;
  panchangam: SankalpamPanchangamInput;
  location: SankalpamLocationInput;
  /** The puja's `PujaCatalogItem.deity` id, e.g. "ganapathi". */
  deity: string;
}

/**
 * The parsed `content/sankalpam/*` files plus the `content/enums/*` files
 * the anga slots read from — everything `buildSankalpamText` needs, bundled
 * by the caller the same way `apps/mobile/src/services/panchangam/content.ts`
 * already bundles enums for the engine's own consumers.
 */
export interface SankalpamContent {
  template: SankalpamTemplateFile;
  suffixTables: SuffixTableFile;
  geoRegions: GeoRegionsFile;
  deityNames: DeityNamesFile;
  enums: {
    samvatsara: EnumFile;
    ayana: EnumFile;
    ruthu: EnumFile;
    masa: EnumFile;
    paksha: EnumFile;
    tithi: EnumFile;
    vasara: EnumFile;
    nakshatra: EnumFile;
    yoga: EnumFile;
    karana: EnumFile;
    gotra: EnumFile;
    dik: EnumFile;
  };
}

/**
 * A resolved slot's three possible states.
 *
 * `omit` and `missing` look similar (neither renders text) but mean opposite
 * things: `omit` is a normal absence — a bachelor's `SPOUSE_CLAUSE`, an NRI
 * region's `GEO.river_region` — and produces nothing at all, not even a
 * marker. `missing` is a data gap the sankalpam *should* have filled — a
 * devotee who never gave a gotra, an India address outside every listed
 * river polygon — and renders the visible `⟨MISSING:slot⟩` marker §10 Phase
 * 5 requires, precisely so it is never confused with the first case.
 */
export type SlotResolution =
  { status: 'resolved'; text: ContentText } | { status: 'omit' } | { status: 'missing' };

export interface RenderedSegment {
  id: string;
  /** The segment's slot name, for a `fixed` segment this is undefined. */
  slot?: SankalpamSlot;
  resolution: SlotResolution;
}

export interface SankalpamText {
  te: string;
  dev: string;
  iast: string;
  segments: RenderedSegment[];
}

/**
 * One item in the audio queue §9.3's `buildSankalpamAudioPlan` returns.
 *
 * Phase 5 ships this as a stub (§10: "stub durations until P7") — the real
 * clip durations, LUFS-matched gaps and text-cue offsets arrive once Phase 7
 * imports the recorded token manifest. What Phase 5 fixes now is the
 * *ordering and shape* of the plan: which clip (or self-recite pause) plays
 * for each segment, in the same order `buildSankalpamText` renders them, so
 * Phase 7 only has to fill in numbers, never restructure this.
 */
export type AudioPlanItem =
  | {
      /** A pre-recorded clip: a fixed template clause or an enum token. */
      kind: 'clip';
      segmentId: string;
      clipId: string;
      /** 0 until Phase 7 imports the real manifest. */
      durationMs: number;
    }
  | {
      /**
       * The devotee's own name, or a hand-typed gotra the pandit has not
       * recorded yet (§9.6.1 default: self-recite, no audio token exists).
       */
      kind: 'self_recite';
      segmentId: string;
      slot: SankalpamSlot;
    }
  | {
      /** A segment the text renderer also could not resolve (§10 Phase 5). */
      kind: 'missing';
      segmentId: string;
      slot: SankalpamSlot;
    };
