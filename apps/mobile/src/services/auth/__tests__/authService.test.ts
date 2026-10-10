import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { signInWithApple, signInWithGoogle, signOut, isAuthAvailable } from '../authService';

const mockAuth = {
  signInWithOAuth: jest.fn(),
  signInWithIdToken: jest.fn(),
  setSession: jest.fn(),
  signOut: jest.fn(),
};

// `supabase` is read as a live binding by the mock below so each test can
// flip between "no backend" (`null`, the default/guest state every other
// Phase 8 test relies on) and a fake client without re-importing the module.
const mockSupabase = { current: null as null | { auth: typeof mockAuth } };

jest.mock('@/lib/supabase', () => ({
  get supabase() {
    return mockSupabase.current;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.current = null;
});

describe('isAuthAvailable / signOut with no backend configured', () => {
  it('reports unavailable and no-ops signOut', async () => {
    expect(isAuthAvailable()).toBe(false);
    await expect(signOut()).resolves.toBeUndefined();
  });
});

describe('signInWithGoogle', () => {
  beforeEach(() => {
    mockSupabase.current = { auth: mockAuth };
  });

  it('returns no_backend when Supabase is not configured', async () => {
    mockSupabase.current = null;
    expect(await signInWithGoogle()).toEqual({ ok: false, reason: 'no_backend' });
  });

  it('returns provider_error when Supabase has no OAuth URL to open', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });
    expect(await signInWithGoogle()).toEqual({ ok: false, reason: 'provider_error' });
  });

  it('returns cancelled when the browser session is dismissed', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://provider.example/consent' },
      error: null,
    });
    jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValue({ type: 'cancel' } as never);

    expect(await signInWithGoogle()).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('establishes the session from the redirect tokens on success', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://provider.example/consent' },
      error: null,
    });
    jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValue({
      type: 'success',
      url: 'epooja://auth-callback#access_token=abc&refresh_token=def',
    } as never);
    mockAuth.setSession.mockResolvedValue({ error: null });

    expect(await signInWithGoogle()).toEqual({ ok: true });
    expect(mockAuth.setSession).toHaveBeenCalledWith({
      access_token: 'abc',
      refresh_token: 'def',
    });
  });
});

describe('signInWithApple', () => {
  beforeEach(() => {
    mockSupabase.current = { auth: mockAuth };
  });

  it('returns unsupported_platform when the device cannot use Apple sign-in', async () => {
    jest.spyOn(AppleAuthentication, 'isAvailableAsync').mockResolvedValue(false);
    expect(await signInWithApple()).toEqual({ ok: false, reason: 'unsupported_platform' });
  });

  it('returns cancelled when the devotee dismisses the system sheet', async () => {
    jest.spyOn(AppleAuthentication, 'isAvailableAsync').mockResolvedValue(true);
    jest.spyOn(AppleAuthentication, 'signInAsync').mockRejectedValue({
      code: 'ERR_REQUEST_CANCELED',
    });
    expect(await signInWithApple()).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('signs in with the identity token on success', async () => {
    jest.spyOn(AppleAuthentication, 'isAvailableAsync').mockResolvedValue(true);
    jest.spyOn(AppleAuthentication, 'signInAsync').mockResolvedValue({
      identityToken: 'the-identity-token',
    } as never);
    mockAuth.signInWithIdToken.mockResolvedValue({ error: null });

    expect(await signInWithApple()).toEqual({ ok: true });
    expect(mockAuth.signInWithIdToken).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'apple', token: 'the-identity-token' }),
    );
  });
});
