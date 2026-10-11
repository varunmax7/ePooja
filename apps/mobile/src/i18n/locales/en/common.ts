/**
 * UI chrome reused across screens — buttons, loading/error/empty states, a11y
 * hints. Nothing ritual lives here (§15); see `i18n/onboarding.ts` for the
 * Telugu-script literals that are data, not translations.
 */
export default {
  continue: 'Continue',
  begin: 'Begin',
  back: 'Back',
  cancel: 'Cancel',
  save: 'Save',
  done: 'Done',
  retry: 'Retry',
  edit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  optional: 'optional',
  tapToChoose: 'Tap to choose',
  loading: 'Loading…',
  somethingWentWrong: 'Something went wrong.',
  noInternet: 'You appear to be offline. Some features may be limited.',
  comingSoon: 'Coming soon.',

  // The bottom tab bar's four labels. Short on purpose — the tab bar has far
  // less width than a screen header, which is why these aren't just reused
  // from `today.headerTitle` ("Vedic Calendar – Today") or `profile.title`
  // ("My Profile").
  tabToday: 'Today',
  tabPoojas: 'Poojas',
  tabCalendar: 'Calendar',
  tabProfile: 'Profile',
};
