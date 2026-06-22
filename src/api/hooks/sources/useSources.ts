/*
  Project: Unfathomably FE
  File: useSources.ts

  Purpose:
    Load followed sources or source-search results for the Sources screen.

  Responsibilities:
    Call the source list/search API and validate returned source rows.

  This file intentionally does NOT contain:
    Source card presentation or follow/unfollow mutation behavior.
*/

import { useCallback, useEffect, useState } from 'react';

import { useApi } from '@/hooks/useApi.ts';
import { type Source, sourceSchema } from '@/schemas/index.ts';

const emptySources: Source[] = [];
const sourceListSchema = sourceSchema.array().catch(emptySources);

function useSources(q = '') {
  const api = useApi();
  const query = q.trim();
  const [sources, setSources] = useState<Source[]>(emptySources);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchSources = async () => {
      setIsFetching(true);
      setIsError(false);

      try {
        const response = await api.get(query ? '/api/v1/sources/search' : '/api/v1/sources', {
          searchParams: query ? { q: query } : {},
        });

        const data = await response.json();
        const parsedSources = sourceListSchema.parse(data);

        if (!cancelled) {
          setSources(parsedSources);
        }
      } catch (_e) {
        if (!cancelled) {
          setSources(emptySources);
          setIsError(true);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchSources();

    return () => {
      cancelled = true;
    };
  }, [api, query, reloadKey]);

  const invalidate = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {
    count: sources.length,
    fetchEntities: async () => invalidate(),
    fetchNextPage: async () => undefined,
    hasNextPage: false,
    hasPreviousPage: false,
    invalidate,
    isError,
    isFetched: !isFetching,
    isFetching,
    isInvalid: false,
    isLoading: isFetching && sources.length === 0,
    lastFetchedAt: undefined,
    sources,
    totalCount: sources.length,
  };
}

export { useSources };

/* end of useSources.ts */
