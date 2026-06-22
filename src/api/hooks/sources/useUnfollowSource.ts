import { Entities } from '@/entity-store/entities.ts';
import { useEntityActions } from '@/entity-store/hooks/index.ts';
import { sourceRelationshipSchema } from '@/schemas/index.ts';

import type { Source, SourceRelationship } from '@/schemas/index.ts';

function useUnfollowSource(source: Source) {
  const { createEntity, isSubmitting } = useEntityActions<SourceRelationship>(
    [Entities.SOURCE_RELATIONSHIPS, source.id],
    { post: `/api/v1/sources/${source.id}/unfollow` },
    { schema: sourceRelationshipSchema },
  );

  return {
    mutate: createEntity,
    isSubmitting,
    invalidate: () => undefined,
  };
}

export { useUnfollowSource };
