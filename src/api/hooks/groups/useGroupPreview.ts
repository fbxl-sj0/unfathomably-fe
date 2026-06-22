/*
  Project: Unfathomably FE
  File: useGroupPreview.ts

  Purpose:
    Load native preview items for a remote ActivityPub group.

  Responsibilities:
    Call the group-preview API and validate the shared preview envelope.

  This file intentionally does NOT contain:
    Presentation logic, group follow state, or timeline ingestion.
*/

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';
import { sourceItemsEnvelopeSchema, type SourceItemsEnvelope } from '@/schemas/source-item.ts';

interface UseGroupPreviewOpts {
  enabled?: boolean;
  limit?: number;
}

const emptyGroupPreview: SourceItemsEnvelope = {
  items: [],
  next: null,
  total_items: null,
};

function useGroupPreview(groupId: string | undefined, opts: UseGroupPreviewOpts = {}) {
  const api = useApi();
  const limit = opts.limit ?? 6;

  const getGroupPreview = async () => {
    const response = await api.get(`/api/v1/groups/${groupId}/preview`, {
      searchParams: {
        limit: String(limit),
      },
    });

    const data = await response.json();
    return sourceItemsEnvelopeSchema.parse(data);
  };

  return useQuery<SourceItemsEnvelope>({
    queryKey: ['groups', groupId, 'preview', limit],
    queryFn: getGroupPreview,
    enabled: Boolean(groupId) && opts.enabled !== false,
    placeholderData: emptyGroupPreview,
  });
}

export { useGroupPreview };

/* end of useGroupPreview.ts */
