import { describe, expect, it } from 'vitest';
import { UI_PACKAGE } from './index.js';

describe('package shell', () => {
  it('is named for the workspace scope', () => {
    expect(UI_PACKAGE.name).toBe('@epooja/ui');
  });
});
