import { z } from 'zod';
import { teluguOrTodo } from './enums';

/**
 * §9.4's `Script`, `Gender` and `LocalizedText` — shared by the devotee
 * record and every puja/samagri/naivedyam content file, so this lives on its
 * own rather than under `devotee.ts`.
 */

export type Script = 'te' | 'dev' | 'iast';
export type Gender = 'male' | 'female';

export const scriptSchema = z.enum(['te', 'dev', 'iast']);
export const genderSchema = z.enum(['male', 'female']);

/**
 * §9.4 makes `te` the primary form. A name (devotee or family) may leave it
 * empty and fall back to `en`; ritual content (puja titles, instructions,
 * chants) is expected to always carry real Telugu or a `⟨TODO_PANDIT: …⟩`
 * placeholder — `contentTextSchema` below enforces that stricter rule.
 */
export const localizedTextSchema = z
  .object({
    te: z.union([z.literal(''), teluguOrTodo]),
    dev: z.string().optional(),
    iast: z.string().optional(),
    en: z.string().optional(),
  })
  .refine((value) => value.te.trim().length > 0 || (value.en?.trim().length ?? 0) > 0, {
    message: 'a name must be readable in at least one script',
  });

export type LocalizedText = z.infer<typeof localizedTextSchema>;

/**
 * The stricter form for puja/samagri/naivedyam content: `te` is never blank,
 * only real Telugu or a pandit placeholder (§0.4) — unlike a devotee's own
 * name, ritual content has no "leave it blank" option.
 */
export const contentTextSchema = z.object({
  te: teluguOrTodo,
  dev: z.string().optional(),
  iast: z.string().optional(),
  en: z.string().optional(),
});

export type ContentText = z.infer<typeof contentTextSchema>;

/** The form a name is displayed in, preferring the devotee's own script. */
export function displayName(name: LocalizedText, script: 'te' | 'en' = 'en'): string {
  if (script === 'te' && name.te.trim().length > 0) return name.te;
  return name.en?.trim() || name.te;
}

/** Up to two initials for the avatar ring (§7.4), from whichever form exists. */
export function initialsOf(name: LocalizedText): string {
  const source = (name.en?.trim() || name.te.trim()).split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((word) => [...word][0] ?? '')
    .join('')
    .toLocaleUpperCase();
}
