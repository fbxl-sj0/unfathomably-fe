import { Entities } from '@/entity-store/entities.ts';
import { useEntities } from '@/entity-store/hooks/index.ts';
import { useApi } from '@/hooks/useApi.ts';
import { normalizeStatus } from '@/normalizers/index.ts';
import { toSchema } from '@/utils/normalizers.ts';

import type { EntitySchema } from '@/entity-store/hooks/types.ts';
import type { Status } from '@/types/entities.ts';

const statusSchema = toSchema(normalizeStatus);

function useGroupMedia(groupId: string) {
  const api = useApi();

  return useEntities<Status>([Entities.STATUSES, 'groupMedia', groupId], () => {
    return api.get(`/api/v1/timelines/group/${groupId}?only_media=true`);
  }, { schema: statusSchema as EntitySchema<Status> });
}

export { useGroupMedia };
