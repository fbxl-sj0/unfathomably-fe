/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/queries/optimistic-mutation.ts

  Purpose:

    Provide one safe transaction boundary for optimistic query-cache changes.

  Responsibilities:

    * cancel matching reads before a mutation changes cached data
    * retain exact query snapshots for rollback
    * restore every affected query when the remote write fails
    * mark successful snapshots stale without immediately replacing them

  This file intentionally does NOT define feature-specific cache shapes or
  decide which mutations are safe to present optimistically.
*/

import type { QueryClient, QueryFilters, QueryKey } from '@tanstack/react-query';

type QuerySnapshot<TData = unknown> = Array<[QueryKey, TData | undefined]>;

const snapshotQueries = async <TData = unknown>(
  queryClient: QueryClient,
  filters: QueryFilters,
): Promise<QuerySnapshot<TData>> => {
  await queryClient.cancelQueries(filters);
  return queryClient.getQueriesData<TData>(filters);
};

const restoreQuerySnapshot = <TData = unknown>(
  queryClient: QueryClient,
  snapshot: QuerySnapshot<TData>,
): void => {
  snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
};

const markQueriesStale = (
  queryClient: QueryClient,
  filters: QueryFilters,
): Promise<void> => queryClient.invalidateQueries({ ...filters, refetchType: 'none' });

export { markQueriesStale, restoreQuerySnapshot, snapshotQueries };
export type { QuerySnapshot };

/* end of src/queries/optimistic-mutation.ts */
