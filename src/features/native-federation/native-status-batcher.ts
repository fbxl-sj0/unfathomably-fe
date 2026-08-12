/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-status-batcher.ts

  Purpose:

    Coalesce simultaneous World-card status hydration into one Mastodon API
    request.

  Responsibilities:

    * collect status IDs requested during the same render frame
    * dispatch the established bulk status action once
    * resolve every waiting card after success or failure

  This file intentionally does NOT contain:

    * status rendering or fallback UI
    * persistent caching outside the Redux entity store
    * native-object discovery requests
*/

import { fetchStatuses } from '@/actions/statuses.ts';

import type { AppDispatch } from '@/store.ts';

interface PendingStatus {
  dispatch: AppDispatch;
  resolvers: Array<() => void>;
}

const pendingStatuses = new Map<string, PendingStatus>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

const flushStatuses = () => {
  flushTimer = undefined;

  const entries = [...pendingStatuses.entries()];
  pendingStatuses.clear();

  if (entries.length === 0) return;

  const ids = entries.map(([id]) => id);
  const dispatch = entries[0][1].dispatch;

  void Promise.resolve(dispatch(fetchStatuses(ids)))
    .catch(() => undefined)
    .finally(() => {
      entries.forEach(([, pending]) => {
        pending.resolvers.forEach(resolve => resolve());
      });
    });
};

const queueNativeStatus = (id: string, dispatch: AppDispatch): Promise<void> =>
  new Promise(resolve => {
    const pending = pendingStatuses.get(id);

    if (pending) {
      pending.resolvers.push(resolve);
    } else {
      pendingStatuses.set(id, { dispatch, resolvers: [resolve] });
    }

    if (!flushTimer) {
      flushTimer = setTimeout(flushStatuses, 0);
    }
  });

export { queueNativeStatus };

/* end of src/features/native-federation/native-status-batcher.ts */
