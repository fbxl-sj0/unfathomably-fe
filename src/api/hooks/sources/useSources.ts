/*
  Project: Unfathomably FE
  File: useSources.ts

  Purpose:
    Load followed feeds or feed-search results for the Feeds screen.

  Responsibilities:
    Call the feed list/search API and validate returned feed rows.

  This file intentionally does NOT contain:
    Feed card presentation or follow/unfollow mutation behavior.
*/

import { useCallback, useEffect, useState } from 'react';

import { useApi } from '@/hooks/useApi.ts';
import { type Source, sourceSchema } from '@/schemas/index.ts';

const emptySources: Source[] = [];
const sourceListSchema = sourceSchema.array().catch(emptySources);
const pageSize = 24;

const mergeSources = (current: Source[], incoming: Source[]) => {
  const seen = new Set(current.map(source => source.id));
  const next = [...current];

  incoming.forEach((source) => {
    if (!seen.has(source.id)) {
      seen.add(source.id);
      next.push(source);
    }
  });

  return next;
};

function useSources(q = '') {
  const api = useApi();
  const query = q.trim();
  const [sources, setSources] = useState<Source[]>(emptySources);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadSourcesPage = useCallback(async (offset: number) => {
    const endpoint = query ? '/api/v1/feeds/search' : '/api/v1/feeds';
    const searchParams: Record<string, string | number> = { limit: pageSize, offset };

    if (query) {
      searchParams.q = query;
    }

    const response = await api.get(endpoint, { searchParams });
    const data = await response.json();
    return sourceListSchema.parse(data);
  }, [api, query]);

  useEffect(() => {
    let cancelled = false;

    const fetchSources = async () => {
      setIsFetching(true);
      setIsError(false);
      setHasNextPage(false);

      try {
        const parsedSources = await loadSourcesPage(0);

        if (!cancelled) {
          setSources(parsedSources);
          setNextOffset(parsedSources.length);
          setHasNextPage(parsedSources.length === pageSize);
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
  }, [loadSourcesPage, reloadKey]);

  const invalidate = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetching || isFetchingNextPage) return;

    setIsFetchingNextPage(true);
    setIsError(false);

    try {
      const parsedSources = await loadSourcesPage(nextOffset);

      setSources((currentSources) => mergeSources(currentSources, parsedSources));
      setNextOffset(nextOffset + parsedSources.length);
      setHasNextPage(parsedSources.length === pageSize);
    } catch (_e) {
      setIsError(true);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, loadSourcesPage, nextOffset]);

  return {
    count: sources.length,
    fetchEntities: async () => invalidate(),
    fetchNextPage,
    hasNextPage,
    hasPreviousPage: false,
    invalidate,
    isError,
    isFetched: !isFetching,
    isFetching: isFetching || isFetchingNextPage,
    isInvalid: false,
    isLoading: isFetching && sources.length === 0,
    lastFetchedAt: undefined,
    sources,
    totalCount: sources.length,
  };
}

export { useSources };

/* end of useSources.ts */
