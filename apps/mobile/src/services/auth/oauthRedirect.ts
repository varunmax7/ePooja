/**
 * Supabase's hosted OAuth flow (`docs/adr/0004-oauth-flow.md`) redirects back
 * to `epooja://auth-callback#access_token=...&refresh_token=...&...` — a URL
 * fragment, not a query string, because it's carrying a bearer token that
 * must never land in a server access log. Parsing it is the one pure step in
 * `signInWithGoogle`; everything around it is a `WebBrowser`/`supabase.auth`
 * call that needs a device to run at all.
 */
export interface OAuthRedirectTokens {
  accessToken: string;
  refreshToken: string;
}

export function parseOAuthRedirect(redirectUrl: string): OAuthRedirectTokens | null {
  const fragmentStart = redirectUrl.indexOf('#');
  if (fragmentStart === -1) return null;

  const params = new URLSearchParams(redirectUrl.slice(fragmentStart + 1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}
