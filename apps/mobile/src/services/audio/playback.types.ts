/**
 * Shared between `useQueuePlayback.ts` (native, `react-native-track-player`)
 * and `useQueuePlayback.web.ts` (web, `expo-audio` — RNTP's web build pulls
 * in `shaka-player`, which `metro.config.js` deliberately stubs out on
 * `platform === 'web'`, so RNTP is web-silent by this app's own design).
 * Lives in its own file rather than either implementation file so neither
 * has to import from the other — Metro's `.web.ts` resolution would make a
 * cross-import between them resolve to whichever one is "self" on a given
 * platform.
 */
export interface QueuePlayback {
  playing: boolean;
  position: number;
  duration: number;
  play: () => void;
  pause: () => void;
  setRate: (rate: number) => void;
}
