import Sanscript from '@indic-transliteration/sanscript';
import { enumValue, isTodoPandit, type ContentText } from '@epooja/content';
import { resolveGeo, type ResolvedGeo } from './geo';
import type {
  AudioPlanItem,
  RenderedSegment,
  SankalpamContent,
  SankalpamInput,
  SankalpamText,
  SlotResolution,
} from './types';
import type { SankalpamSlot } from '@epooja/content';

/**
 * The §9.3 Sankalpam builder: walks `content/sankalpam/template.json`'s
 * segments, resolves every `slot` against the day's Panchangam, the
 * devotee's own details and the §9.3 suffix tables, and renders the result
 * in all three scripts.
 *
 * §3.6/§0.4, strictly: the only "declension" here is selecting the right
 * pandit-approved row out of a suffix table by gender or relation — nothing
 * is conjugated, composed or guessed. The one runtime computation on text
 * itself is `scriptValue`'s Devanagari/IAST fallback below, and that is
 * script *transliteration* (the same deterministic, lossless conversion
 * `tools/content-build` already applies to static content), not grammar —
 * it exists only because a day's Panchangam and a devotee's own gotra are
 * not known until runtime, so they cannot go through the build-time step
 * §4 otherwise reserves transliteration for.
 */

type ScriptKey = 'te' | 'dev' | 'iast';

type TextLike = Pick<ContentText, 'te' | 'dev' | 'iast'>;

/**
 * One segment's value in one script. `te` is always just `text.te`. For
 * `dev`/`iast`, a pre-authored value (a fixed clause, an enum's `locative`)
 * wins outright; otherwise, a real Telugu `te` is transliterated live via
 * Sanscript, and a `⟨TODO_PANDIT: …⟩` placeholder is echoed unchanged so the
 * same visible gap shows in every script rather than being silently
 * "translated".
 */
export function scriptValue(text: TextLike, script: ScriptKey): string {
  if (script === 'te') return text.te;

  const direct = script === 'dev' ? text.dev : text.iast;
  if (direct !== undefined) return direct;
  if (isTodoPandit(text.te) || text.te.trim().length === 0) return text.te;

  return Sanscript.t(text.te, 'telugu', script === 'dev' ? 'devanagari' : 'iast');
}

/** Joins several `TextLike` pieces into one, script by script, with a space. */
function concatText(parts: readonly TextLike[]): TextLike {
  return {
    te: parts.map((p) => p.te).join(' '),
    dev: parts.map((p) => scriptValue(p, 'dev')).join(' '),
    iast: parts.map((p) => scriptValue(p, 'iast')).join(' '),
  };
}

/**
 * The devotee's own name, undeclined (§9.3: "inserted undeclined, followed
 * by the declined `nāmadheya` form"). A devotee who gave only an English
 * spelling has no Telugu/Devanagari form to transliterate from — that
 * spelling is used literally in every script rather than mangled through a
 * script converter it was never written for.
 */
function nameText(name: { te: string; dev?: string; iast?: string; en?: string }): TextLike {
  const te = name.te.trim();
  if (te.length > 0) return { te, dev: name.dev, iast: name.iast };

  const fallback = name.en?.trim() ?? '';
  return { te: fallback, dev: fallback, iast: fallback };
}

function resolveGotra(input: SankalpamInput, content: SankalpamContent): SlotResolution {
  const { gotraId, gotraCustom } = input.devotee;

  if (gotraId !== undefined) {
    return { status: 'resolved', text: enumValue(content.enums.gotra, gotraId).locative };
  }
  if (gotraCustom !== undefined && gotraCustom.trim().length > 0) {
    // A pandit has not recorded this gotra (§9.4): the devotee's own typed
    // spelling stands in, self-recited, per §9.6.1 — not a missing slot.
    return { status: 'resolved', text: { te: gotraCustom.trim() } };
  }
  return { status: 'missing' };
}

function resolveSpouseClause(input: SankalpamInput, content: SankalpamContent): SlotResolution {
  const spouse = input.devotee.family.find(
    (member) => member.relation === 'spouse' && member.includeInSankalpam,
  );
  if (!spouse) return { status: 'omit' };

  return { status: 'resolved', text: content.suffixTables.spouseClause[input.devotee.gender] };
}

