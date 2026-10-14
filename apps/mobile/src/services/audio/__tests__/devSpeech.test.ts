import {
  DEFAULT_SPEECH_RATE,
  INTER_LINE_PAUSE_MS,
  NOT_YET_RECORDED_NOTICE,
  estimateSpeechDurationMs,
  isSpeakableText,
  pickVoiceId,
  speakableTextsFrom,
  speechLanguageFor,
  speechQueueFor,
  speechTextFor,
  type SpeechVoiceOption,
} from '@/services/audio/devSpeech';

describe('speechTextFor', () => {
  it('always returns the `te` form, regardless of what else is present', () => {
    expect(speechTextFor({ te: 'తెలుగు', en: 'English', iast: 'romanized', dev: 'devanagari' })).toBe(
      'తెలుగు',
    );
  });

  it('returns the placeholder as-is when `te` has not been authored yet', () => {
    expect(speechTextFor({ te: '⟨TODO_PANDIT: x⟩', en: 'a dev note' })).toBe(
      '⟨TODO_PANDIT: x⟩',
    );
  });
});

describe('isSpeakableText', () => {
  it('accepts real Telugu content', () => {
    expect(isSpeakableText('శుక్లాంబరధరం విష్ణుం')).toBe(true);
  });

  it('rejects a ⟨TODO_PANDIT: …⟩ placeholder', () => {
    expect(isSpeakableText('⟨TODO_PANDIT: ganapathi_harathi_line_1⟩')).toBe(false);
  });

  it('rejects blank/whitespace-only text', () => {
    expect(isSpeakableText('')).toBe(false);
    expect(isSpeakableText('   ')).toBe(false);
  });
});

describe('speakableTextsFrom', () => {
  it('drops placeholders and blanks, keeps order of the rest', () => {
    expect(
      speakableTextsFrom(['om namah shivaya', '⟨TODO_PANDIT: x⟩', '', 'next line']),
    ).toEqual(['om namah shivaya', 'next line']);
  });

  it('returns an empty array when nothing is speakable', () => {
    expect(speakableTextsFrom(['⟨TODO_PANDIT: x⟩', ''])).toEqual([]);
  });
});

describe('speechQueueFor', () => {
  it('returns the real content as-is when there is any', () => {
    expect(speechQueueFor(['real line one', '⟨TODO_PANDIT: x⟩', 'real line two'])).toEqual([
      'real line one',
      'real line two',
    ]);
  });

  it('returns nothing when nothing was ever asked for', () => {
    expect(speechQueueFor([])).toEqual([]);
  });

  it('speaks the "not yet recorded" notice when something was asked for but none of it is real', () => {
    expect(speechQueueFor(['⟨TODO_PANDIT: naivedyam_line_1⟩'])).toEqual([
      NOT_YET_RECORDED_NOTICE,
    ]);
    expect(speechQueueFor(['⟨TODO_PANDIT: x⟩', ''])).toEqual([NOT_YET_RECORDED_NOTICE]);
  });
});

describe('speechLanguageFor', () => {
  it('picks Telugu for Telugu-script text', () => {
    expect(speechLanguageFor('కుడి చేతిలో అక్షతలు')).toBe('te-IN');
  });

  it('falls back to English for everything else', () => {
    expect(speechLanguageFor('Light camphor and offer harathi.')).toBe('en-US');
  });
});

describe('estimateSpeechDurationMs', () => {
  it('scales roughly with text length', () => {
    const short = estimateSpeechDurationMs('om');
    const long = estimateSpeechDurationMs('om namah shivaya, om namah shivaya, om namah shivaya');
    expect(long).toBeGreaterThan(short);
  });

  it('never returns less than the minimum floor, even for one character', () => {
    expect(estimateSpeechDurationMs('a')).toBeGreaterThanOrEqual(600);
  });
});

describe('DEFAULT_SPEECH_RATE / INTER_LINE_PAUSE_MS', () => {
  it('reads at a deliberately unhurried pace, not the engine default', () => {
    expect(DEFAULT_SPEECH_RATE).toBeLessThan(1);
    expect(DEFAULT_SPEECH_RATE).toBeGreaterThan(0);
  });

  it('pauses a sensible amount between lines — not instant, not a stall', () => {
    expect(INTER_LINE_PAUSE_MS).toBeGreaterThan(0);
    expect(INTER_LINE_PAUSE_MS).toBeLessThan(1000);
  });
});

describe('pickVoiceId', () => {
  const VOICES: SpeechVoiceOption[] = [
    { identifier: 'en-us-default', language: 'en-US', quality: 'Default' },
    { identifier: 'en-us-enhanced', language: 'en-US', quality: 'Enhanced' },
    { identifier: 'hi-in-default', language: 'hi-IN', quality: 'Default' },
  ];

  it('prefers an Enhanced-quality voice over a Default one in the same language', () => {
    expect(pickVoiceId('en-US', VOICES)).toBe('en-us-enhanced');
  });

  it('falls back down the language chain when the exact language has no voice', () => {
    // No `te-IN` voice in the list, but `hi-IN` is next in the fallback chain.
    expect(pickVoiceId('te-IN', VOICES)).toBe('hi-in-default');
  });

  it('returns undefined when nothing in the fallback chain matches', () => {
    expect(pickVoiceId('te-IN', [{ identifier: 'fr', language: 'fr-FR', quality: 'Default' }])).toBeUndefined();
  });

  it('returns undefined for an empty voice list', () => {
    expect(pickVoiceId('en-US', [])).toBeUndefined();
  });
});
