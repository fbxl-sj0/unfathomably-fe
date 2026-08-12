import * as z from '@/zod.ts';

const patronUserSchema = z.object({
  is_patron: z.boolean().catch(false),
  url: z.string().url(),
}).transform((patron) => {
  return {
    id: patron.url,
    ...patron,
  };
});

type PatronUser = z.infer<typeof patronUserSchema>;

export { patronUserSchema, type PatronUser };