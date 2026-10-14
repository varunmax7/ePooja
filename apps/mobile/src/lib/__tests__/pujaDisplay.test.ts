import { contentTextFor } from '@/lib/pujaDisplay';

describe('contentTextFor', () => {
  it('returns the real text for the requested script', () => {
    const text = { te: 'తెలుగు', dev: 'देवनागरी', iast: 'romanized', en: 'English' };
    expect(contentTextFor(text, 'te')).toBe('తెలుగు');
    expect(contentTextFor(text, 'dev')).toBe('देवनागरी');
    expect(contentTextFor(text, 'iast')).toBe('romanized');
  });

  it('falls back to `te` when the requested script has not been authored', () => {
    const text = { te: 'తెలుగు' };
    expect(contentTextFor(text, 'dev')).toBe('తెలుగు');
    expect(contentTextFor(text, 'iast')).toBe('తెలుగు');
  });

  it('shows a friendly label instead of the raw ⟨TODO_PANDIT: …⟩ token', () => {
    const text = { te: '⟨TODO_PANDIT: deeparadhana_shloka_line_1⟩' };
    expect(contentTextFor(text, 'te')).toBe('(not yet recorded)');
  });

  it('shows the friendly label for every script, not just `te`', () => {
    // `dev`/`iast` fall back to `te` when absent (same as the real-content
    // case above) — the placeholder is still a placeholder once it does.
    const text = { te: '⟨TODO_PANDIT: x⟩' };
    expect(contentTextFor(text, 'dev')).toBe('(not yet recorded)');
    expect(contentTextFor(text, 'iast')).toBe('(not yet recorded)');
  });
});
