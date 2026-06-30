/*
  Project: Unfathomably FE
  File: useGroupsFeedStream.ts

  Purpose:
    Subscribe the followed-groups aggregate feed to its authenticated stream.

  Responsibilities:
    Map the groups feed timeline to the backend user:groups stream.

  This file intentionally does NOT contain:
    Group discovery, group follow state changes, or timeline pagination.
*/

import { useLoggedIn } from '@/hooks/useLoggedIn.ts';

import { useTimelineStream } from './useTimelineStream.ts';

const useGroupsFeedStream = () => {
  const { isLoggedIn } = useLoggedIn();

  return useTimelineStream(
    'groups:feed',
    'user:groups',
    null,
    { enabled: isLoggedIn },
  );
};

export { useGroupsFeedStream };

/* end of useGroupsFeedStream.ts */
