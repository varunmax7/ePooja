/**
 * Phase 0 wires NativeWind to Tailwind with the §7.2 palette so the shell screen
 * is already themed. Phase 1 replaces these literals with `@epooja/ui` tokens
 * as the single source of truth.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        maroon: {
          950: '#2E0912',
          900: '#4A0F1E',
          800: '#5E1426',
          700: '#6E1A2E',
          600: '#7D2235',
          500: '#94304A',
        },
        saffron: {
          600: '#E07F22',
          500: '#F0A040',
          400: '#F6B85C',
          300: '#FAD08E',
          200: '#FCE3B8',
        },
        gold: {
          700: '#A77B26',
          600: '#C09236',
          500: '#D4A548',
          400: '#E1BC68',
          300: '#E9CC85',
          200: '#F3E2B6',
        },
        cream: {
          50: '#FFFBF5',
          100: '#FFF6E9',
          200: '#FBEFDB',
          300: '#F3E3C4',
          400: '#E9D3AA',
        },
        ink: {
          900: '#2B1A12',
          700: '#4A3325',
          500: '#6B5444',
          400: '#8C7563',
        },
        success: '#3E8E4F',
        danger: '#B3261E',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
