import type { ContentText } from '@epooja/content';
import { isTodoPandit } from '@epooja/content';

/**
 * Shared helpers for `useDevSpeechPlayback.ts` — the dev-only text-to-speech
 * stand-in for a step's not-yet-recorded audio (§9.6). Pulled out of that
 * hook so they can be unit-tested as plain functions, same reasoning as
 * `devPlaceholder.ts`'s own split from the hooks that use it.
 */

const TELUGU_BLOCK = /[ఀ-౿]/;

/**
 * The form of `text` worth handing to a speech engine — always `te`,
 * regardless of the devotee's own display-script preference
 * (`contentTextFor`'s `script` param, used everywhere this content is
 * *shown*). A romanized `iast`/`dev` form would not match the Telugu-block
 * check `speechLanguageFor` uses, and would get read in an English voice —
 * `te` is the only form an actual Telugu TTS voice stands a chance with.
 */
export function speechTextFor(text: ContentText): string {
  return text.te;
}

/** A pandit-unapproved `⟨TODO_PANDIT: …⟩` placeholder or a blank string has nothing to say aloud. */
export function isSpeakableText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !isTodoPandit(trimmed);
}

/** Only the texts worth handing to a speech engine, in order, blanks/placeholders dropped. */
export function speakableTextsFrom(texts: readonly string[]): string[] {
  return texts.filter(isSpeakableText);
}

/**
 * Spoken in place of a line that was asked for but has nothing speakable —
 * every entry still a `⟨TODO_PANDIT: …⟩` placeholder — so a step with a
 * genuine content gap (e.g. Nitya Puja's Naivedyam chant, which has no `en`
 * fallback either) still produces *something* audible instead of a devotee
 * pressing Play and hearing nothing with no indication why. Deliberately
 * plain English, deliberately not a translation of anything real: never
 * mistakeable for a mantra, and `speechLanguageFor` reads it as English
 * regardless of which step it stands in for.
 */
export const NOT_YET_RECORDED_NOTICE = "This part hasn't been recorded yet.";

/**
 * What `useDevSpeechPlayback` actually queues for one phase's `texts`:
 * - some real content exists → that content, in order (any placeholder or
 *   blank lines among them dropped).
 * - nothing was ever asked for (`texts` itself is empty — a phase with no
 *   instruction, say) → nothing to queue; silent by design, not by gap.
 * - something *was* asked for, but every line is still a placeholder →
 *   `NOT_YET_RECORDED_NOTICE`, once, rather than silence.
 */
export function speechQueueFor(texts: readonly string[]): string[] {
  const speakable = speakableTextsFrom(texts);
  if (speakable.length > 0) return speakable;
  return texts.length === 0 ? [] : [NOT_YET_RECORDED_NOTICE];
}

/**
 * Best-effort IETF BCP 47 tag so the device's speech engine at least reaches
 * for roughly the right phoneme set — most puja content is Telugu script,
 * some (instructions, meanings) is English. This is a local-testing
 * convenience only; it makes no claim of correct liturgical pronunciation —
 * only a named pandit's own recording is that (§0.3, §0.4).
 */
export function speechLanguageFor(text: string): string {
  return TELUGU_BLOCK.test(text) ? 'te-IN' : 'en-US';
}

/**
 * No real clip exists yet to read a duration from, so this estimates one
 * from a typical natural speaking pace (~15 characters/second) purely to
 * drive the Puja Runner's progress bar — nothing times a devotee against it.
 */
const CHARS_PER_SECOND = 15;
const MIN_DURATION_MS = 600;

export function estimateSpeechDurationMs(text: string): number {
  return Math.max(MIN_DURATION_MS, Math.round((text.length / CHARS_PER_SECOND) * 1000));
}

/**
 * A slightly unhurried pace reads as a calm, deliberate recitation rather
 * than a rushed, robotic one — `1.0` (the engine default) sounds noticeably
 * flatter on every device this was tried on.
 */
export const DEFAULT_SPEECH_RATE = 0.9;

/**
 * A short silence between lines, the way a real recitation breathes between
 * phrases rather than running them together — not counted in
 * `estimateSpeechDurationMs`'s own total (a minor, harmless gap in the
 * progress bar, never anything real timing depends on).
 */
export const INTER_LINE_PAUSE_MS = 300;

/**
 * Just enough of `expo-speech`'s own `Voice` shape for `pickVoiceId` below —
 * kept local (rather than importing `expo-speech`'s type) so this file,
 * like the rest of this module's helpers, stays a plain function with no
 * native-module dependency of its own.
 */
export interface SpeechVoiceOption {
  identifier: string;
  language: string;
  quality: string;
}

/**
 * Most devices have no Telugu voice installed at all — picking *some*
 * voice, in a language whose phonemes are at least closer to Telugu than a
 * flat US English voice, reads less jarring than the engine's own silent
 * fallback-to-default-voice behaviour. `en-US` content gets its own chain
 * too, purely to prefer a higher-quality `en-US`/`en-GB` voice over whatever
 * the device picked as its system default.
 */
const LANGUAGE_FALLBACKS: Record<string, readonly string[]> = {
  'te-IN': ['te-IN', 'hi-IN', 'en-IN', 'en-US'],
  'en-US': ['en-US', 'en-IN', 'en-GB'],
};

/**
 * The best available voice for `language` among `voices` (from
 * `Speech.getAvailableVoicesAsync()`) — walks `LANGUAGE_FALLBACKS`' chain
 * until one has any match at all, then prefers that language's
 * `'Enhanced'`-quality voice (a real neural/premium voice where the OS ships
 * one, e.g. iOS/macOS's own "Enhanced" Siri voices) over its `'Default'`
 * one. `undefined` when nothing matches any step of the chain — the caller
 * falls back to the engine's own default voice for `language` instead.
 */
export function pickVoiceId(
  language: string,
  voices: readonly SpeechVoiceOption[],
): string | undefined {
  const chain = LANGUAGE_FALLBACKS[language] ?? [language];

  for (const candidateLanguage of chain) {
    const matches = voices.filter((voice) =>
      voice.language.toLowerCase().startsWith(candidateLanguage.toLowerCase()),
    );
    const [first] = matches;
    if (first === undefined) continue;
    const enhanced = matches.find((voice) => voice.quality === 'Enhanced');
    return (enhanced ?? first).identifier;
  }

  return undefined;
}