function resolveFamilyClause(input: SankalpamInput, content: SankalpamContent): SlotResolution {
  const relations = [
    ...new Set(
      input.devotee.family
        .filter((member) => member.relation !== 'spouse' && member.includeInSankalpam)
        .map((member) => member.relation),
    ),
  ];
  if (relations.length === 0) return { status: 'omit' };

  const suffix = content.suffixTables.familyClauseSuffix[input.devotee.gender];
  const parts = relations.map((relation) => content.suffixTables.familyTerms[relation]);
  return { status: 'resolved', text: concatText([...parts, suffix]) };
}

function resolveSlot(
  slot: SankalpamSlot,
  input: SankalpamInput,
  content: SankalpamContent,
  geo: ResolvedGeo,
): SlotResolution {
  const p = input.panchangam;

  switch (slot) {
    case 'GEO.dvipa':
      return { status: 'resolved', text: geo.region.dvipa };
    case 'GEO.varsha':
      return { status: 'resolved', text: geo.region.varsha };
    case 'GEO.khanda':
      return { status: 'resolved', text: geo.region.khanda };
    case 'GEO.meru':
      return { status: 'resolved', text: geo.region.meru };
    case 'GEO.srisaila_dik':
      if (!geo.srisailaDik) return { status: 'omit' };
      return { status: 'resolved', text: enumValue(content.enums.dik, geo.srisailaDik).locative };
    case 'GEO.river_region':
      if (!geo.region.computeRiverRegion) return { status: 'omit' };
      if (!geo.riverRegion) return { status: 'missing' };
      return { status: 'resolved', text: geo.riverRegion.text };
    case 'SAMVATSARA':
      return {
        status: 'resolved',
        text: enumValue(content.enums.samvatsara, p.samvatsaraId).locative,
      };
    case 'AYANA':
      return { status: 'resolved', text: enumValue(content.enums.ayana, p.ayana).locative };
    case 'RITU':
      return { status: 'resolved', text: enumValue(content.enums.ruthu, p.rituId).locative };
    case 'MASA':
      return { status: 'resolved', text: enumValue(content.enums.masa, p.masaId).locative };
    case 'PAKSHA':
      return { status: 'resolved', text: enumValue(content.enums.paksha, p.paksha).locative };
    case 'TITHI':
      return { status: 'resolved', text: enumValue(content.enums.tithi, p.tithiId).locative };
    case 'VASARA':
      return { status: 'resolved', text: enumValue(content.enums.vasara, p.vasaraId).locative };
    case 'NAKSHATRA':
      return {
        status: 'resolved',
        text: enumValue(content.enums.nakshatra, p.nakshatraId).locative,
      };
    case 'YOGA':
      return { status: 'resolved', text: enumValue(content.enums.yoga, p.yogaId).locative };
    case 'KARANA':
      return { status: 'resolved', text: enumValue(content.enums.karana, p.karanaId).locative };
    case 'GOTRA':
      return resolveGotra(input, content);
    case 'SELF.gotrodbhava':
      return { status: 'resolved', text: content.suffixTables.gotrodbhava[input.devotee.gender] };
    case 'NAME':
      return { status: 'resolved', text: nameText(input.devotee.name) };
    case 'SELF.namadheya':
      return { status: 'resolved', text: content.suffixTables.namadheya[input.devotee.gender] };
    case 'SPOUSE_CLAUSE':
      return resolveSpouseClause(input, content);
    case 'FAMILY_CLAUSE':
      return resolveFamilyClause(input, content);
    case 'DEITY': {
      const text = content.deityNames.names[input.deity];
      return text ? { status: 'resolved', text } : { status: 'missing' };
    }
  }
}

function renderScript(segments: readonly RenderedSegment[], script: ScriptKey): string {
  const pieces = segments
    .map((segment) => {
      if (segment.resolution.status === 'omit') return '';
      if (segment.resolution.status === 'missing') return `⟨MISSING:${segment.slot}⟩`;
      return scriptValue(segment.resolution.text, script);
    })
    .filter((piece) => piece.length > 0);

  return pieces.join(' ');
}

/**
 * Assembles the full Sankalpam in Telugu, Devanagari and IAST from one
 * Panchangam + devotee + location + deity input, per §9.3.
 *
 * A slot the template marks `optional` quietly contributes nothing when it
 * does not apply (a bachelor's spouse clause, an NRI's river region) — that
 * is `status: 'omit'` and produces no text at all. A slot that *should* have
 * resolved but could not (no gotra on file, an India address outside every
 * listed river polygon, an uncatalogued deity) renders the visible
 * `⟨MISSING:slot⟩` marker §10 Phase 5 requires, so a content or data gap is
 * never confused with an intentional absence.
 */
