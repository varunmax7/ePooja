import purePackage from '@epooja/config/eslint/pure-package';

export default [
  ...purePackage,
  {
    files: ['src/**/*.ts'],
    // This is a CLI tool: printing the audit report is the whole point.
    rules: { 'no-console': 'off' },
  },
];
