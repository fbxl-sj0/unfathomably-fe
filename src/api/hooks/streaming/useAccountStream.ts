/*
 * Unfathomably FE
 *
 * File: useAccountStream.ts
 * Purpose: Keep account post, media, and world tabs live.
 * Responsibilities: Filter the public stream to one account and route shape.
 * This file intentionally does not fetch profile data.
 */

import { useCallback } from 'react';

import { acceptsAccountStatus } from './stream-filters.ts';
import { useTimelineStream } from './useTimelineStream.ts';

import type { APIEntity } from '@/types/entities.ts';

interface UseAccountStreamOpts {
  nativeFamily?: string;
  onlyMedia?: boolean;
  withReplies?: boolean;
}

const useAccountStream = (timelineId: string, accountId: string, options: UseAccountStreamOpts = {}) => {
  const { nativeFamily, onlyMedia, withReplies } = options;
  const accept = useCallback(
    (status: APIEntity) => acceptsAccountStatus(status, accountId, { nativeFamily, onlyMedia, withReplies }),
    [accountId, nativeFamily, onlyMedia, withReplies],
  );

  return useTimelineStream(timelineId, 'public', accept, { enabled: Boolean(accountId) });
};

export { useAccountStream };

/* end of useAccountStream.ts */
