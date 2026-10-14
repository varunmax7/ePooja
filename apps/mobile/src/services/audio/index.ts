export { playbackService } from './playbackService';
export { setupTrackPlayer, resetTrackPlayerSetupForTests } from './trackPlayer';
export { buildStepQueue, type AudioQueuePhase, type AudioQueueTrack } from './queue';
export { BUNDLED_AUDIO_MANIFEST, resolveClipUrl } from './manifest';
export { devPlaceholderManifestFor, DEV_PLACEHOLDER_AUDIO_ENABLED } from './devPlaceholder';
export { useQueuePlayback } from './useQueuePlayback';
export { useDevSpeechPlayback } from './useDevSpeechPlayback';
export { speechTextFor } from './devSpeech';
export type { QueuePlayback } from './playback.types';
