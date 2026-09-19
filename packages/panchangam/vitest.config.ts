import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    benchmark: { include: ['bench/**/*.bench.ts'] },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types.ts'],
      thresholds: {
        // §10 Phase 2 acceptance: 100% branch coverage on the anga calculators.
        'src/angas.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
        'src/kalams.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
        'src/math.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
        'src/ayanamsa.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
      },
    },
  },
});
