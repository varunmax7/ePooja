/**
 * What the Phase 1 gate captures.
 *
 * The mockup screens §10 names come first and are marked `reference` — those
 * are the four that get compared side by side with `docs/reference/ui-reference.png`.
 * The rest are captured so the three widths §10 lists are demonstrably laid out,
 * not just asserted.
 */

export interface Viewport {
  /** Goes into the file name. */
  id: string;
  label: string;
  width: number;
  height: number;
}

/** The three sizes §10 Phase 1 requires the layouts to hold at. */
export const VIEWPORTS: readonly Viewport[] = [
  { id: '360x640', label: 'Small Android — 360 × 640', width: 360, height: 640 },
  { id: '390x844', label: 'iPhone 14 / 15 — 390 × 844', width: 390, height: 844 },
  { id: '430x932', label: 'iPhone 15 Pro Max — 430 × 932', width: 430, height: 932 },
] as const;

/** The viewport the Dynamic Type pass is captured at. */
export const TYPE_VIEWPORT_ID = '390x844';

/** "Dynamic Type up to 130%" (§10 Phase 1). */
export const TYPE_SCALES: readonly number[] = [1, 1.3];

export interface Screen {
  /** Goes into the file name. */
  id: string;
  title: string;
  /** Path on the Expo web dev server. */
  route: string;
  /** One of the four mockup screens the acceptance check compares against. */
  reference?: boolean;
}

export const SCREENS: readonly Screen[] = [
  { id: 'today', title: 'Today', route: '/', reference: true },
  { id: 'profile', title: 'My Profile', route: '/profile', reference: true },
  {
    id: 'prepare',
    title: 'Pooja Preparation',
    route: '/pooja/nitya-puja/prepare',
    reference: true,
  },
  { id: 'player', title: 'Chant Player', route: '/player/nitya-puja', reference: true },
  { id: 'calendar', title: 'Vedic Calendar', route: '/calendar' },
  { id: 'poojas', title: 'Poojas', route: '/poojas' },
  { id: 'pooja-detail', title: 'Pooja detail', route: '/pooja/nitya-puja' },
  { id: 'recipe', title: 'Recipe', route: '/pooja/nitya-puja/recipe/pulihora' },
  { id: 'components', title: 'Component gallery', route: '/_dev/components' },
] as const;

/**
 * The dev-only `?fontScale=` override `apps/mobile/src/lib/fontScale.ts` reads.
 * Web has no OS text size, so the harness supplies one.
 */
export function routeUrl(baseUrl: string, screen: Screen, fontScale: number): string {
  const url = new URL(screen.route, baseUrl);
  if (fontScale !== 1) url.searchParams.set('fontScale', String(fontScale));
  return url.toString();
}

export function fileName(screen: Screen, viewport: Viewport, fontScale: number): string {
  const type = fontScale === 1 ? '' : `-type${Math.round(fontScale * 100)}`;
  return `${screen.id}-${viewport.id}${type}.png`;
}

export interface Shot {
  screen: Screen;
  viewport: Viewport;
  fontScale: number;
  file: string;
}

/**
 * Every screen at every width at 100%, plus the reference screens again at
 * 130% on the middle width — enough to prove Dynamic Type without tripling
 * the number of PNGs in the repo.
 */
export function plan(
  screens: readonly Screen[] = SCREENS,
  viewports: readonly Viewport[] = VIEWPORTS,
): Shot[] {
  const shots: Shot[] = [];

  for (const screen of screens) {
    for (const viewport of viewports) {
      shots.push({ screen, viewport, fontScale: 1, file: fileName(screen, viewport, 1) });
    }
  }

  const typeViewport = viewports.find((v) => v.id === TYPE_VIEWPORT_ID);
  if (typeViewport) {
    for (const screen of screens.filter((s) => s.reference)) {
      for (const scale of TYPE_SCALES.filter((s) => s !== 1)) {
        shots.push({
          screen,
          viewport: typeViewport,
          fontScale: scale,
          file: fileName(screen, typeViewport, scale),
        });
      }
    }
  }

  return shots;
}
