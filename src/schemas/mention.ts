import * as z from '@/zod.ts';

const mentionSchema = z.object({
  acct: z.string(),
  actor_type: z.string().catch('Person'),
  id: z.string(),
  url: z.string().url().catch(''),
  username: z.string().catch(''),
}).transform((mention) => {
  if (!mention.username) {
    mention.username = mention.acct.split('@')[0];
  }

  return mention;
});

type Mention = z.infer<typeof mentionSchema>;

export { mentionSchema, type Mention };
