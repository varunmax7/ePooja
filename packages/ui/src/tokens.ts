import raw from './tokens.json' with { type: 'json' };

/**
 * Design tokens — the §7.2 palette, verbatim.
 *
 * The values live in `tokens.json` so that exactly one file holds them: this
 * module types them for components and Skia drawings, and
 * `apps/mobile/tailwind.config.js` requires the same JSON for the NativeWind
 * theme. §15 forbids colour, font and spacing literals anywhere else.
 */

export interface ColorScale {
  readonly [step: string]: string;
}

export interface Colors {
  readonly maroon: ColorScale;
  readonly saffron: ColorScale;
  readonly gold: ColorScale;
  readonly cream: ColorScale;
  readonly ink: ColorScale;
  readonly success: string;
  readonly danger: string;
}

export interface ShadowToken {
  readonly color: string;
  readonly y: number;
  readonly blur: number;
}

export const colors: Colors = raw.colors;

/** Multi-stop gradients; Skia and expo-linear-gradient consume the same arrays. */
export const gradients: {
  readonly saffronHeader: readonly string[];
  readonly goldCoin: readonly string[];
  readonly maroonHeader: readonly string[];
} = raw.gradients;

export const radius: { readonly [k in 'sm' | 'md' | 'lg' | 'xl' | 'pill']: number } = raw.radius;

/**
 * Spacing scale (§7.2); index into it rather than writing pixel values. Typed
 * as a fixed tuple so `spacing[4]` stays a `number` under
 * `noUncheckedIndexedAccess`.
 */
export type SpacingScale = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const spacing = raw.spacing as unknown as SpacingScale;

export const shadow: { readonly card: ShadowToken; readonly raised: ShadowToken } = raw.shadow;

/**
 * Elevation as React Native style props. §7.1 asks for soft warm shadows, so
 * the shadow colour is a warm brown rather than black.
 */
export function elevation(token: ShadowToken): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  return {
    shadowColor: token.color,
    shadowOffset: { width: 0, height: token.y },
    // The alpha already lives in the token's rgba colour.
    shadowOpacity: 1,
    shadowRadius: token.blur / 2,
    elevation: token.y,
  };
}
