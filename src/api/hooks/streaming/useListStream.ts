import { useLoggedIn } from '@/hooks/useLoggedIn.ts';

import { useTimelineStream } from './useTimelineStream.ts';

function useListStream(listId?: string) {
  const { isLoggedIn } = useLoggedIn();

  const streamPath = listId ? `list&list=${encodeURIComponent(listId)}` : 'list';

  return useTimelineStream(
    `list:${listId}`,
    streamPath,
    null,
    { enabled: isLoggedIn && !!listId },
  );
}

export { useListStream };
