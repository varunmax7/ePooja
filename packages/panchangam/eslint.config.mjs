import purePackage from '@epooja/config/eslint/pure-package';

export default [
  ...purePackage,
  {
    // The benchmark harness is a CLI script; printing the table is its job.
    files: ['bench/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];
