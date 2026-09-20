import { z } from 'zod';
import { teluguOrTodo } from './enums';

/**
 * The devotee-side models from §9.4, with the zod schemas that guard them.
 *
 * These are validated on every rehydrate from storage, not only on write: a
 * shape change between releases, or a half-written record, must land the
 * devotee back in onboarding rather than produce a Devotee whose Sankalpam
 * would name the wrong gotra.
 *
 * The puja, samagri and naivedyam halves of §9.4 land in Phase 4.
 */

export type Script = 'te' | 'dev' | 'iast';
export type Gender = 'male' | 'female';

export const scriptSchema = z.enum(['te', 'dev', 'iast']);
export const genderSchema = z.enum(['male', 'female']);

/**
 * §9.4 makes `te` the primary form. A devotee who never types Telugu leaves it
 * empty and the app displays `en`, so the field is present but may be blank —
 * what is not allowed is a name that is blank in every script.
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

export const RELATIONS = ['spouse', 'son', 'daughter', 'father', 'mother', 'other'] as const;
export type Relation = (typeof RELATIONS)[number];

export const familyMemberSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  relation: z.enum(RELATIONS),
  gender: genderSchema,
  nakshatraId: z.string().optional(),
  rasiId: z.string().optional(),
  includeInSankalpam: z.boolean(),
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;

export const devoteeLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** IANA zone. Required — an NRI devotee's sunrise depends on it (§9.1). */
  tz: z.string().min(1),
  cityId: z.string().optional(),
  /** What the location row shows, e.g. "Hyderabad, Telangana". */
  label: z.string().min(1),
  /** Sankalpam river/region id; resolved in Phase 5. */
  geoRegionId: z.string().optional(),
});

export type DevoteeLocation = z.infer<typeof devoteeLocationSchema>;

export const devoteePrefsSchema = z.object({
  uiLang: z.enum(['te', 'en']),
  mantraScript: scriptSchema,
  showTransliteration: z.boolean(),
  /** §9.6.1: a devotee's own name is self-recited unless they opt into a clone. */
  nameAudio: z.enum(['self_recite', 'pandit_clone']),
});

export type DevoteePrefs = z.infer<typeof devoteePrefsSchema>;

export const devoteeSchema = z
  .object({
    id: z.string().min(1),
    name: localizedTextSchema,
    gender: genderSchema,
    gotraId: z.string().optional(),
    /** Free-text gotra: self-recited until the pandit records it (§8.1). */
    gotraCustom: z.string().optional(),
    nakshatraId: z.string().optional(),
    nakshatraPada: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    rasiId: z.string().optional(),
    location: devoteeLocationSchema,
    family: z.array(familyMemberSchema),
    prefs: devoteePrefsSchema,
    nameAudio: z
      .object({ url: z.string(), localPath: z.string().optional(), hash: z.string() })
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .refine((devotee) => !(devotee.gotraId !== undefined && devotee.gotraCustom !== undefined), {
    message: 'a devotee has either a listed gotra or a custom one, never both',
    path: ['gotraCustom'],
  });

export type Devotee = z.infer<typeof devoteeSchema>;

/**
 * Whether the Sankalpam can be spoken in full for this devotee.
 *
 * §8.1 lets every ritual field be skipped with "I don't know", so an
 * incomplete devotee is a normal state, not an error — the Sankalpam simply
 * has fewer slots filled (Phase 5 renders the rest as ⟨MISSING:slot⟩).
 */
export function missingSankalpamFields(devotee: Devotee): string[] {
  const missing: string[] = [];
  if (devotee.gotraId === undefined && devotee.gotraCustom === undefined) missing.push('gotra');
  if (devotee.nakshatraId === undefined) missing.push('nakshatra');
  if (devotee.rasiId === undefined) missing.push('rasi');
  return missing;
}
