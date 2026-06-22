/*
  Project: Unfathomably FE
  File: useSourceItems.ts

  Purpose:
    Load native preview items for a remote ActivityPub source.

  Responsibilities:
    Call the source-items API and validate the response shape.

  This file intentionally does NOT contain:
    Presentation logic or source follow state.
*/

import { useEffect, useState } from 'react';

import { useApi } from '@/hooks/useApi.ts';
import { sourceItemsEnvelopeSchema, type SourceItemsEnvelope } from '@/schemas/source-item.ts';

interface UseSourceItemsOpts {
  enabled?: boolean;
  limit?: number;
}

const emptySourceItems: SourceItemsEnvelope = {
  items: [],
  next: null,
  total_items: null,
};

const parseSourceItemsEnvelope = (data: unknown): SourceItemsEnvelope => {
  const result = sourceItemsEnvelopeSchema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  /*
    Source previews are produced by unfathomably-be. If runtime validation is
    stricter than the deployed API shape, keep the preview usable instead of
    dropping the entire source into a permanent loading or unavailable state.
  */
  if (data && typeof data === 'object' && Array.isArray((data as SourceItemsEnvelope).items)) {
    const envelope = data as SourceItemsEnvelope;

    return {
      items: envelope.items,
      next: typeof envelope.next === 'string' ? envelope.next : null,
      total_items: typeof envelope.total_items === 'number' ? envelope.total_items : null,
    };
  }

  return emptySourceItems;
};

function useSourceItems(sourceId: string | undefined, opts: UseSourceItemsOpts = {}) {
  const api = useApi();
  const limit = opts.limit ?? 6;
  const enabled = Boolean(sourceId) && opts.enabled !== false;
  const [data, setData] = useState<SourceItemsEnvelope>(emptySourceItems);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSourceItems = async () => {
      if (!enabled || !sourceId) {
        setData(emptySourceItems);
        setIsFetching(false);
        setIsError(false);
        return;
      }

      setIsFetching(true);
      setIsError(false);

      try {
        const response = await api.get(`/api/v1/sources/${sourceId}/items`, {
          searchParams: {
            limit: String(limit),
          },
        });

        const responseData = await response.json();
        const parsedData = parseSourceItemsEnvelope(responseData);

        if (!cancelled) {
          setData(parsedData);
        }
      } catch (_e) {
        if (!cancelled) {
          setData(emptySourceItems);
          setIsError(true);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchSourceItems();

    return () => {
      cancelled = true;
    };
  }, [api, enabled, limit, sourceId]);

  return {
    data,
    isError,
    isFetching,
  };
}

export { useSourceItems };

/* end of useSourceItems.ts */
