/*
  Project: Unfathomably FE
  File: useSourceStream.ts

  Purpose:
    Subscribe frontend source surfaces to Rebased/Unfathomably source streams.

  Responsibilities:
    Map a source identifier to the shared timeline streaming hook.

  This file intentionally does NOT contain:
    Source discovery, source follow state changes, or item normalization.
*/

import { useTimelineStream } from './useTimelineStream.ts';

const useSourceStream = (sourceId: string, enabled = true) =>
  useTimelineStream(
    `source:${sourceId}`,
    `source&source=${encodeURIComponent(sourceId)}`,
    null,
    { enabled },
  );

export { useSourceStream };

/* end of useSourceStream.ts */
