import { useTimelineStream } from './useTimelineStream.ts';

function useHashtagStream(tag: string) {
  return useTimelineStream(
    `hashtag:${tag}`,
    `hashtag&tag=${encodeURIComponent(tag)}`,
  );
}

export { useHashtagStream };
