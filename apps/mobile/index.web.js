/**
 * Web entry.
 *
 * Web is not a shipping target — the product is iOS and Android (§2). It exists
 * so the design system can be rendered and screenshotted for the Phase 1
 * acceptance check (docs/screens/p1/), and CanvasKit has to be ready before any
 * Skia component mounts.
 *
 * `require` rather than `import()`: Metro's dev server bundles lazily, and a
 * dynamic import of the router entry resolves to an unknown module.
 */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .then(() => {
    require('expo-router/entry');
  })
  .catch((error) => {
    console.error('Failed to load CanvasKit for web', error);
  });
