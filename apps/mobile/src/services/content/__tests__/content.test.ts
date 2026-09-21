import { stepsForVariant } from '@epooja/content';
import {
  PUJAS,
  RECIPES,
  SAMAGRI,
  catalogSections,
  pujaBySlug,
  recipesForPuja,
  samagriForPuja,
} from '@/services/content';

describe('the bundled seed pack', () => {
  it('parses every bundled puja, samagri item and recipe at import time', () => {
    // Reaching this line at all means every parse* call in content.ts passed;
    // a §9.4 violation would have thrown on import.
    expect(PUJAS.length).toBeGreaterThanOrEqual(4);
    expect(SAMAGRI.length).toBeGreaterThan(0);
    expect(RECIPES.length).toBeGreaterThan(0);
  });

  it('includes the Nitya Puja seed the first run needs offline', () => {
    const nitya = pujaBySlug('nitya-puja');
    expect(nitya?.category).toBe('nitya');
    expect(nitya?.steps.length).toBeGreaterThan(0);
  });

  it('returns undefined for an unknown slug rather than throwing', () => {
    expect(pujaBySlug('not-a-puja')).toBeUndefined();
    expect(pujaBySlug(undefined)).toBeUndefined();
  });
});

describe('cross-references resolve', () => {
  it("every puja's samagri ids resolve to real items", () => {
    // Jest's `expect` takes no message argument, so failures are reported as
    // a slug->count map — which names the offending puja just as clearly.
    const resolved = Object.fromEntries(
      PUJAS.map((puja) => [puja.slug, samagriForPuja(puja).length]),
    );
    const expected = Object.fromEntries(PUJAS.map((puja) => [puja.slug, puja.samagri.length]));
    expect(resolved).toEqual(expected);
  });

  it("every puja's naivedyam ids resolve to real recipes", () => {
    const resolved = Object.fromEntries(
      PUJAS.map((puja) => [puja.slug, recipesForPuja(puja).length]),
    );
    const expected = Object.fromEntries(PUJAS.map((puja) => [puja.slug, puja.naivedyam.length]));
    expect(resolved).toEqual(expected);
  });

  it('every samagriUsed id on a step resolves too', () => {
    const ids = new Set(SAMAGRI.map((item) => item.id));
    const unresolved = PUJAS.flatMap((puja) =>
      puja.steps.flatMap((step) =>
        (step.samagriUsed ?? [])
          .filter((id) => !ids.has(id))
          .map((id) => `${puja.slug}/${step.id} → ${id}`),
      ),
    );
    expect(unresolved).toEqual([]);
  });
});

describe('catalogSections (§8.3)', () => {
  const sections = catalogSections();

  it('puts Daily first, then Deity poojas', () => {
    expect(sections.map((s) => s.category)).toEqual(['nitya', 'deity']);
    expect(sections[0]?.title).toBe('Daily');
  });

  it('omits the Festivals section while no festival puja exists', () => {
    expect(sections.some((s) => s.category === 'festival')).toBe(false);
  });

  it('places every bundled puja in exactly one section', () => {
    const placed = sections.flatMap((s) => s.pujas.map((p) => p.slug));
    expect(placed.sort()).toEqual(PUJAS.map((p) => p.slug).sort());
  });
});

describe('duration variants', () => {
  it('the short Nitya Puja is a subset of the full one', () => {
    const nitya = pujaBySlug('nitya-puja');
    if (!nitya) throw new Error('seed puja missing');

    const short = stepsForVariant(nitya, 'short').map((s) => s.id);
    const full = stepsForVariant(nitya, 'full').map((s) => s.id);

    expect(short.length).toBeLessThan(full.length);
    expect(short.every((id) => full.includes(id))).toBe(true);
  });
});
