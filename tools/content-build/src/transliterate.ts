import Sanscript from '@indic-transliteration/sanscript';
import { isTodoPandit, type ContentText } from '@epooja/content';

/**
 * Fills a `ContentText`'s `dev`/`iast` from its `te` via Sanscript, wherever
 * they are missing — §9.4's content-build "transliterate (Telugu →
 * Devanagari/IAST via sanscript)" step.
 *
 * Mechanical, not invented: this only ever runs on Telugu a pandit already
 * authored (or a placeholder), converting its script, never composing new
 * text — the distinction §0.4 draws. A `⟨TODO_PANDIT: …⟩` placeholder is
 * left as the placeholder in every script; there is nothing yet to convert.
 *
 * Never overwrites a `dev`/`iast` value someone already supplied by hand —
 * a pandit's own spelling always outranks a mechanical transliteration.
 */
export function enrichContentText(text: ContentText): ContentText {
  if (text.te.trim().length === 0 || isTodoPandit(text.te)) return text;

  return {
    ...text,
    dev: text.dev ?? Sanscript.t(text.te, 'telugu', 'devanagari'),
    iast: text.iast ?? Sanscript.t(text.te, 'telugu', 'iast'),
  };
}

/** True if a `ContentText` is missing a `dev` or `iast` form it could derive. */
export function needsTransliteration(text: ContentText): boolean {
  if (isTodoPandit(text.te)) return false;
  return text.dev === undefined || text.iast === undefined;
}

/**
 * Walks a parsed content value and enriches every `ContentText`-shaped
 * object found in it (a puja's `title`, a step's `title`/`instruction.text`,
 * a mantra line's `text`, and so on) — recursing through the whole document
 * rather than naming each field, since a puja's shape is deep and mixed with
 * plain strings, numbers and ids that must pass through untouched.
 */
export function enrichDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => enrichDeep(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    if (isContentTextShaped(value)) {
      return enrichContentText(value) as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = enrichDeep(entry);
    }
    return result as T;
  }

  return value;
}

function isContentTextShaped(value: object): value is ContentText {
  if (!('te' in value) || typeof (value as { te: unknown }).te !== 'string') return false;
  // Distinguishes a { te, dev?, iast?, en? } node from an unrelated object
  // that happens to have a `te` string key, by checking every other key is
  // one ContentText actually has.
  const allowedKeys = new Set(['te', 'dev', 'iast', 'en']);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}
