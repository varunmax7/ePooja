import { z } from 'zod';
import { reviewSchema } from './review';

/**
 * Schema for `content/enums/*.json` (§9.2).
 *
 * Every Sankalpam variable is a finite enumeration, and each value carries its
 * own pre-declined locative form — the builder never declines algorithmically
 * (§3.6) — plus the id of the pandit's recorded audio token (§3.5).
 */

/** §0.4 placeholder for content a pandit still has to supply. */
export const TODO_PANDIT_PATTERN = /^⟨TODO_PANDIT:\s?[a-z0-9_]+⟩$/u;

export const isTodoPandit = (value: string): boolean => TODO_PANDIT_PATTERN.test(value);

/**
 * Telugu block plus the marks and punctuation that legitimately appear in
 * Telugu text. §3.3: the client spec contained a Sinhala glyph inside what
 * looked like Telugu, so pasted text is validated, not trusted.
 */
const TELUGU_TEXT = /^[\p{Script_Extensions=Telugu}\u200C\u200D\s.,'\u2019-]+$/u;

/** Devanagari block, including the Vedic svara marks (§7.3). */
const DEVANAGARI_TEXT = /^[\p{Script_Extensions=Devanagari}\u200C\u200D\s.,'\u2019|()-]+$/u;

/** A string that is either real Telugu or an explicit pandit placeholder. */
export const teluguOrTodo = z
  .string()
  .min(1)
  .refine((v) => isTodoPandit(v) || TELUGU_TEXT.test(v), {
    message:
      'Telugu fields must contain only Telugu-block characters, or be a ⟨TODO_PANDIT: …⟩ placeholder (§0.4, §3.3)',
  });

export const devanagariOrTodo = z
  .string()
  .min(1)
  .refine((v) => isTodoPandit(v) || DEVANAGARI_TEXT.test(v), {
    message: 'Devanagari fields must contain only Devanagari characters, or be a placeholder',
  });

export const enumValueSchema = z.object({
  /** Stable technical key; must match the engine's enumeration. */
  id: z
    .string()
    .regex(/^[a-z][a-z0-9_]*$/, 'ids are lower_snake_case ASCII keys, never display text'),
  index: z.number().int().positive(),
  te: teluguOrTodo,
  iast: z.string().min(1),
  dev: devanagariOrTodo,
  /** Pre-declined Sankalpam phrase, e.g. rohini → రోహిణీ నక్షత్రే (§3.6). */
  locative: z.object({ te: teluguOrTodo, iast: z.string().min(1) }),
  /** Id of the pandit's recording for this value (§3.5). */
  audioTokenId: z.string().regex(/^enum\.[a-z]+\.[a-z0-9_]+$/),
  paksha: z.enum(['shukla', 'krishna']).optional(),
});

export type EnumValue = z.infer<typeof enumValueSchema>;

export const enumFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.string().regex(/^[a-z]+$/),
    note: z.string().optional(),
    review: reviewSchema,
    values: z.array(enumValueSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.values.forEach((value, position) => {
      if (ids.has(value.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate id ${value.id}`,
          path: ['values', position, 'id'],
        });
      }
      ids.add(value.id);

      if (value.index !== position + 1) {
        ctx.addIssue({
          code: 'custom',
          message: `index must be its 1-based position: expected ${position + 1}, got ${value.index}`,
          path: ['values', position, 'index'],
        });
      }

      if (value.audioTokenId !== `enum.${file.kind}.${value.id}`) {
        ctx.addIssue({
          code: 'custom',
          message: `audioTokenId must be enum.${file.kind}.${value.id}`,
          path: ['values', position, 'audioTokenId'],
        });
      }
    });
  });

export type EnumFile = z.infer<typeof enumFileSchema>;

/** Parse and validate an enum file, throwing with a readable path on failure. */
export function parseEnumFile(data: unknown): EnumFile {
  return enumFileSchema.parse(data);
}

/** Every field in a value that still needs a pandit (§0.4). */
export function pendingFields(value: EnumValue): string[] {
  const pending: string[] = [];
  if (isTodoPandit(value.te)) pending.push('te');
  if (isTodoPandit(value.iast)) pending.push('iast');
  if (isTodoPandit(value.dev)) pending.push('dev');
  if (isTodoPandit(value.locative.te)) pending.push('locative.te');
  if (isTodoPandit(value.locative.iast)) pending.push('locative.iast');
  return pending;
}

/** True once nothing in the file is a placeholder — the Phase 10 release gate. */
export function isFullyAuthored(file: EnumFile): boolean {
  return file.values.every((value) => pendingFields(value).length === 0);
}
