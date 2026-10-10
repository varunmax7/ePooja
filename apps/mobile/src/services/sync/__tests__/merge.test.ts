import type { Devotee } from '@epooja/content';
import { resolveDevoteeMerge } from '../merge';

function devotee(updatedAt: string): Devotee {
  return {
    id: 'devotee_1',
    name: { te: 'రాముడు', en: 'Ramudu' },
    gender: 'male',
    location: { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata', label: 'Hyderabad' },
    family: [],
    prefs: {
      uiLang: 'en',
      mantraScript: 'te',
      showTransliteration: true,
      nameAudio: 'self_recite',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
  };
}

describe('resolveDevoteeMerge', () => {
  it('does nothing when neither side has a devotee', () => {
    expect(resolveDevoteeMerge(null, null)).toEqual({ action: 'none' });
  });

  it('pulls the remote devotee when there is no local one yet', () => {
    const remote = devotee('2026-01-01T00:00:00.000Z');
    expect(resolveDevoteeMerge(null, remote)).toEqual({ action: 'pull', devotee: remote });
  });

  it('pushes the local devotee when there is no remote row yet (first sign-in)', () => {
    const local = devotee('2026-01-01T00:00:00.000Z');
    expect(resolveDevoteeMerge(local, null)).toEqual({ action: 'push', devotee: local });
  });

  it('pulls when the remote edit is strictly newer', () => {
    const local = devotee('2026-01-01T00:00:00.000Z');
    const remote = devotee('2026-02-01T00:00:00.000Z');
    expect(resolveDevoteeMerge(local, remote)).toEqual({ action: 'pull', devotee: remote });
  });

  it('pushes when the local edit is strictly newer', () => {
    const local = devotee('2026-02-01T00:00:00.000Z');
    const remote = devotee('2026-01-01T00:00:00.000Z');
    expect(resolveDevoteeMerge(local, remote)).toEqual({ action: 'push', devotee: local });
  });

  it('pushes on an exact tie rather than treating it as a third outcome', () => {
    const local = devotee('2026-01-01T00:00:00.000Z');
    const remote = devotee('2026-01-01T00:00:00.000Z');
    expect(resolveDevoteeMerge(local, remote)).toEqual({ action: 'push', devotee: local });
  });
});
