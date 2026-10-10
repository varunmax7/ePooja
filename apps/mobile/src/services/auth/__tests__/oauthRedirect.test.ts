import { parseOAuthRedirect } from '../oauthRedirect';

describe('parseOAuthRedirect', () => {
  it('reads the access and refresh tokens out of the URL fragment', () => {
    const url = 'epooja://auth-callback#access_token=abc123&refresh_token=def456&token_type=bearer';
    expect(parseOAuthRedirect(url)).toEqual({ accessToken: 'abc123', refreshToken: 'def456' });
  });

  it('returns null when there is no fragment at all', () => {
    expect(parseOAuthRedirect('epooja://auth-callback')).toBeNull();
  });

  it('returns null when the fragment is missing either token', () => {
    expect(parseOAuthRedirect('epooja://auth-callback#access_token=abc123')).toBeNull();
    expect(parseOAuthRedirect('epooja://auth-callback#refresh_token=def456')).toBeNull();
  });

  it('returns null when the user cancelled and the provider sent an error instead', () => {
    const url = 'epooja://auth-callback#error=access_denied&error_description=The+user+cancelled';
    expect(parseOAuthRedirect(url)).toBeNull();
  });
});
