import { useTimelineStream } from './useTimelineStream.ts';

function useGroupStream(groupId: string) {
  return useTimelineStream(
    `group:${groupId}`,
    `group&group=${encodeURIComponent(groupId)}`,
  );
}

export { useGroupStream };
