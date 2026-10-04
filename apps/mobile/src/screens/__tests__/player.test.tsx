import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { NewDevotee } from '@/stores/devotee';
import { useDevoteeStore } from '@/stores/devotee';
import { useSessionStore } from '@/stores/session';
import PlayerScreen from '../../../app/player/[slug]';

/**
 * §10 Phase 6 acceptance: "complete Nitya Puja end-to-end in both modes with
 * placeholder audio." No real clip ever resolves yet (§9.6 recording has not
 * started), so `useQueuePlayback` treats every step's audio as finished the
 * instant it would start — which is exactly what lets this test drive the
 * *whole* runner (every step, pause/resume, exit, completion) inside Jest
 * rather than needing a device: the thing under test is the Puja Runner's
 * wiring, not the sound.
 */

let mockSearchParams: { slug?: string; variant?: string } = { slug: 'nitya-puja' };
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
// A stable object, the same way the real `useRouter()` returns one across
// renders — a fresh object here (easy to do by accident in a factory) would
// make any effect that depends on `router` re-fire every render.
const mockRouter = { back: mockBack, push: mockPush, replace: mockReplace };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
}));

// `CurvedHeader`'s imperative Skia path isn't covered by the declarative
// `<Canvas>` mock the other components here rely on; this screen never uses
// it, so nothing is stubbed beyond the router.
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const DEVOTEE: NewDevotee = {
  name: { te: 'రాముడు', en: 'Ramudu' },
  gender: 'male',
  gotraCustom: 'భరద్వాజ',
  location: {
    lat: 17.385,
    lng: 78.4867,
    tz: 'Asia/Kolkata',
    label: 'Hyderabad, Telangana',
    countryCode: 'IN',
  },
  prefs: { mantraScript: 'te', uiLang: 'en', showTransliteration: true, nameAudio: 'self_recite' },
};

async function stepCaption() {
  return waitFor(() => screen.getByText(/^Step \d+ of \d+:/));
}

/** Presses "Next" once, or "Done" first if the action prompt is showing. */
async function advanceOneStep() {
  const done = screen.queryByText('Done');
  if (done) fireEvent.press(done);
  await waitFor(() => {
    expect(screen.getByLabelText('Next step')).toBeTruthy();
  });
  fireEvent.press(screen.getByLabelText('Next step'));
}

beforeEach(() => {
  mockSearchParams = { slug: 'nitya-puja' };
  mockBack.mockClear();
  mockPush.mockClear();
  useDevoteeStore.setState({ devotee: null, onboardedAt: null, hydrated: true });
  useDevoteeStore.getState().createDevotee(DEVOTEE);
  useSessionStore.setState({ resumePoints: {}, log: [], hydrated: true });
});

describe('PlayerScreen', () => {
  it('shows a fallback for an unknown puja slug rather than crashing', async () => {
    mockSearchParams = { slug: 'not-a-real-puja' };
    await render(<PlayerScreen />, { wrapper });
    expect(screen.getByText("That pooja isn't in this app yet.")).toBeTruthy();
  });

  it("starts on the Nitya Puja's first step once ready", async () => {
    await render(<PlayerScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/^Step 1 of \d+:/)).toBeTruthy();
    });
  });

  it('completes the whole Nitya Puja end-to-end, step by step', async () => {
    await render(<PlayerScreen />, { wrapper });
    await stepCaption();

    // 12 steps in the short variant per content/pujas/nitya-puja.json; a
    // generous ceiling guards against an infinite loop if a future content
    // change adds steps without this test being updated.
    for (let i = 0; i < 20; i += 1) {
      if (screen.queryByText('Pooja Sampoornam')) break;
      // Each step's transition depends on the previous one having landed, so
      // these must run in sequence, not concurrently.
      await advanceOneStep();
    }

    await waitFor(() => {
      expect(screen.getByText('Pooja Sampoornam')).toBeTruthy();
    });

    const log = useSessionStore.getState().log;
    expect(log).toHaveLength(1);
    expect(log[0]?.pujaId).toBe('nitya-puja-short');
    expect(useSessionStore.getState().resumePointFor('nitya-puja-short')).toBeUndefined();
  });

  it('exits mid-puja, saving a resume point and navigating back', async () => {
    await render(<PlayerScreen />, { wrapper });
    await stepCaption();

    fireEvent.press(screen.getByLabelText('Close player'));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
    const resume = useSessionStore.getState().resumePointFor('nitya-puja-short');
    expect(resume?.stepIndex).toBe(0);
  });

  it('§10 Phase 7: shows the self-recite prompt for the Sankalpam’s gotra and name, dismissible by tap', async () => {
    await render(<PlayerScreen />, { wrapper });
    await stepCaption();

    // deeparadhana, achamanam, ganapathi-dhyanam — three steps before the
    // Sankalpam (content/pujas/nitya-puja.json's own order for the short variant).
    await advanceOneStep();
    await advanceOneStep();
    await advanceOneStep();
    await waitFor(() => {
      expect(screen.getByText(/^Step 4 of \d+:/)).toBeTruthy();
    });

    // The Sankalpam step's own guided instruction has an action prompt —
    // confirming it is what enters the chanting phase that runs the plan.
    fireEvent.press(screen.getByText('Done'));

    await waitFor(() => {
      expect(screen.getByText('Say your gotra aloud')).toBeTruthy();
    });
    expect(screen.getByText('భరద్వాజ')).toBeTruthy(); // the devotee's own custom gotra, self-recited verbatim
    fireEvent.press(screen.getByLabelText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Say your name aloud')).toBeTruthy();
    });
    expect(screen.getByText('రాముడు')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Continue'));

    // Finishing the Sankalpam's own audio plan reaches `done`, not the next
    // step — autoAdvance is off, so "Next step" still has to be pressed.
    await waitFor(() => {
      expect(screen.queryByText('Say your name aloud')).toBeNull();
    });
    expect(screen.getByText(/^Step 4 of \d+:/)).toBeTruthy();
  });

  it('switches between Chant and Guided mode via the toggle', async () => {
    await render(<PlayerScreen />, { wrapper });
    await stepCaption();

    fireEvent.press(screen.getByText('Chant Mode'));
    fireEvent.press(screen.getByText('Guided Narration Mode'));
    // No crash, and the toggle is still there to press — the machine's own
    // SET_MODE handling is covered exhaustively in pujaRunner.machine.test.ts.
    expect(screen.getByText('Guided Narration Mode')).toBeTruthy();
  });
});
