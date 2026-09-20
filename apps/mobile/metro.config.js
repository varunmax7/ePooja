// Metro config for a pnpm monorepo: watch the workspace root so the app can
// resolve `@epooja/*` source packages, and layer in NativeWind's CSS transform.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// react-native-track-player's *web* build pulls in shaka-player. The product
// ships on iOS and Android, where RNTP uses the native players; web exists only
// so the design system can be rendered and screenshotted (docs/screens). Stub
// the dependency rather than carrying a DASH player we will never use.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('shaka-player')) {
    return { type: 'empty' };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
