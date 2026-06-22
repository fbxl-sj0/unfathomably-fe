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

import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { expandBubbleTimeline } from '@/actions/timelines.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import { Column } from '@/components/ui/column.tsx';
import Timeline from '@/features/ui/components/timeline.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useSettings } from '@/hooks/useSettings.ts';

const BubbleTimeline: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useSettings();
  const onlyMedia = settings.public.other.onlyMedia;
  const next = useAppSelector(state => state.timelines.get('bubble')?.next);

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
          timelineId={`bubble${onlyMedia ? ':media' : ''}`}
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
