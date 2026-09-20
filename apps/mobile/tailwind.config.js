/**
 * NativeWind theme, wired to the §7.2 tokens.
 *
 * It requires the same `tokens.json` that `@epooja/ui` types and exports, so
 * the palette has exactly one definition. §15's lint rule then has something to
 * point at: components use `bg-maroon-900`, not `#4A0F1E`.
 */
const tokens = require('@epooja/ui/tokens.json');

const px = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([key, value]) => [key, `${value}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // v1 is light-only (§10 Phase 1); dark mode arrives in v1.x as an explicit
  // class rather than following the OS, so the app can force light today.
  darkMode: 'class',
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: px(tokens.radius),
      spacing: Object.fromEntries(tokens.spacing.map((value, index) => [index, `${value}px`])),
      boxShadowColor: {
        card: tokens.shadow.card.color,
        raised: tokens.shadow.raised.color,
      },
    },
  },
  plugins: [],
};
