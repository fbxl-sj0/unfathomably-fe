/*
  Unfathomably FE
  ----------------

  File: useActiveNostrGroups.ts

  Purpose:
    Load active Nostr communities from the backend discovery catalogue.

  Responsibilities:
    - normalize discovered groups through the standard group schema
    - attach the current account's group relationships

  This file intentionally does NOT contact Nostr relays or rank communities.
*/

import { Entities } from '@/entity-store/entities.ts';
import { useEntities } from '@/entity-store/hooks/index.ts';
import { useApi } from '@/hooks/useApi.ts';
import { type Group, groupSchema } from '@/schemas/index.ts';

import { useGroupRelationships } from './useGroupRelationships.ts';

function useActiveNostrGroups() {
  const api = useApi();

  const { entities, ...result } = useEntities<Group>(
    [Entities.GROUPS, 'active-nostr'],
    () => api.get('/api/v1/groups/discover', { searchParams: { limit: 24 } }),
    { schema: groupSchema },
  );

  const { relationships } = useGroupRelationships(
    ['active-nostr'],
    entities.map(entity => entity.id),
  );

  return {
    ...result,
    groups: entities.map(group => ({
      ...group,
      relationship: relationships[group.id] || null,
    })),
  };
}

export { useActiveNostrGroups };

/* end of useActiveNostrGroups.ts */
