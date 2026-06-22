import { z } from 'zod';

const bookmarkFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().nullable().catch(null),
  emoji_url: z.string().url().nullable().catch(null),
});

type BookmarkFolder = z.infer<typeof bookmarkFolderSchema>;

export { bookmarkFolderSchema, type BookmarkFolder };
