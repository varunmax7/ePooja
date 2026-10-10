import { storage } from '@/lib/storage';
import { useConsentStore, hasAcceptedDpdpConsent } from '@/stores/consent';

beforeEach(() => {
  storage.clearAll();
  useConsentStore.setState({ acceptedAt: null });
});

describe('useConsentStore', () => {
  it('starts with no consent recorded', () => {
    expect(hasAcceptedDpdpConsent(useConsentStore.getState())).toBe(false);
  });

  it('records a timestamp on accept', () => {
    useConsentStore.getState().accept();
    const state = useConsentStore.getState();
    expect(hasAcceptedDpdpConsent(state)).toBe(true);
    expect(state.acceptedAt).not.toBeNull();
  });

  it('forgets consent on reset ("delete my data")', () => {
    useConsentStore.getState().accept();
    useConsentStore.getState().reset();
    expect(hasAcceptedDpdpConsent(useConsentStore.getState())).toBe(false);
  });
});
