/**
 * @epooja/content — schemas, types and loaders for ritual content (§9.4).
 *
 * Framework-free: no React Native, no Expo (§15). Phase 2 ships the review
 * contract and the enum schema; the puja, samagri and naivedyam schemas land
 * in Phase 4.
 */

export { reviewSchema, isApproved, type Review } from './review';

export {
  enumFileSchema,
  enumValueSchema,
  parseEnumFile,
  pendingFields,
  isFullyAuthored,
  isTodoPandit,
  teluguOrTodo,
  devanagariOrTodo,
  TODO_PANDIT_PATTERN,
  type EnumFile,
  type EnumValue,
} from './enums';

export const CONTENT_PACKAGE = {
  name: '@epooja/content',
  schemaImplementedInPhase: 4,
} as const;
