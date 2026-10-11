import { describe, expect, it } from 'vitest';
import { checkProductionGate } from './productionGate';
import type { ScanReport } from './scan';

const clean: ScanReport = {
  files: [
    {
      file: 'approved.json',
      reviewStatus: 'APPROVED',
      reviewer: 'Pandit Someone',
      placeholders: [],
    },
  ],
  totalPlaceholders: 0,
  filesPendingReview: 0,
};

const dirty: ScanReport = {
  files: [
    {
      file: 'approved.json',
      reviewStatus: 'APPROVED',
      reviewer: 'Pandit Someone',
      placeholders: [],
    },
    {
      file: 'pujas/nitya-puja.json',
      reviewStatus: 'PENDING_PANDIT_REVIEW',
      reviewer: null,
      placeholders: [{ file: 'pujas/nitya-puja.json', path: 'title.te', id: 'nitya_title' }],
    },
  ],
  totalPlaceholders: 1,
  filesPendingReview: 1,
};

describe('checkProductionGate', () => {
  it('never gates a preview upload, clean or dirty', () => {
    expect(checkProductionGate(clean, 'preview')).toEqual([]);
    expect(checkProductionGate(dirty, 'preview')).toEqual([]);
  });

  it('passes a production upload with zero placeholders and every file APPROVED', () => {
    expect(checkProductionGate(clean, 'production')).toEqual([]);
  });

  it('fails a production upload with any TODO_PANDIT placeholder remaining', () => {
    const failures = checkProductionGate(dirty, 'production');
    expect(failures.some((f) => f.reason.includes('placeholder'))).toBe(true);
    expect(failures.some((f) => f.reason.includes('pujas/nitya-puja.json'))).toBe(true);
  });

  it('fails a production upload with any file not APPROVED, even with zero placeholders', () => {
    const pendingNoPlaceholders: ScanReport = {
      files: [
        {
          file: 'cities.json',
          reviewStatus: 'PENDING_PANDIT_REVIEW',
          reviewer: null,
          placeholders: [],
        },
      ],
      totalPlaceholders: 0,
      filesPendingReview: 1,
    };
    const failures = checkProductionGate(pendingNoPlaceholders, 'production');
    expect(failures.some((f) => f.reason.includes('cities.json'))).toBe(true);
  });

  it('fails on a file with no review block at all', () => {
    const noReview: ScanReport = {
      files: [{ file: 'mystery.json', reviewStatus: null, reviewer: null, placeholders: [] }],
      totalPlaceholders: 0,
      filesPendingReview: 0,
    };
    const failures = checkProductionGate(noReview, 'production');
    expect(failures.some((f) => f.reason.includes('mystery.json'))).toBe(true);
  });
});
