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

import { useGroupPreview } from '@/api/hooks/groups/useGroupPreview.ts';
import NativeSourceItemCard from '@/features/federation/native-source-item-card.tsx';

interface IGroupPreviewItems {
  groupId: string;
}

const GroupPreviewItems: React.FC<IGroupPreviewItems> = ({ groupId }) => {
  const { data, isError, isFetching } = useGroupPreview(groupId, { limit: 4 });

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

      {data.items.map((item) => (
        <NativeSourceItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default GroupPreviewItems;

/* end of group-preview-items.tsx */
