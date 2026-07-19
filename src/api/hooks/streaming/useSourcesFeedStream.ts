/*
  Project: Unfathomably FE
  File: useSourcesFeedStream.ts

  Purpose:
    Subscribe the followed-sources aggregate feed to its authenticated stream.

  Responsibilities:
    Map the sources feed timeline to the backend user:sources stream.
    Reject replies before they enter the aggregate timeline cache.

  This file intentionally does NOT contain:
    Source discovery, source follow state changes, or timeline pagination.
*/

import { useLoggedIn } from '@/hooks/useLoggedIn.ts';

import { isStatusDiscussionRoot } from './isStatusDiscussionRoot.ts';
import { useTimelineStream } from './useTimelineStream.ts';

const useSourcesFeedStream = () => {
  const { isLoggedIn } = useLoggedIn();

  return useTimelineStream(
    'sources:feed',
    'user:sources',
    isStatusDiscussionRoot,
    { enabled: isLoggedIn },
  );
};

export { useSourcesFeedStream };

/* end of useSourcesFeedStream.ts */
