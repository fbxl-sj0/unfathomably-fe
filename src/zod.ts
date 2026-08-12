/*
 * Unfathomably FE
 * ----------------
 *
 * File: src/zod.ts
 *
 * Purpose:
 *
 *   Provide the subset of Zod used by the frontend through a tree-shakeable
 *   module namespace.
 *
 * Responsibilities:
 *
 *   - preserve the existing `z.object`, `z.infer`, and related call sites
 *   - export only constructors and types used by Unfathomably
 *   - keep Zod locales and JSON-schema generators out of normal application
 *     startup
 *
 * This file intentionally does NOT contain:
 *
 *   - application schemas
 *   - validation policy
 *   - locale configuration
 */

export {
  NEVER,
  ZodIssueCode,
  ZodType,
  any,
  array,
  boolean,
  coerce,
  custom,
  discriminatedUnion,
  enum,
  ipv4,
  ipv6,
  literal,
  nativeEnum,
  null,
  number,
  object,
  preprocess,
  record,
  string,
  tuple,
  union,
  unknown,
} from 'zod/v4';

export type {
  infer,
  ZodRawShape,
  ZodTypeAny,
} from 'zod/v4';

/* end of src/zod.ts */
