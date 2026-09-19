// Custom entry: the RNTP playback service must be registered with the native
// headless task before the first playback starts (§9.6, Phase 0 spike).
import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './src/services/audio/playbackService';

TrackPlayer.registerPlaybackService(() => playbackService);
