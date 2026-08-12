/*
 * Unfathomably FE
 *
 * File: useNativeFederationStream.ts
 * Purpose: Deliver live updates to native federation world timelines.
 * Responsibilities: Select the public socket and mirror native family filters.
 * This file intentionally does not fetch initial timeline pages.
 */

import { useCallback } from 'react';

import { acceptsNativeFederationStatus } from './stream-filters.ts';
import { useTimelineStream } from './useTimelineStream.ts';

import type { APIEntity } from '@/types/entities.ts';

const useNativeFederationStream = (timelineId: string, family?: string, enabled = true) => {
  const accept = useCallback(
    (status: APIEntity) => acceptsNativeFederationStatus(status, family),
    [family],
  );

  return useTimelineStream(timelineId, 'public', accept, { enabled });
};

export { useNativeFederationStream };

/* end of useNativeFederationStream.ts */
