/*
  Project: Unfathomably FE
  File: useSourcesFeedStream.ts

  Purpose:
    Subscribe the followed-sources aggregate feed to its authenticated stream.

  Responsibilities:
    Map the sources feed timeline to the backend user:sources stream.

  This file intentionally does NOT contain:
    Source discovery, source follow state changes, or timeline pagination.
*/

import { useLoggedIn } from '@/hooks/useLoggedIn.ts';

import { useTimelineStream } from './useTimelineStream.ts';

const useSourcesFeedStream = () => {
  const { isLoggedIn } = useLoggedIn();

  return useTimelineStream(
    'sources:feed',
    'user:sources',
    null,
    { enabled: isLoggedIn },
  );
};

export { useSourcesFeedStream };

/* end of useSourcesFeedStream.ts */
