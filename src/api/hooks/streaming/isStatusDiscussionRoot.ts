/*
  Project: Unfathomably FE
  File: isStatusDiscussionRoot.ts

  Purpose:
    Identify statuses that belong in aggregate group and source feeds.

  Responsibilities:
    Treat direct statuses and repost targets consistently.
    Match the backend's empty inReplyTo forms for discussion roots.

  This file intentionally does NOT contain:
    Timeline state changes, stream connections, or server-specific routing.
*/

import type { APIEntity } from '@/types/entities.ts';

const isStatusDiscussionRoot = (status: APIEntity): boolean => {
  const target = status.reblog && typeof status.reblog === 'object'
    ? status.reblog as APIEntity
    : status;
  const replyTarget = target.in_reply_to_id;

  return replyTarget === null
    || replyTarget === undefined
    || replyTarget === ''
    || (Array.isArray(replyTarget) && replyTarget.length === 0);
};

export { isStatusDiscussionRoot };

/* end of isStatusDiscussionRoot.ts */
