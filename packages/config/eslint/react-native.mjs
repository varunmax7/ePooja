/**
 * Rules layered on top of `eslint-config-expo` inside apps/mobile.
 * Encodes two content rules from implementation.md §15:
 *   - no colour/font/spacing literals in components — use `@epooja/ui` tokens
 *   - no ritual text in `.tsx` — Telugu/Devanagari/IAST text lives in content JSON
 */

// Telugu (U+0C00–U+0C7F) and Devanagari (U+0900–U+097F, U+A8E0–U+A8FF, U+1CD0–U+1CFF).
const INDIC_TEXT =
  String.raw`[\u0900-\u097F\u0C00-\u0C7F\u1CD0-\u1CFF\uA8E0-\uA8FF]`;
const HEX_COLOR = String.raw`^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`;
const CSS_COLOR_FN = String.raw`^(?:rgba?|hsla?)\(`;

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${INDIC_TEXT}/]`,
          message:
            'No ritual text in code (§15). Put Telugu/Devanagari text in content JSON or i18n resources and reference it by id.',
        },
        {
          selector: `TemplateElement[value.raw=/${INDIC_TEXT}/]`,
          message:
            'No ritual text in code (§15). Put Telugu/Devanagari text in content JSON or i18n resources and reference it by id.',
        },
        {
          selector: `Literal[value=/${HEX_COLOR}/]`,
          message: 'No colour literals in components (§15). Import from @epooja/ui tokens.',
        },
        {
          selector: `Literal[value=/${CSS_COLOR_FN}/]`,
          message: 'No colour literals in components (§15). Import from @epooja/ui tokens.',
        },
      ],
    },
  },
  {
    // Tokens, theme wiring and generated files are where the raw values legitimately live.
    files: [
      '**/tokens.ts',
      '**/theme.ts',
      '**/tailwind.config.js',
      '**/i18n/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
