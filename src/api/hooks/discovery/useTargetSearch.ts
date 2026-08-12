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
import * as z from '@/zod.ts';

import { useApi } from '@/hooks/useApi.ts';
import { groupSchema, type Group, sourceSchema, type Source } from '@/schemas/index.ts';

type DiscoveryTarget =
  | { target_type: 'group'; group: Group; native_family?: string; curated?: boolean }
  | { target_type: 'source'; source: Source; native_family?: string; curated?: boolean };

const emptyTargets: DiscoveryTarget[] = [];
const pageSize = 24;

const targetEnvelopeSchema = z.object({
  target_type: z.enum(['group', 'source']),
  native_family: z.string().max(32).optional(),
  curated: z.boolean().catch(false),
}).passthrough();

const targetEnvelopeListSchema = targetEnvelopeSchema.array();

type TargetPage = {
  invalidCount: number;
  receivedCount: number;
  targets: DiscoveryTarget[];
};

type TargetSearchOptions = {
  nativeBrowse?: boolean;
  nativeFamily?: string;
  nativeMode?: boolean;
};

const parseTarget = (target: z.infer<typeof targetEnvelopeSchema>): DiscoveryTarget | null => {
  if (target.target_type === 'group') {
    const parsedGroup = groupSchema.safeParse(target);

    if (parsedGroup.success) {
      return { target_type: 'group', group: parsedGroup.data, native_family: target.native_family, curated: target.curated };
    }
  }

  if (target.target_type === 'source') {
    const parsedSource = sourceSchema.safeParse(target);

    if (parsedSource.success) {
      return { target_type: 'source', source: parsedSource.data, native_family: target.native_family, curated: target.curated };
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

function useTargetSearch(q = '', { nativeBrowse = false, nativeFamily = 'all', nativeMode = false }: TargetSearchOptions = {}) {
  const api = useApi();
  const query = q.trim();
  const shouldBrowseNative = nativeBrowse && !query;
  const shouldFilterNative = nativeMode || nativeBrowse;
  const [targets, setTargets] = useState<DiscoveryTarget[]>(emptyTargets);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [isError, setIsError] = useState(false);
  const [settledQuery, setSettledQuery] = useState('');

  const loadTargetPage = useCallback(async (offset: number): Promise<TargetPage> => {
    if (!query && !shouldBrowseNative) {
      return { invalidCount: 0, receivedCount: 0, targets: emptyTargets };
    }

    const response = await api.get('/api/v1/discovery/targets', {
      searchParams: {
        limit: pageSize,
        offset,
        q: query,
        ...(shouldFilterNative ? { mode: 'native' } : {}),
        ...(shouldFilterNative && nativeFamily !== 'all' ? { family: nativeFamily } : {}),
      },
    });

    const data = targetEnvelopeListSchema.parse(await response.json());
    const targets = data
      .map(parseTarget)
      .filter((target): target is DiscoveryTarget => target !== null);

    return {
      invalidCount: data.length - targets.length,
      receivedCount: data.length,
      targets,
    };
  }, [api, nativeFamily, query, shouldBrowseNative, shouldFilterNative]);

  useEffect(() => {
    let cancelled = false;

    if (!query && !shouldBrowseNative) {
      setTargets(emptyTargets);
      setIsError(false);
      setHasNextPage(false);
      setNextOffset(0);
      setIsFetching(false);
      setSettledQuery('');
      return () => {
        cancelled = true;
      };
    }

    setIsFetching(true);
    setIsError(false);
    setHasNextPage(false);
    setTargets(emptyTargets);

    const loadInitialPage = async () => {
      try {
        const { invalidCount, receivedCount, targets: parsedTargets } = await loadTargetPage(0);

        if (!cancelled) {
          setTargets(parsedTargets);
          setNextOffset(receivedCount);
          setHasNextPage(receivedCount === pageSize);
          setIsError(invalidCount > 0 && parsedTargets.length === 0);
          setSettledQuery(shouldBrowseNative ? `__native_browse__:${nativeFamily}` : query);
        }
      } catch (_e) {
        if (!cancelled) {
          setTargets(emptyTargets);
          setIsError(true);
          setSettledQuery(shouldBrowseNative ? `__native_browse__:${nativeFamily}` : query);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadInitialPage();

    return () => {
      cancelled = true;
    };
  }, [loadTargetPage]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetching || isFetchingNextPage) return;

    setIsFetchingNextPage(true);
    setIsError(false);

    try {
      const { receivedCount, targets: parsedTargets } = await loadTargetPage(nextOffset);

      setTargets((currentTargets) => mergeTargets(currentTargets, parsedTargets));
      setNextOffset(nextOffset + receivedCount);
      setHasNextPage(receivedCount === pageSize);
      setIsError(false);
    } catch (_e) {
      setIsError(true);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, loadTargetPage, nextOffset]);

  const requestIdentity = shouldBrowseNative ? `__native_browse__:${nativeFamily}` : query;
  const isInitialLoading = Boolean(requestIdentity) && settledQuery !== requestIdentity;

  return {
    count: targets.length,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetched: !isInitialLoading,
    isFetching: isInitialLoading || isFetching || isFetchingNextPage,
    isFetchingNextPage,
    isLoading: isInitialLoading,
    targets,
  };
}

export { useTargetSearch, type DiscoveryTarget };

/* end of useTargetSearch.ts */
