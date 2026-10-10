# ADR 0004: Google sign-in via Supabase's hosted OAuth, Apple sign-in native

**Status:** Proposed (no live Supabase project or device to verify against —
see `supabase/README.md` and the Phase 8 `CHANGELOG.md` entry).

## Context

§10 Phase 8 asks for "optional Google + Sign in with Apple (mandatory on iOS
if Google is offered)." There are two ways to wire Google sign-in into an
Expo app:

1. **Native Google Sign-In SDK** (`@react-native-google-signin/google-signin`)
   — needs `google-services.json` (Android) and a reversed-client-id URL
   scheme (iOS), both generated from a real Google Cloud project, plus the
   app's release SHA-1 fingerprint registered there before it works on a
   signed build.
2. **Supabase's hosted OAuth flow** — `supabase.auth.signInWithOAuth({
provider: 'google', options: { skipBrowserRedirect: true } })` returns a URL;
   the app opens it with `expo-web-browser`'s
   `openAuthSessionAsync` and reads the tokens back off the
   `epooja://auth-callback` redirect. Google's own client id/secret live only
   in the Supabase dashboard, never in the app.

## Decision

Use (2) for Google. It needs no native module, no platform-specific config
file, and nothing in `app.config.ts` beyond the existing `scheme: 'epooja'`.
Given this phase was explicitly scoped to "no Supabase project yet — build
against env vars" (the client has not created a Google Cloud OAuth client
either), a native integration would be unconfigured and unverifiable either
way; the hosted-flow code is complete and correct the moment someone pastes
a provider client id/secret into the Supabase dashboard — no app rebuild
needed.

Apple is different: Apple's own Human Interface Guidelines (and App Review in
practice) expect the native "Sign in with Apple" button, not a web view, when
an app offers other third-party sign-in. `expo-apple-authentication` is used
directly, producing an identity token handed to
`supabase.auth.signInWithIdToken({ provider: 'apple', ... })` — no Supabase
redirect URL involved for this path at all.

## Consequences

- No new native dependency for Google; `expo-apple-authentication` is the
  only native addition, gated behind `app.config.ts`'s
  `ios.usesAppleSignIn` and only ever called on iOS
  (`Platform.OS === 'ios'`).
- Google sign-in is unusable on web builds that cannot open a system browser
  tab back to a custom scheme (the `react-native-web` screenshot harness,
  §2) — acceptable, since that harness never exercises auth.
- If a later phase finds the browser hand-off too slow or wants Android
  One-Tap, swapping in the native Google SDK only touches
  `src/services/auth/authService.ts`'s `signInWithGoogle` — the Supabase
  session it produces, and everything downstream of it (`src/services/sync`),
  is identical either way.
