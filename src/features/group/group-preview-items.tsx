/*
  Project: Unfathomably FE
  File: group-preview-items.tsx

  Purpose:
    Show native preview items for remote ActivityPub communities.

  Responsibilities:
    Render direct outbox previews when the local group timeline has not yet
    ingested remote posts.

  This file intentionally does NOT contain:
    Timeline storage, follow state management, or remote ActivityPub parsing.
*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

import { importFetchedStatuses } from '@/actions/importer/index.ts';
import { useGroupPreview } from '@/api/hooks/groups/useGroupPreview.ts';
import StatusContainer from '@/containers/status-container.tsx';
import NativeSourceItemCard from '@/features/federation/native-source-item-card.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

import type { SourceItem } from '@/schemas/source-item.ts';
import type { APIEntity } from '@/types/entities.ts';

interface IGroupPreviewItems {
  groupId: string;
}

const GroupPreviewItems: React.FC<IGroupPreviewItems> = ({ groupId }) => {
  const dispatch = useAppDispatch();
  const { data, isError, isFetching } = useGroupPreview(groupId, { limit: 4 });
  const statuses = React.useMemo(() => (
    data?.items
      .map(groupItemStatus)
      .filter((status): status is APIEntity => Boolean(status)) || []
  ), [data?.items]);

  React.useEffect(() => {
    if (statuses.length) {
      dispatch(importFetchedStatuses(statuses));
    }
  }, [dispatch, statuses]);

  if (isFetching && !data?.items.length) {
    return (
      <div className='w-full max-w-xl text-sm text-gray-500 dark:text-gray-400'>
        <FormattedMessage id='groups.preview.loading' defaultMessage='Loading remote preview...' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='w-full max-w-xl text-sm text-gray-500 dark:text-gray-400'>
        <FormattedMessage
          id='groups.preview.unavailable'
          defaultMessage='Remote preview is unavailable because the group did not return usable ActivityPub data.'
        />
      </div>
    );
  }

  if (!data?.items.length) {
    return null;
  }

  return (
    <div className='w-full max-w-xl space-y-2 text-left'>
      <div className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
        {typeof data.total_items === 'number' ? (
          <FormattedMessage id='groups.preview.heading_with_count' defaultMessage='Remote preview ({count})' values={{ count: data.total_items }} />
        ) : (
          <FormattedMessage id='groups.preview.heading' defaultMessage='Remote preview' />
        )}
      </div>

      {data.items.map((item) => renderGroupItem(item))}
    </div>
  );
};

function renderGroupItem(item: SourceItem) {
  const status = groupItemStatus(item);

  if (status) {
    return (
      <div key={item.id} className='group-preview-items__status'>
        <StatusContainer id={status.id} showGroup={false} />
      </div>
    );
  }

  return <NativeSourceItemCard key={item.id} item={item} />;
}

function groupItemStatus(item: SourceItem): APIEntity | null {
  const status = item.status;

  if (status && typeof status === 'object' && typeof status.id === 'string') {
    return status as APIEntity;
  }

  return null;
}

export default GroupPreviewItems;

/* end of group-preview-items.tsx */
