import base from './base.mjs';

/**
 * Preset for framework-free packages (panchangam, sankalpam, content).
 * §15: "Pure packages must not import React Native or Expo."
 */
export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-native', 'react-native/*', 'expo', 'expo-*', '@expo/*', 'react', 'react/*'],
              message:
                'Pure packages must stay framework-free (implementation.md §15). Move UI-bound code into apps/mobile.',
            },
          ],
        },
      ],
    },
  },
];
