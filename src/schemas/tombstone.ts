import * as z from '@/zod.ts';

const tombstoneSchema = z.object({
  reason: z.enum(['deleted']),
});

type Tombstone = z.infer<typeof tombstoneSchema>;

export { tombstoneSchema, type Tombstone };