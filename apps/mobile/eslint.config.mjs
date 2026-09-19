import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { parser as tsParser, plugin as tsPlugin } from 'typescript-eslint';
import epoojaRules from '@epooja/config/eslint/react-native';

export default [
  {
    ignores: ['dist/**', '.expo/**', 'ios/**', 'android/**', 'expo-env.d.ts'],
  },
  ...expoConfig,
  ...epoojaRules,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      // §15: TypeScript strict; no `any`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Jest support files run in the test environment, not in the app bundle.
    files: ['jest.setup.js', '**/__mocks__/**/*.js', '**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
  {
    // Build-time config files legitimately hold platform literals.
    files: ['*.config.js', '*.config.ts', 'jest.setup.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-restricted-syntax': 'off' },
  },
  prettier,
];
