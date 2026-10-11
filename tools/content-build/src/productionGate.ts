import type { ScanReport } from './scan';

/**
 * §10 Phase 10 acceptance: "build fails if any `TODO_PANDIT` or `PENDING`
 * remains in the production channel." Everywhere else — plain
 * `pnpm content:build`, and `--upload --channel preview` — placeholders are
 * the expected state until a pandit's review lands (§0.4), so this only
 * gates an actual `--upload --channel production` run; nothing else calls it.
 */
export interface ProductionGateFailure {
  reason: string;
}

export function checkProductionGate(
  report: ScanReport,
  channel: 'preview' | 'production',
): ProductionGateFailure[] {
  if (channel !== 'production') return [];

  const failures: ProductionGateFailure[] = [];

  if (report.totalPlaceholders > 0) {
    const filesWithPlaceholders = report.files.filter((file) => file.placeholders.length > 0);
    failures.push({
      reason: `${report.totalPlaceholders} ⟨TODO_PANDIT: …⟩ placeholder${report.totalPlaceholders === 1 ? '' : 's'} remain across ${filesWithPlaceholders.length} file(s): ${filesWithPlaceholders.map((f) => f.file).join(', ')}`,
    });
  }

  const notApproved = report.files.filter((file) => file.reviewStatus !== 'APPROVED');
  if (notApproved.length > 0) {
    failures.push({
      reason: `${notApproved.length} content file(s) are not APPROVED: ${notApproved.map((f) => `${f.file} (${f.reviewStatus ?? 'no review block'})`).join(', ')}`,
    });
  }

  return failures;
}
