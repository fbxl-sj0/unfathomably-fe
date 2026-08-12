/*
  Project: Unfathomably FE
  File: features/bubble-timeline/index.tsx

  Purpose:
    Render the server-provided bubble timeline.

  Responsibilities:
    Load /api/v1/timelines/bubble and keep its pagination separate from
    local and federated timelines.

  This file intentionally does NOT contain:
    Bubble membership configuration or ActivityPub query logic.
*/

import { useCallback, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { expandBubbleTimeline } from '@/actions/timelines.ts';
import { useTimelineStream } from '@/api/hooks/streaming/useTimelineStream.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import { Column } from '@/components/ui/column.tsx';
import Timeline from '@/features/ui/components/timeline.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { useSettings } from '@/hooks/useSettings.ts';

import type { APIEntity } from '@/types/entities.ts';

const BubbleTimeline: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useSettings();
  const { instance } = useInstance();
  const me = useAppSelector(state => state.me);
  const onlyMedia = settings.public.other.onlyMedia;
  const next = useAppSelector(state => state.timelines.get('bubble')?.next);
  const timelineId = `bubble${onlyMedia ? ':media' : ''}`;
  const bubbleInstances = ((instance.pleroma.metadata as any).local_bubble_instances || [])
    .filter((host: unknown): host is string => typeof host === 'string')
    .map((host: string) => host.toLowerCase());
  const bubbleInstancesKey = bubbleInstances.join(':');
  const acceptStatus = useCallback((status: APIEntity) => {
    if (status.reblog) return false;
    if (onlyMedia && status.media_attachments.length === 0) return false;

    const account = status.account;
    const acctParts = account?.acct?.toLowerCase().split('@') || [];
    const remoteHost = acctParts.length > 1 ? acctParts.at(-1) : undefined;

    return remoteHost ? bubbleInstances.includes(remoteHost) : Boolean(me);
  }, [bubbleInstancesKey, me, onlyMedia]);

  useTimelineStream(timelineId, 'public', acceptStatus);

  const handleLoadMore = (maxId: string) => {
    dispatch(expandBubbleTimeline({ url: next, maxId, onlyMedia }));
  };

  const handleRefresh = () => {
    return dispatch(expandBubbleTimeline({ onlyMedia }));
  };

  useEffect(() => {
    dispatch(expandBubbleTimeline({ onlyMedia }));
  }, [onlyMedia]);

  return (
    <Column label='Bubble' slim withHeader={false}>
      <PullToRefresh onRefresh={handleRefresh}>
        <Timeline
          className='black:p-4 black:sm:p-5'
          scrollKey='bubble_timeline'
          timelineId={timelineId}
          prefix='home'
          onLoadMore={handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.bubble' defaultMessage='The bubble timeline is quiet right now.' />}
        />
      </PullToRefresh>
    </Column>
  );
};

export default BubbleTimeline;

/* end of features/bubble-timeline/index.tsx */
