// Minimal react-native-track-player stand-in for Jest. The real module is a
// native module and cannot load outside a dev build.
const listeners = new Map();

module.exports = {
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    skipToNext: jest.fn().mockResolvedValue(undefined),
    skipToPrevious: jest.fn().mockResolvedValue(undefined),
    getPosition: jest.fn().mockResolvedValue(0),
    registerPlaybackService: jest.fn(),
    addEventListener: jest.fn((event, handler) => {
      listeners.set(event, handler);
      return { remove: () => listeners.delete(event) };
    }),
  },
  Capability: { Play: 1, Pause: 2, Stop: 3, SkipToNext: 4, SkipToPrevious: 5, SeekTo: 6 },
  AppKilledPlaybackBehavior: {
    ContinuePlayback: 'continue-playback',
    PausePlaybackAndRemoveNotification: 'pause-playback',
    StopPlaybackAndRemoveNotification: 'stop-playback',
  },
  IOSCategory: { Playback: 'playback' },
  IOSCategoryMode: { SpokenAudio: 'spokenAudio' },
  IOSCategoryOptions: { DuckOthers: 'duckOthers' },
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
    RemoteJumpForward: 'remote-jump-forward',
    RemoteJumpBackward: 'remote-jump-backward',
    PlaybackState: 'playback-state',
  },
  State: { None: 'none', Ready: 'ready', Playing: 'playing', Paused: 'paused' },
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
  usePlaybackState: () => ({ state: 'ready' }),
  useProgress: () => ({ position: 0, duration: 0, buffered: 0 }),
  __listeners: listeners,
};
