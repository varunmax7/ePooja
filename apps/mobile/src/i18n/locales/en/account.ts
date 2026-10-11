/**
 * Account & Sync, Privacy Policy and Storage & Offline Packs (§10 Phase 8
 * screens). `privacy.title`/`privacy.draftBanner` are the only Privacy Policy
 * strings here — the policy's own legal body text is left exactly as written
 * (CHANGELOG Phase 8: a first draft pending legal counsel's sign-off, not UI
 * chrome a translation pass should touch).
 */
export default {
  account: {
    signedIn: 'Signed in',
    accountFallback: 'Account',
    providerGoogle: 'Google',
    providerApple: 'Apple',
    lastSynced: 'Last synced {{date}}',
    notSyncedYet: 'Not synced yet',
    guestTitle: "You're using ePooja as a guest",
    guestBody:
      'Your profile stays on this device. Sign in to back it up and use it on another phone.',
    signInWithGoogle: 'Sign in with Google',
    openingGoogle: 'Opening Google…',
    signInWithApple: 'Sign in with Apple',
    openingApple: 'Opening Apple…',
    noBackend: 'This build has no backend configured — sign-in will work once one is.',
    signOut: 'Sign out',
    deleteMyAccount: 'Delete my account',
    deleteConfirmWarning:
      'This permanently deletes your account, synced profile and puja history from our servers. Your profile stays on this device.',
    confirmDelete: 'Confirm delete',
    deleting: 'Deleting…',
    deleteGenericError: 'Could not delete your account. Please try again, or contact support.',
    privacyPolicyLink: 'Privacy Policy',
    failureNoBackend: 'Sign-in is not set up in this build yet.',
    failureUnsupportedPlatform: 'This sign-in method is not available on this device.',
    failureCancelled: 'Sign-in was cancelled.',
    failureProviderError: 'Something went wrong — please try again.',
  },
  privacy: {
    title: 'Privacy Policy',
    draftBanner:
      'Draft — not yet reviewed by legal counsel. Do not submit to an app store until this is replaced with an approved policy and the placeholders below are filled in.',
  },
  storage: {
    statusBundled: 'Bundled with the app',
    statusNotDownloaded: 'Not downloaded',
    statusDownloading: 'Downloading…',
    statusDownloaded: 'Downloaded',
    statusFailed: 'Download failed',
    checkForUpdates: 'Check for updates',
    checking: 'Checking…',
    upToDate: 'Everything is up to date.',
    // Kept as one template rather than i18next's `_one`/`_other` plural
    // suffixes — RN's Hermes engine doesn't ship full ICU plural-rule data
    // for every locale, and the original English copy ("pack(s)") already
    // didn't bother distinguishing the count grammatically.
    updatedCount: 'Updated {{count}} pack(s).',
    noBackend:
      'This build has no backend configured — every puja above is the one bundled with the app.',
  },
};
