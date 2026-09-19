/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      // Ritual content files are authored and reviewed by pandits; keep them
      // stable and diff-friendly rather than reformatted by tooling churn.
      files: 'content/**/*.json',
      options: { printWidth: 120 },
    },
  ],
};
