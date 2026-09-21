import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseNaivedyamFile,
  parsePujaFile,
  parsePujaStepTemplateFile,
  parseSamagriFile,
  type PujaCatalogItem,
} from '@epooja/content';
import { enrichDeep } from './transliterate';
import { scanContent } from './scan';
import { renderReviewQueue } from './reviewQueue';

/**
 * `pnpm content:build` (§10 Phase 4).
 *
 * Validates every content file against its §9.4 schema, transliterates the
 * Telugu a pandit authored into Devanagari and IAST, emits one versioned
 * pack per puja plus its audio manifest, and regenerates
 * `content/REVIEW_QUEUE.md`.
 *
 * Fails loudly on any schema error — a puja that does not parse must never
 * reach a devotee's device — and reports the `TODO_PANDIT` count without
 * failing on it, because placeholders are the expected state until the
 * pandit's review lands (§0.4); Phase 10 is where that count must reach zero.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '../../..');
const CONTENT_DIR = join(REPO_ROOT, 'content');
const DIST_DIR = join(HERE, '../dist');

const PUJA_FILES = ['nitya-puja', 'ganapathi-puja', 'lakshmi-puja', 'shiva-puja'];
const STEP_TEMPLATES = ['_shodashopachara'];

interface BuildFailure {
  file: string;
  message: string;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function main(): Promise<void> {
  const failures: BuildFailure[] = [];
  console.log('Building content…\n');

  // 1. Validate the shared catalogues first: a puja references these by id,
  //    so a broken samagri file would otherwise surface as a confusing
  //    downstream error rather than the real one.
  let samagriIds = new Set<string>();
  let naivedyamIds = new Set<string>();

  try {
    const samagri = parseSamagriFile(await readJson(join(CONTENT_DIR, 'samagri/items.json')));
    samagriIds = new Set(samagri.items.map((item) => item.id));
    console.log(`  samagri/items.json — ${samagri.items.length} items`);
  } catch (error) {
    failures.push({ file: 'samagri/items.json', message: describeError(error) });
  }

  try {
    const naivedyam = parseNaivedyamFile(
      await readJson(join(CONTENT_DIR, 'naivedyam/recipes.json')),
    );
    naivedyamIds = new Set(naivedyam.recipes.map((recipe) => recipe.id));
    console.log(`  naivedyam/recipes.json — ${naivedyam.recipes.length} recipes`);
  } catch (error) {
    failures.push({ file: 'naivedyam/recipes.json', message: describeError(error) });
  }

  for (const name of STEP_TEMPLATES) {
    const file = `pujas/${name}.json`;
    try {
      const template = parsePujaStepTemplateFile(await readJson(join(CONTENT_DIR, file)));
      console.log(`  ${file} — ${template.steps.length} shared steps`);
    } catch (error) {
      failures.push({ file, message: describeError(error) });
    }
  }

  // 2. Validate each puja, check its cross-references, and emit its pack.
  const built: PujaCatalogItem[] = [];

  for (const name of PUJA_FILES) {
    const file = `pujas/${name}.json`;
    try {
      const puja = parsePujaFile(await readJson(join(CONTENT_DIR, file)));

      for (const id of puja.samagri) {
        if (samagriIds.size > 0 && !samagriIds.has(id)) {
          failures.push({ file, message: `references unknown samagri id "${id}"` });
        }
      }
      for (const id of puja.naivedyam) {
        if (naivedyamIds.size > 0 && !naivedyamIds.has(id)) {
          failures.push({ file, message: `references unknown naivedyam id "${id}"` });
        }
      }
      for (const step of puja.steps) {
        for (const id of step.samagriUsed ?? []) {
          if (samagriIds.size > 0 && !samagriIds.has(id)) {
            failures.push({
              file,
              message: `step "${step.id}" uses unknown samagri id "${id}"`,
            });
          }
        }
      }

      built.push(puja);
      console.log(`  ${file} — ${puja.steps.length} steps`);
    } catch (error) {
      failures.push({ file, message: describeError(error) });
    }
  }

  // 3. Stop before writing anything if the content does not parse. A partial
  //    dist/ is worse than none: it looks like a successful build.
  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} schema error${failures.length === 1 ? '' : 's'}:\n`);
    for (const failure of failures) {
      console.error(`  ${failure.file}`);
      console.error(`    ${failure.message.split('\n').join('\n    ')}\n`);
    }
    process.exitCode = 1;
    return;
  }

  // 4. Emit one pack per puja: the validated, transliterated JSON plus an
  //    audio manifest. The manifest is empty until Phase 6 records anything
  //    (§9.6), but the pack's shape is fixed now so the app's loader and the
  //    download path (Phase 8) have something stable to target.
  await rm(DIST_DIR, { recursive: true, force: true });

  for (const puja of built) {
    const enriched = enrichDeep(puja);
    const packDir = join(DIST_DIR, 'packs', `${puja.id}@${puja.pack.version}`);
    await mkdir(packDir, { recursive: true });

    await writeFile(join(packDir, 'pack.json'), `${JSON.stringify(enriched, null, 2)}\n`);
    await writeFile(
      join(packDir, 'audio-manifest.json'),
      `${JSON.stringify(
        {
          pujaId: puja.id,
          version: puja.pack.version,
          note: 'Empty until §9.6 recording starts in Phase 6. Every clip must be a real pandit recording (§9.6.1).',
          clips: [],
        },
        null,
        2,
      )}\n`,
    );

    console.log(`  → dist/packs/${puja.id}@${puja.pack.version}/`);
  }

  // 5. Regenerate the review queue.
  const report = scanContent(CONTENT_DIR);
  const queuePath = join(CONTENT_DIR, 'REVIEW_QUEUE.md');
  const existing = existsSync(queuePath) ? await readFile(queuePath, 'utf8') : null;
  await writeFile(queuePath, renderReviewQueue(report, existing));

  console.log(`\n✓ ${built.length} packs built, 0 schema errors`);
  console.log(
    `  ${report.totalPlaceholders} TODO_PANDIT placeholder${report.totalPlaceholders === 1 ? '' : 's'} across ${report.files.length} content files`,
  );
  console.log(`  ${report.filesPendingReview} file(s) still PENDING_PANDIT_REVIEW`);
  console.log('  content/REVIEW_QUEUE.md regenerated — run `pnpm format` before committing it');
}

await main();
