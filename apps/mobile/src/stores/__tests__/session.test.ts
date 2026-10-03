import { storage } from '@/lib/storage';
import { useSessionStore, type PujaResumePoint } from '@/stores/session';

const RESUME: PujaResumePoint = {
  pujaId: 'nitya-puja-short',
  variant: 'short',
  mode: 'guided',
  stepIndex: 3,
  startedAt: '2026-09-21T06:00:00.000Z',
  exitedAt: '2026-09-21T06:05:00.000Z',
};

beforeEach(() => {
  storage.clearAll();
  useSessionStore.setState({ resumePoints: {}, log: [], hydrated: true });
});

describe('resume points', () => {
  it('has nothing to resume for a puja never started', () => {
    expect(useSessionStore.getState().resumePointFor('nitya-puja-short')).toBeUndefined();
  });

  it('saves and reads back a resume point', () => {
    useSessionStore.getState().saveResumePoint(RESUME);
    expect(useSessionStore.getState().resumePointFor('nitya-puja-short')).toEqual(RESUME);
  });

  it('overwrites the previous resume point for the same puja', () => {
    useSessionStore.getState().saveResumePoint(RESUME);
    useSessionStore.getState().saveResumePoint({ ...RESUME, stepIndex: 7 });
    expect(useSessionStore.getState().resumePointFor('nitya-puja-short')?.stepIndex).toBe(7);
  });

  it('keeps different pujas’ resume points independent', () => {
    useSessionStore.getState().saveResumePoint(RESUME);
    expect(useSessionStore.getState().resumePointFor('ganapathi-puja')).toBeUndefined();
  });

  it('clears a resume point explicitly', () => {
    useSessionStore.getState().saveResumePoint(RESUME);
    useSessionStore.getState().clearResumePoint('nitya-puja-short');
    expect(useSessionStore.getState().resumePointFor('nitya-puja-short')).toBeUndefined();
  });
});

describe('logCompletedSession', () => {
  it('appends a completed session to the log, newest first', () => {
    useSessionStore.getState().logCompletedSession({
      pujaId: 'nitya-puja-short',
      variant: 'short',
      mode: 'guided',
      startedAt: '2026-09-21T06:00:00.000Z',
      completedAt: '2026-09-21T06:12:00.000Z',
      completedSteps: 12,
    });
    useSessionStore.getState().logCompletedSession({
      pujaId: 'ganapathi-puja',
      variant: 'full',
      mode: 'chant',
      startedAt: '2026-09-22T06:00:00.000Z',
      completedAt: '2026-09-22T06:20:00.000Z',
      completedSteps: 20,
    });

    const log = useSessionStore.getState().log;
    expect(log).toHaveLength(2);
    expect(log[0]?.pujaId).toBe('ganapathi-puja');
    expect(log[0]?.id).toBeTruthy();
  });

  it('clears any pending resume point for the puja it completes', () => {
    useSessionStore.getState().saveResumePoint(RESUME);
    useSessionStore.getState().logCompletedSession({
      pujaId: RESUME.pujaId,
      variant: RESUME.variant,
      mode: RESUME.mode,
      startedAt: RESUME.startedAt,
      completedAt: '2026-09-21T06:15:00.000Z',
      completedSteps: 12,
    });
    expect(useSessionStore.getState().resumePointFor(RESUME.pujaId)).toBeUndefined();
  });

  it('caps the log at 200 entries, dropping the oldest', () => {
    for (let i = 0; i < 205; i += 1) {
      useSessionStore.getState().logCompletedSession({
        pujaId: `puja-${i}`,
        variant: 'short',
        mode: 'chant',
        startedAt: '2026-09-21T06:00:00.000Z',
        completedAt: '2026-09-21T06:10:00.000Z',
        completedSteps: 1,
      });
    }
    const log = useSessionStore.getState().log;
    expect(log).toHaveLength(200);
    expect(log[0]?.pujaId).toBe('puja-204');
    expect(log.some((entry) => entry.pujaId === 'puja-0')).toBe(false);
  });
});
