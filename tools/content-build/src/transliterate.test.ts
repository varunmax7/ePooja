import { describe, expect, it } from 'vitest';
import { enrichContentText, enrichDeep, needsTransliteration } from './transliterate';

describe('enrichContentText', () => {
  it('derives dev and iast from real Telugu', () => {
    const enriched = enrichContentText({ te: 'నమః' });
    expect(enriched.dev).toBe('नमः');
    expect(enriched.iast).toBe('namaḥ');
  });

  it('leaves a ⟨TODO_PANDIT: …⟩ placeholder untouched in every script', () => {
    const placeholder = { te: '⟨TODO_PANDIT: some_id⟩' };
    expect(enrichContentText(placeholder)).toEqual(placeholder);
  });

  it('never overwrites a dev or iast a pandit already supplied by hand', () => {
    const handAuthored = { te: 'నమః', dev: 'हस्तलिखित', iast: 'hand-written' };
    expect(enrichContentText(handAuthored)).toEqual(handAuthored);
  });

  it('fills only the missing half when one of dev/iast is already set', () => {
    const partial = { te: 'నమః', dev: 'हस्तलिखित' };
    const enriched = enrichContentText(partial);
    expect(enriched.dev).toBe('हस्तलिखित');
    expect(enriched.iast).toBe('namaḥ');
  });

  it('leaves an empty te untouched — nothing to transliterate', () => {
    expect(enrichContentText({ te: '' })).toEqual({ te: '' });
  });

  it('preserves en alongside the derived scripts', () => {
    const enriched = enrichContentText({ te: 'నిత్య పూజ', en: 'Daily Nitya Puja' });
    expect(enriched.en).toBe('Daily Nitya Puja');
    expect(enriched.dev).toBe('नित्य पूज');
  });
});

describe('needsTransliteration', () => {
  it('is true when dev or iast is missing from real Telugu', () => {
    expect(needsTransliteration({ te: 'నమః' })).toBe(true);
    expect(needsTransliteration({ te: 'నమః', dev: 'नमः' })).toBe(true);
  });

  it('is false once both are present', () => {
    expect(needsTransliteration({ te: 'నమః', dev: 'नमः', iast: 'namaḥ' })).toBe(false);
  });

  it('is false for a placeholder — there is nothing to derive yet', () => {
    expect(needsTransliteration({ te: '⟨TODO_PANDIT: x⟩' })).toBe(false);
  });
});

describe('enrichDeep', () => {
  it('enriches a ContentText nested arbitrarily deep in a puja-shaped object', () => {
    // Typed as the loose shape `enrichDeep` actually receives — a parsed
    // JSON document, where every ContentText may or may not carry its
    // derived scripts yet.
    interface LooseText {
      te: string;
      dev?: string;
      iast?: string;
      en?: string;
    }
    interface LoosePuja {
      id: string;
      title: LooseText;
      steps: {
        id: string;
        title: LooseText;
        chant: { lines: { id: string; text: LooseText }[] };
      }[];
    }

    const puja: LoosePuja = {
      id: 'nitya-puja',
      title: { te: 'నిత్య పూజ', en: 'Daily Nitya Puja' },
      steps: [
        {
          id: 'deeparadhana',
          title: { te: 'దీపారాధన' },
          chant: { lines: [{ id: 'l1', text: { te: 'ఓం నమః శివాయ' } }] },
        },
      ],
    };

    const enriched = enrichDeep(puja);

    expect(enriched.title.dev).toBe('नित्य पूज');
    expect(enriched.steps[0]?.title.iast).toBe('dīpārādhana');
    expect(enriched.steps[0]?.chant.lines[0]?.text.dev).toBe('ओं नमः शिवाय');
  });

  it('passes through ids, numbers and plain strings untouched', () => {
    const step = { id: 'sankalpam', order: 5, dynamic: 'sankalpam' };
    expect(enrichDeep(step)).toEqual(step);
  });

  it('does not mistake an unrelated object with a te-named key for ContentText', () => {
    // A hypothetical field that happens to have a string `te` key but isn't
    // the { te, dev?, iast?, en? } shape — must pass through unchanged.
    const notContentText = { te: 'నమః', other: 'field' };
    expect(enrichDeep(notContentText)).toEqual(notContentText);
  });
});
