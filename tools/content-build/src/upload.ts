import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createClient } from '@supabase/supabase-js';

/**
 * `pnpm content:build -- --upload --channel preview|production` (§10 Phase
 * 8: "`tools/content-build --upload --channel preview|production` → Storage
 * + `content_packs` row").
 *
 * Only ever called with the **service role** key, as a build-time secret —
 * never the app's anon key, and never committed (§13: "no service keys in
 * the app"). `supabase/README.md` documents where that key comes from.
 */

export interface UploadOptions {
  channel: 'preview' | 'production';
  supabaseUrl: string;
  serviceRoleKey: string;
}

export interface BuiltPack {
  id: string;
  version: string;
  /** Absolute path to `dist/packs/{id}@{version}`. */
  dir: string;
}

const STORAGE_BUCKET = 'content-packs';

export function parseUploadArgs(argv: string[]): {
  upload: boolean;
  channel: 'preview' | 'production';
} {
  const upload = argv.includes('--upload');
  const channelIndex = argv.indexOf('--channel');
  const channelArg = channelIndex !== -1 ? argv[channelIndex + 1] : undefined;

  if (channelArg !== undefined && channelArg !== 'preview' && channelArg !== 'production') {
    throw new Error(`--channel must be "preview" or "production", got "${channelArg}"`);
  }

  return { upload, channel: channelArg ?? 'production' };
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFilesRecursive(full)));
    else files.push(full);
  }
  return files;
}

function contentTypeFor(path: string): string {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.m4a')) return 'audio/mp4';
  return 'application/octet-stream';
}

/**
 * Uploads one built pack's files to Storage and upserts its `content_packs`
 * row. `sha256`/`size_bytes` describe `pack.json` itself — the one file the
 * app actually parses before trusting anything else about the pack — not
 * the whole directory, so a devotee's "is this pack intact" check matches
 * exactly what `pack-manifest` hands them.
 */
export async function uploadPack(pack: BuiltPack, options: UploadOptions): Promise<void> {
  const supabase = createClient(options.supabaseUrl, options.serviceRoleKey);
  const files = await listFilesRecursive(pack.dir);
  const storagePrefix = `${options.channel}/${pack.id}@${pack.version}`;

  for (const filePath of files) {
    const relativePath = relative(pack.dir, filePath);
    const body = await readFile(filePath);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${storagePrefix}/${relativePath}`, body, {
        contentType: contentTypeFor(filePath),
        upsert: true,
      });
    if (error) throw new Error(`upload failed for ${relativePath}: ${error.message}`);
  }

  const packJsonPath = join(pack.dir, 'pack.json');
  const packJson = await readFile(packJsonPath);
  const sha256 = createHash('sha256').update(packJson).digest('hex');
  const { size: sizeBytes } = await stat(packJsonPath);

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(`${storagePrefix}/pack.json`);

  const { error: upsertError } = await supabase.from('content_packs').upsert(
    {
      id: pack.id,
      version: pack.version,
      channel: options.channel,
      manifest_url: publicUrlData.publicUrl,
      size_bytes: sizeBytes,
      sha256,
      published_at: new Date().toISOString(),
    },
    { onConflict: 'id,version,channel' },
  );

  if (upsertError)
    throw new Error(`content_packs upsert failed for ${pack.id}: ${upsertError.message}`);
}

export function resolveUploadOptions(channel: 'preview' | 'production'): UploadOptions {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    supabaseUrl ? null : 'SUPABASE_URL',
    serviceRoleKey ? null : 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((name): name is string => name !== null);

  if (missing.length > 0 || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `--upload needs ${missing.join(' and ')} in the environment (see supabase/README.md §4). ` +
        'Nothing was uploaded.',
    );
  }

  return { channel, supabaseUrl, serviceRoleKey };
}
