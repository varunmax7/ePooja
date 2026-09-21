import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { scanContent } from './scan';
import { renderReviewQueue, GENERATED_MARKER } from './reviewQueue';

const dir = mkdtempSync(join(tmpdir(), 'epooja-scan-'));
mkdirSync(join(dir, 'pujas'), { recursive: true });

writeFileSync(
  join(dir, 'pujas/sample.json'),
  JSON.stringify({
    id: 'sample',
    review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
    title: { te: 'నిత్య పూజ' },
    steps: [{ id: 's1', chant: { lines: [{ text: { te: '⟨TODO_PANDIT: line_one⟩' } }] } }],
  }),
);

writeFileSync(
  join(dir, 'approved.json'),
  JSON.stringify({
    review: { status: 'APPROVED', reviewer: 'Pandit Someone', date: '2026-01-01' },
    value: { te: 'నమః' },
  }),
);

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('scanContent', () => {
  const report = scanContent(dir);

  it('finds every JSON file, including nested ones', () => {
    expect(report.files.map((f) => f.file).sort()).toEqual(['approved.json', 'pujas/sample.json']);
  });

  it('finds placeholders at any depth, with their dotted path and id', () => {
    const sample = report.files.find((f) => f.file === 'pujas/sample.json');
    expect(sample?.placeholders).toEqual([
      { file: 'pujas/sample.json', path: 'steps.0.chant.lines.0.text.te', id: 'line_one' },
    ]);
  });

  it("reads each file's review status and reviewer", () => {
    const approved = report.files.find((f) => f.file === 'approved.json');
    expect(approved?.reviewStatus).toBe('APPROVED');
    expect(approved?.reviewer).toBe('Pandit Someone');
  });

  it('counts placeholders and files still pending review', () => {
    expect(report.totalPlaceholders).toBe(1);
    expect(report.filesPendingReview).toBe(1);
  });

  it('does not mistake authored Telugu for a placeholder', () => {
    const approved = report.files.find((f) => f.file === 'approved.json');
    expect(approved?.placeholders).toEqual([]);
  });
});

describe('renderReviewQueue', () => {
  const report = scanContent(dir);

  it('lists each file with a placeholder, and its ids', () => {
    const md = renderReviewQueue(report, null);
    expect(md).toContain(GENERATED_MARKER);
    expect(md).toContain('`pujas/sample.json`');
    expect(md).toContain('`line_one`');
  });

  it('preserves a hand-written Non-code dependencies section', () => {
    const existing = `# Old\n\n## Non-code dependencies started in Phase 0\n\n| Item | Status |\n| ---- | ------ |\n| Find a pandit | not started |\n`;
    const md = renderReviewQueue(report, existing);

    expect(md).toContain('## Non-code dependencies started in Phase 0');
    expect(md).toContain('| Find a pandit | not started |');
    // …and still regenerates the placeholder block above it.
    expect(md).toContain('`line_one`');
  });

  it('says so plainly when nothing is left pending', () => {
    const md = renderReviewQueue({ files: [], totalPlaceholders: 0, filesPendingReview: 0 }, null);
    expect(md).toContain('No `⟨TODO_PANDIT: …⟩` placeholders remain');
  });
});
