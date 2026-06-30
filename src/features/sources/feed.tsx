/*
  Project: Unfathomably FE
  File: src/features/sources/feed.tsx

  Purpose:
    Show the root posts from followed federated feeds as a normal timeline.

  Responsibilities:
    Load the feed timeline and render it with the shared status UI.

  This file intentionally does NOT contain:
    Feed discovery, follow management, or native preview item cards.
*/

import { useCallback, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { expandSourcesTimeline } from '@/actions/timelines.ts';
import { useSourcesFeedStream } from '@/api/hooks/index.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

import Timeline from '../ui/components/timeline.tsx';

import TabBar, { TabItems } from './components/tab-bar.tsx';

const timelineId = 'sources:feed';

const SourcesFeed: React.FC = () => {
  const dispatch = useAppDispatch();
  const next = useAppSelector(state => state.timelines.get(timelineId)?.next);

  useSourcesFeedStream();

  const handleLoadMore = useCallback((maxId: string) => {
    dispatch(expandSourcesTimeline({ url: next, maxId }));
  }, [dispatch, next]);

  const handleRefresh = useCallback(() => dispatch(expandSourcesTimeline()), [dispatch]);

  useEffect(() => {
    dispatch(expandSourcesTimeline());
  }, []);

  return (
    <Stack space={4}>
      <TabBar activeTab={TabItems.SOURCE_FEED} />

      <PullToRefresh onRefresh={handleRefresh}>
        <Timeline
          scrollKey='sources_feed_timeline'
          timelineId={timelineId}
          onLoadMore={handleLoadMore}
          onRefreshAtTop={handleRefresh}
          emptyMessage={
            <Stack space={1}>
              <Text size='xl' weight='medium' align='center'>
                <FormattedMessage
                  id='empty_column.sources_feed.title'
                  defaultMessage='No feed posts yet'
                />
              </Text>

              <Text theme='muted' align='center'>
                <FormattedMessage
                  id='empty_column.sources_feed.subtitle'
                  defaultMessage='Follow feeds to build this timeline.'
                />
              </Text>
            </Stack>
          }
          emptyMessageCard={false}
        />
      </PullToRefresh>
    </Stack>
  );
};

export default SourcesFeed;

/* end of src/features/sources/feed.tsx */
