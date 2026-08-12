/*
 * Unfathomably FE
 *
 * File: useThreadStream.ts
 * Purpose: Refresh an open discussion when a streamed reply joins its tree.
 * Responsibilities: Match immediate parents and invoke the route refresh hook.
 * This file intentionally does not maintain thread graph state.
 */

import { useCallback, useMemo } from 'react';

import { acceptsThreadReply } from './stream-filters.ts';
import { useTimelineStream } from './useTimelineStream.ts';

import type { APIEntity } from '@/types/entities.ts';

const useThreadStream = (rootId: string, descendantIds: readonly string[], onUpdate: () => void) => {
  const descendantKey = descendantIds.join(':');
  const parentIds = useMemo(() => new Set([rootId, ...descendantIds]), [rootId, descendantKey]);
  const accept = useCallback((status: APIEntity) => acceptsThreadReply(status, parentIds), [parentIds]);
  const handleUpdate = useCallback(() => onUpdate(), [onUpdate]);
  const handleDelete = useCallback((statusId: string) => {
    if (parentIds.has(statusId)) onUpdate();
  }, [onUpdate, parentIds]);

  return useTimelineStream(`thread:${rootId}`, 'public', accept, {
    enabled: Boolean(rootId),
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  });
};

export { useThreadStream };

/* end of useThreadStream.ts */
