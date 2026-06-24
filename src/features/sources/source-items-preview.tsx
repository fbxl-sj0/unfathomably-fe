/*
  Project: Unfathomably FE
  File: source-items-preview.tsx

  Purpose:
    Show native preview items for remote ActivityPub sources.

  Responsibilities:
    Render compact collection items such as Funkwhale audio tracks.

  This file intentionally does NOT contain:
    Source discovery, follow state management, or backend normalization.
*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

import { importFetchedStatuses } from '@/actions/importer/index.ts';
import { useSourceItems } from '@/api/hooks/sources/useSourceItems.ts';
import StatusContainer from '@/containers/status-container.tsx';
import NativeSourceItemCard from '@/features/federation/native-source-item-card.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

import type { Source } from '@/schemas/source.ts';
import type { SourceItem } from '@/schemas/source-item.ts';
import type { APIEntity } from '@/types/entities.ts';

interface ISourceItemsPreview {
  source: Source;
}

const previewableProfiles = new Set([
  'activitypub_profile',
  'application_source',
  'blog_publisher',
  'collection_channel',
  'library',
  'rss_feed',
]);

const SourceItemsPreview: React.FC<ISourceItemsPreview> = ({ source }) => {
  const dispatch = useAppDispatch();
  const shouldLoadItems = previewableProfiles.has(source.source_profile);
  const { data, isError, isFetching } = useSourceItems(source.id, { enabled: shouldLoadItems, limit: 4 });
  const statuses = React.useMemo(() => (
    data?.items
      .map(sourceItemStatus)
      .filter((status): status is APIEntity => Boolean(status))
  ), [data?.items]);

  React.useEffect(() => {
    if (statuses.length) {
      dispatch(importFetchedStatuses(statuses));
    }
  }, [dispatch, statuses]);

  if (!shouldLoadItems) {
    return null;
  }

  if (isFetching && !data?.items.length) {
    return (
      <div className='source-items-preview text-sm text-gray-500 dark:text-gray-400'>
        <FormattedMessage id='sources.preview.loading' defaultMessage='Loading native items...' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='source-items-preview text-sm text-gray-500 dark:text-gray-400'>
        <FormattedMessage
          id='sources.preview.unavailable'
          defaultMessage='Native preview is unavailable because the remote source did not return usable ActivityPub data.'
        />
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className='source-items-preview text-sm text-gray-500 dark:text-gray-400'>
        <FormattedMessage id='sources.preview.empty' defaultMessage='No native preview items are available yet.' />
      </div>
    );
  }

  return (
    <div className='source-items-preview space-y-2'>
      <div className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
        {typeof data.total_items === 'number' ? (
          <FormattedMessage id='sources.preview.heading_with_count' defaultMessage='Native items ({count})' values={{ count: data.total_items }} />
        ) : (
          <FormattedMessage id='sources.preview.heading' defaultMessage='Native items' />
        )}
      </div>

      {data.items.map((item) => renderSourceItem(item))}
    </div>
  );
};

function renderSourceItem(item: SourceItem) {
  const status = sourceItemStatus(item);

  if (status) {
    return (
      <div key={item.id} className='source-items-preview__status'>
        <StatusContainer id={status.id} showGroup={false} />
      </div>
    );
  }

  return <NativeSourceItemCard key={item.id} item={item} />;
}

function sourceItemStatus(item: SourceItem): APIEntity | null {
  const status = item.status;

  if (status && typeof status === 'object' && typeof status.id === 'string') {
    return status as APIEntity;
  }

  return null;
}

export default SourceItemsPreview;

/* end of source-items-preview.tsx */
