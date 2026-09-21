import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isTodoPandit } from '@epooja/content';

/**
 * Walks `content/` looking for everything still waiting on a pandit — the
 * `⟨TODO_PANDIT: …⟩` placeholders §0.4 defines and the `review.status` block
 * §0.3 puts on every file — so `REVIEW_QUEUE.md` can be generated rather than
 * maintained by hand (§10 Phase 4 acceptance).
 */

export interface PendingPlaceholder {
  /** Path relative to `content/`, e.g. `pujas/nitya-puja.json`. */
  file: string;
  /** Dotted path to the field, e.g. `steps.0.chant.lines.0.text.te`. */
  path: string;
  /** The placeholder id inside the ⟨TODO_PANDIT: …⟩ marker. */
  id: string;
}

export interface ContentFileReport {
  file: string;
  reviewStatus: string | null;
  reviewer: string | null;
  placeholders: PendingPlaceholder[];
}

export interface ScanReport {
  files: ContentFileReport[];
  totalPlaceholders: number;
  filesPendingReview: number;
}

function listJsonFiles(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...listJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      found.push(full);
    }
  }

  return found.sort();
}

/** Extracts the id from a `⟨TODO_PANDIT: some_id⟩` marker. */
function placeholderId(value: string): string {
  return value.replace(/^⟨TODO_PANDIT:\s?/u, '').replace(/⟩$/u, '');
}

function collectPlaceholders(
  value: unknown,
  file: string,
  path: string[] = [],
): PendingPlaceholder[] {
  if (typeof value === 'string') {
    return isTodoPandit(value) ? [{ file, path: path.join('.'), id: placeholderId(value) }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectPlaceholders(item, file, [...path, String(index)]),
    );
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectPlaceholders(entry, file, [...path, key]),
    );
  }

  return [];
}

/** Scans every JSON file under `contentDir` for pending pandit work. */
export function scanContent(contentDir: string): ScanReport {
  const files: ContentFileReport[] = [];

  for (const absolute of listJsonFiles(contentDir)) {
    const file = relative(contentDir, absolute);
    const parsed: unknown = JSON.parse(readFileSync(absolute, 'utf8'));

    const review = (parsed as { review?: { status?: string; reviewer?: string | null } }).review;

    files.push({
      file,
      reviewStatus: review?.status ?? null,
      reviewer: review?.reviewer ?? null,
      placeholders: collectPlaceholders(parsed, file),
    });
  }

  return {
    files,
    totalPlaceholders: files.reduce((sum, f) => sum + f.placeholders.length, 0),
    filesPendingReview: files.filter((f) => f.reviewStatus === 'PENDING_PANDIT_REVIEW').length,
  };
}
