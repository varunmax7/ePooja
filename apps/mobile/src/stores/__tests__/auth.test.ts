import { useAuthStore } from '@/stores/auth';

beforeEach(() => {
  useAuthStore.setState({
    status: 'loading',
    userId: null,
    email: null,
    provider: null,
    lastSyncedAt: null,
  });
});

describe('useAuthStore', () => {
  it('starts in the loading state until the session is known', () => {
    expect(useAuthStore.getState().status).toBe('loading');
  });

  it('setGuest clears any signed-in identity and the sync timestamp', () => {
    useAuthStore.getState().setSignedIn({ userId: 'u1', email: 'a@b.com', provider: 'google' });
    useAuthStore.getState().setLastSyncedAt('2026-01-01T00:00:00.000Z');

    useAuthStore.getState().setGuest();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      userId: null,
      email: null,
      provider: null,
      lastSyncedAt: null,
    });
  });

  it('setSignedIn records the provider and identity', () => {
    useAuthStore.getState().setSignedIn({ userId: 'u1', email: null, provider: 'apple' });

    expect(useAuthStore.getState()).toMatchObject({
      status: 'signed_in',
      userId: 'u1',
      email: null,
      provider: 'apple',
    });
  });
});
