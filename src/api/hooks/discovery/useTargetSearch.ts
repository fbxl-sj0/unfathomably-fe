/*
  Unfathomably Frontend
  ---------------------

  File: useTargetSearch.ts

  Purpose:

    Load mixed group and feed/source discovery results from the backend target
    catalog endpoint.

  Responsibilities:

    * call the combined discovery API with search and pagination parameters
    * validate whether each row is a group or source before exposing it to UI
    * keep duplicate target rows out of infinite-scroll result sets

  This file intentionally does NOT contain:

    * card rendering
    * follow/unfollow mutation behavior
    * backend actor classification rules
*/

import { useCallback, useEffect, useState } from 'react';
import z from 'zod';

import { useApi } from '@/hooks/useApi.ts';
import { groupSchema, type Group, sourceSchema, type Source } from '@/schemas/index.ts';

type DiscoveryTarget =
  | { target_type: 'group'; group: Group }
  | { target_type: 'source'; source: Source };

const emptyTargets: DiscoveryTarget[] = [];
const pageSize = 24;

const targetEnvelopeSchema = z.object({
  target_type: z.enum(['group', 'source']),
}).passthrough();

const targetEnvelopeListSchema = targetEnvelopeSchema.array().catch([]);

const parseTarget = (target: z.infer<typeof targetEnvelopeSchema>): DiscoveryTarget | null => {
  if (target.target_type === 'group') {
    const parsedGroup = groupSchema.safeParse(target);

    if (parsedGroup.success) {
      return { target_type: 'group', group: parsedGroup.data };
    }
  }

  if (target.target_type === 'source') {
    const parsedSource = sourceSchema.safeParse(target);

    if (parsedSource.success) {
      return { target_type: 'source', source: parsedSource.data };
    }
  }

  return null;
};

const targetIdentity = (target: DiscoveryTarget) => {
  if (target.target_type === 'group') {
    return `group:${target.group.id}`;
  }

  return `source:${target.source.id}`;
};

const mergeTargets = (current: DiscoveryTarget[], incoming: DiscoveryTarget[]) => {
  const seen = new Set(current.map(targetIdentity));
  const next = [...current];

  incoming.forEach((target) => {
    const identity = targetIdentity(target);

    if (!seen.has(identity)) {
      seen.add(identity);
      next.push(target);
    }
  });

  return next;
};

function useTargetSearch(q = '') {
  const api = useApi();
  const query = q.trim();
  const [targets, setTargets] = useState<DiscoveryTarget[]>(emptyTargets);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [isError, setIsError] = useState(false);

  const loadTargetPage = useCallback(async (offset: number) => {
    if (!query) {
      return emptyTargets;
    }

    const response = await api.get('/api/v1/discovery/targets', {
      searchParams: {
        limit: pageSize,
        offset,
        q: query,
      },
    });

    const data = await response.json();

    return targetEnvelopeListSchema
      .parse(data)
      .map(parseTarget)
      .filter((target): target is DiscoveryTarget => target !== null);
  }, [api, query]);

  useEffect(() => {
    let cancelled = false;

    if (!query) {
      setTargets(emptyTargets);
      setIsError(false);
      setHasNextPage(false);
      setNextOffset(0);
      setIsFetching(false);
      return () => {
        cancelled = true;
      };
    }

    setIsFetching(true);
    setIsError(false);
    setHasNextPage(false);

    loadTargetPage(0)
      .then((parsedTargets) => {
        if (!cancelled) {
          setTargets(parsedTargets);
          setNextOffset(parsedTargets.length);
          setHasNextPage(parsedTargets.length === pageSize);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTargets(emptyTargets);
          setIsError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadTargetPage]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetching || isFetchingNextPage) return;

    setIsFetchingNextPage(true);
    setIsError(false);

    try {
      const parsedTargets = await loadTargetPage(nextOffset);
      setTargets((currentTargets) => mergeTargets(currentTargets, parsedTargets));
      setNextOffset(nextOffset + parsedTargets.length);
      setHasNextPage(parsedTargets.length === pageSize);
    } catch (_e) {
      setIsError(true);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, loadTargetPage, nextOffset]);

  return {
    count: targets.length,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetched: !isFetching,
    isFetching: isFetching || isFetchingNextPage,
    isFetchingNextPage,
    isLoading: isFetching,
    targets,
  };
}

export { useTargetSearch, type DiscoveryTarget };

/* end of useTargetSearch.ts */
