/**
 * Captures the Phase 1 acceptance screenshots into `docs/screens/p1/`.
 *
 *   pnpm --filter @epooja/mobile exec expo start --web   # in another shell
 *   pnpm screens:capture
 *
 * Web is not a shipping target (§2). It exists so the design system can be
 * rendered at the three widths §10 Phase 1 names, at 100% and 130% Dynamic
 * Type, without a device farm. Animation behaviour and the 60 fps bar still
 * need a real mid-range Android — see `docs/screens/p1/README.md`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './cdp.js';
import { plan, routeUrl, type Shot } from './screens.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '../../../docs/screens/p1');

const BASE_URL = process.env.EPOOJA_WEB_URL ?? 'http://localhost:8081';
/** Retina, so the side-by-side against the mockup is not comparing blur. */
const DEVICE_SCALE_FACTOR = 2;
/** The first route has to wait for Metro to bundle the whole app. */
const READY_TIMEOUT_MS = 180_000;
/** After the tree mounts: fonts, CanvasKit, and the entry animations landing. */
const SETTLE_MS = 1_500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** True once React has mounted something and the §7.3 faces are usable. */
const READY_EXPRESSION = `(() => {
  const root = document.getElementById('root');
  if (!root || root.childElementCount === 0) return false;
  if (document.body.innerText.trim().length === 0) return false;
  return document.fonts.status === 'loaded';
})()`;

async function waitForApp(
  send: (method: string, params?: Record<string, unknown>) => Promise<Record<string, unknown>>,
): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { result } = (await send('Runtime.evaluate', {
      expression: READY_EXPRESSION,
      returnByValue: true,
      awaitPromise: false,
    })) as { result: { value?: unknown } };

    if (result.value === true) return;
    await sleep(250);
  }
  throw new Error('The app never finished rendering — is the Expo web dev server running?');
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const response = await fetch(BASE_URL).catch(() => null);
  if (!response?.ok) {
    throw new Error(
      `No dev server at ${BASE_URL}. Start one with:\n` +
        `  pnpm --filter @epooja/mobile exec expo start --web`,
    );
  }

  const chrome = await launchChrome();
  const shots: Shot[] = plan();
  console.log(`Capturing ${shots.length} screenshots into docs/screens/p1 …\n`);

  try {
    await chrome.send('Page.enable');
    await chrome.send('Runtime.enable');

    for (const shot of shots) {
      const { screen, viewport, fontScale } = shot;

      await chrome.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        mobile: true,
      });

      // A full reload per shot: expo-router keeps screen state (accordions,
      // toggles, the checklist) across a client-side navigation, and every
      // screenshot should show the screen as a devotee first meets it.
      await chrome.send('Page.navigate', { url: routeUrl(BASE_URL, screen, fontScale) });
      await waitForApp(chrome.send);
      await sleep(SETTLE_MS);

      const { data } = (await chrome.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      })) as { data: string };

      await writeFile(join(OUT_DIR, shot.file), Buffer.from(data, 'base64'));
      console.log(`  ${shot.file}  ${viewport.label}  @ ${Math.round(fontScale * 100)}% type`);
    }
  } finally {
    await chrome.close();
  }

  console.log(`\nDone. ${shots.length} files in docs/screens/p1.`);
}

await main();
