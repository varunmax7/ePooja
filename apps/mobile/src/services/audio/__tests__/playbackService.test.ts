import TrackPlayer, { Event } from 'react-native-track-player';
import { playbackService } from '../playbackService';
import { resetTrackPlayerSetupForTests, setupTrackPlayer } from '../trackPlayer';

describe('playbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTrackPlayerSetupForTests();
  });

  it('registers every remote control the lock screen can send', async () => {
    await playbackService();

    const registered = (TrackPlayer.addEventListener as jest.Mock).mock.calls.map(([e]) => e);
    expect(registered).toEqual(
      expect.arrayContaining([
        Event.RemotePlay,
        Event.RemotePause,
        Event.RemoteStop,
        Event.RemoteNext,
        Event.RemotePrevious,
        Event.RemoteSeek,
      ]),
    );
  });
});

describe('setupTrackPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTrackPlayerSetupForTests();
  });

  it('sets the player up only once however often it is called', async () => {
    await Promise.all([setupTrackPlayer(), setupTrackPlayer(), setupTrackPlayer()]);
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);
  });

  it('handles audio interruptions so a call never leaves the devotee mid-mantra', async () => {
    await setupTrackPlayer();
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ autoHandleInterruptions: true }),
    );
  });
});
