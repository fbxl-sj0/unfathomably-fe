import { Entities } from '@/entity-store/entities.ts';
import { useEntities } from '@/entity-store/hooks/index.ts';
import { getBookmarks } from '@/api/rebased/interop.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { Status as StatusEntity, statusSchema } from '@/schemas/index.ts';

/**
 * Get all the statuses the user has bookmarked.
 * https://docs.joinmastodon.org/methods/bookmarks/#get
 * GET /api/v1/bookmarks
 * TODO: add 'limit'
 */
function useBookmarks(folderId?: string | null) {
  const api = useApi();
  const features = useFeatures();

  const { entities, ...result } = useEntities<StatusEntity>(
    folderId ? [Entities.STATUSES, 'bookmarks', folderId] : [Entities.STATUSES, 'bookmarks'],
    () => getBookmarks(api, folderId),
    { enabled: features.bookmarks, schema: statusSchema },
  );

  const bookmarks = entities;

  return {
    ...result,
    bookmarks,
  };
}

export { useBookmarks };