export function buildSankalpamText(
  input: SankalpamInput,
  content: SankalpamContent,
): SankalpamText {
  const geo = resolveGeo(
    {
      lat: input.location.lat,
      lng: input.location.lng,
      countryCode: input.location.countryCode,
      riverRegionOverride: input.location.riverRegionOverride,
    },
    content.geoRegions,
  );

  const segments: RenderedSegment[] = content.template.segments.map((segment) => {
    if (segment.type === 'fixed') {
      return { id: segment.id, resolution: { status: 'resolved', text: segment.text } };
    }
    return {
      id: segment.id,
      slot: segment.slot,
      resolution: resolveSlot(segment.slot, input, content, geo),
    };
  });

  return {
    te: renderScript(segments, 'te'),
    dev: renderScript(segments, 'dev'),
    iast: renderScript(segments, 'iast'),
    segments,
  };
}

/**
 * The ordered audio queue for a built Sankalpam (§9.3's
 * `buildSankalpamAudioPlan`), in the same segment order `buildSankalpamText`
 * renders.
 *
 * Phase 5 stub (§10): every fixed clause and every enum slot becomes a
 * `clip` item naming the clip id the pandit will eventually record under
 * (`sankalpam.<segment-id>` for a fixed clause, the enum's own
 * `audioTokenId` for a slot) with `durationMs: 0` — Phase 7 imports the real
 * manifest and fills in durations, LUFS-matched gaps and text-cue offsets
 * without needing to touch this ordering. `GOTRA`/`NAME` resolve to
 * `self_recite` whenever the text builder used a self-recited value (a
 * custom gotra, or the devotee's own name — §9.6.1's default, no clip
 * exists to point at). An `omit`ted segment contributes nothing, matching
 * the text it produces no words for; a `missing` one surfaces as its own
 * item so a caller can flag the same gap in the audio queue, not just the
 * transcript.
 */
export function buildSankalpamAudioPlan(
  input: SankalpamInput,
  content: SankalpamContent,
): AudioPlanItem[] {
  const text = buildSankalpamText(input, content);
  const items: AudioPlanItem[] = [];

  for (const segment of text.segments) {
    if (segment.resolution.status === 'omit') continue;

    if (segment.resolution.status === 'missing') {
      /* c8 ignore next -- every 'missing' slot segment carries its slot */
      items.push({ kind: 'missing', segmentId: segment.id, slot: segment.slot! });
      continue;
    }

    const selfRecited =
      (segment.slot === 'GOTRA' && input.devotee.gotraId === undefined) || segment.slot === 'NAME';

    if (selfRecited) {
      /* c8 ignore next -- GOTRA/NAME are always slot segments */
      items.push({ kind: 'self_recite', segmentId: segment.id, slot: segment.slot! });
      continue;
    }

    const clipId = clipIdFor(segment, input, content);
    items.push({ kind: 'clip', segmentId: segment.id, clipId, durationMs: 0 });
  }

  return items;
}

function clipIdFor(
  segment: RenderedSegment,
  input: SankalpamInput,
  content: SankalpamContent,
): string {
  if (!segment.slot) return `sankalpam.${segment.id}`;

  const p = input.panchangam;
  const enumLookup: Partial<Record<SankalpamSlot, [typeof content.enums.tithi, string]>> = {
    SAMVATSARA: [content.enums.samvatsara, p.samvatsaraId],
    AYANA: [content.enums.ayana, p.ayana],
    RITU: [content.enums.ruthu, p.rituId],
    MASA: [content.enums.masa, p.masaId],
    PAKSHA: [content.enums.paksha, p.paksha],
    TITHI: [content.enums.tithi, p.tithiId],
    VASARA: [content.enums.vasara, p.vasaraId],
    NAKSHATRA: [content.enums.nakshatra, p.nakshatraId],
    YOGA: [content.enums.yoga, p.yogaId],
    KARANA: [content.enums.karana, p.karanaId],
    GOTRA: input.devotee.gotraId ? [content.enums.gotra, input.devotee.gotraId] : undefined,
  };

  const lookup = enumLookup[segment.slot];
  if (lookup) return enumValue(...lookup).audioTokenId;

  // Everything else (GEO text, suffix-table words, the deity name) is
  // sankalpam-authored content, not an enum token — named the same way the
  // fixed clauses are, by the template's own segment id.
  return `sankalpam.${segment.id}`;
}
