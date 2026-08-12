import { Entities } from '@/entity-store/entities.ts';
import { useEntities } from '@/entity-store/hooks/index.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useLoggedIn } from '@/hooks/useLoggedIn.ts';
import { groupSchema, type Group } from '@/schemas/group.ts';

import { useGroupRelationships } from './useGroupRelationships.ts';

function useGroups(q: string = '') {
  const api = useApi();
  const features = useFeatures();
  const { isLoggedIn } = useLoggedIn();

  const { entities, ...result } = useEntities<Group>(
    [Entities.GROUPS, 'search', q],
    () => api.get('/api/v1/groups', { searchParams: { q } }),
    { enabled: features.groups && isLoggedIn, schema: groupSchema },
  );
  const { relationships } = useGroupRelationships(
    ['search', q],
    entities.map(entity => entity.id),
  );

  const groups = entities.map((group) => ({
    ...group,
    relationship: relationships[group.id] || null,
  }));

  return {
    ...result,
    groups,
  };
}

export { useGroups };
