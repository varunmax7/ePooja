/**
 * Expo config plugin: patch react-native-track-player's MusicModule.kt
 * to fix the Kotlin "Bundle? vs Bundle" type mismatch that causes Gradle
 * to fail on EAS Build (Kotlin 1.9+ / Gradle 9 strict null checking).
 *
 * The fix: wherever Arguments.toBundle(x) is passed to a function that
 * expects a non-nullable Bundle, we add ?: android.os.Bundle() fallback.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withRntpKotlinFix = (config) => {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const musicModulePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'react-native-track-player',
        'android',
        'src',
        'main',
        'java',
        'com',
        'doublesymmetry',
        'trackplayer',
        'module',
        'MusicModule.kt',
      );

      if (!fs.existsSync(musicModulePath)) {
        console.warn('[withRntpKotlinFix] MusicModule.kt not found, skipping patch.');
        return config;
      }

      let content = fs.readFileSync(musicModulePath, 'utf8');
      let patched = false;

      // Fix 1: Arguments.toBundle(map) passed to setMetadata (expects Bundle, not Bundle?)
      const fix1 = content.replace(
        /track\.setMetadata\(context,\s*Arguments\.toBundle\(map\),/g,
        'track.setMetadata(context, Arguments.toBundle(map) ?: android.os.Bundle(),',
      );
      if (fix1 !== content) {
        content = fix1;
        patched = true;
        console.log('[withRntpKotlinFix] Applied fix 1: setMetadata Bundle? null safety.');
      }

      // Fix 2: Any other Arguments.toBundle() calls passed directly to functions
      // expecting non-null Bundle (catch-all for line 588 variant)
      const fix2 = content.replace(
        /musicService\.updateNowPlayingMetadata\(Arguments\.toBundle\(([^)]+)\)\)/g,
        'musicService.updateNowPlayingMetadata(Arguments.toBundle($1) ?: android.os.Bundle())',
      );
      if (fix2 !== content) {
        content = fix2;
        patched = true;
        console.log(
          '[withRntpKotlinFix] Applied fix 2: updateNowPlayingMetadata Bundle? null safety.',
        );
      }

      // Fix 3: updateMetadataForTrack direct call variant
      const fix3 = content.replace(
        /musicService\.updateMetadataForTrack\(index,\s*Arguments\.toBundle\(([^)]+)\)\)/g,
        'musicService.updateMetadataForTrack(index, Arguments.toBundle($1) ?: android.os.Bundle())',
      );
      if (fix3 !== content) {
        content = fix3;
        patched = true;
        console.log(
          '[withRntpKotlinFix] Applied fix 3: updateMetadataForTrack Bundle? null safety.',
        );
      }

      if (patched) {
        fs.writeFileSync(musicModulePath, content, 'utf8');
        console.log('[withRntpKotlinFix] MusicModule.kt patched successfully.');
      } else {
        console.log('[withRntpKotlinFix] No changes needed (already fixed or different version).');
      }

      return config;
    },
  ]);
};

module.exports = withRntpKotlinFix;
