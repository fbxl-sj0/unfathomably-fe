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

const parseGroupPreviewEnvelope = (data: unknown): SourceItemsEnvelope => {
  const result = sourceItemsEnvelopeSchema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  /*
    Group previews are produced by unfathomably-be. If a deployed backend adds
    harmless fields before the frontend schema is updated, keep the preview
    usable instead of replacing the group page with an unavailable message.
  */
  if (data && typeof data === 'object' && Array.isArray((data as SourceItemsEnvelope).items)) {
    const envelope = data as SourceItemsEnvelope;

    return {
      items: envelope.items,
      next: typeof envelope.next === 'string' ? envelope.next : null,
      total_items: typeof envelope.total_items === 'number' ? envelope.total_items : null,
    };
  }

  return emptyGroupPreview;
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
    return parseGroupPreviewEnvelope(data);
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
