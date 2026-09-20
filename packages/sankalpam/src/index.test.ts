import { describe, expect, it } from 'vitest';
import { SANKALPAM_PACKAGE } from './index';

describe('package shell', () => {
  it('records the pre-declined-enum contract from §3.6', () => {
    expect(SANKALPAM_PACKAGE.declension).toBe('pre-declined-enum-values');
  });
});
