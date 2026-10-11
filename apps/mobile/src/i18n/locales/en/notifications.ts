/**
 * Text baked into a scheduled OS notification at schedule time (§10 Phase 9).
 * Not reactive like the rest of the UI — a notification already sitting in
 * the OS scheduler can't re-render when `uiLang` changes later, so
 * `notificationService.rescheduleReminders` re-runs (and re-bakes this) on
 * every `uiLang` change, the same way it does on a location change.
 */
export default {
  body: "It's time for your puja.",
};
