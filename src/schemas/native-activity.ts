/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/schemas/native-activity.ts

  Purpose:

    Parse the bounded presentation metadata emitted for ActivityPub extension
    objects and activities.

  Responsibilities:

    * retain the native type and application-level context
    * limit fields to scalar values and URI arrays the UI can render safely
    * expose only controls the backend has declared honest

  This file intentionally does NOT contain:

    * raw ActivityPub objects
    * capability inference
    * presentation components
*/

import * as z from '@/zod.ts';

const nativeActivityFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

const nativeActivityPresentationSchema = z.object({
  canonical_id: z.string().min(1),
  class: z.string().min(1),
  context: z.string().nullable().catch(null),
  controls: z.array(z.string()).catch([]),
  fields: z.record(z.string(), nativeActivityFieldValueSchema).catch({}),
  type: z.string().min(1),
}).nullable().catch(null);

type NativeActivityPresentation = Exclude<z.infer<typeof nativeActivityPresentationSchema>, null>;
type NativeActivityFieldValue = z.infer<typeof nativeActivityFieldValueSchema>;

export {
  nativeActivityFieldValueSchema,
  nativeActivityPresentationSchema,
  type NativeActivityFieldValue,
  type NativeActivityPresentation,
};

/* end of src/schemas/native-activity.ts */
