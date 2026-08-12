import { useTimelineStream } from './useTimelineStream.ts';

import type { TimelineStreamOpts } from '@/actions/streaming.ts';
import type { APIEntity } from '@/types/entities.ts';

interface UseGroupStreamOpts extends TimelineStreamOpts {
  timelineId?: string;
  accept?: (status: APIEntity) => boolean;
}

function useGroupStream(groupId: string, options: UseGroupStreamOpts = {}) {
  const { timelineId = `group:${groupId}`, accept = null, ...streamOptions } = options;

  return useTimelineStream(
    timelineId,
    `group&group=${encodeURIComponent(groupId)}`,
    accept,
    streamOptions,
  );
}

export { useGroupStream };
