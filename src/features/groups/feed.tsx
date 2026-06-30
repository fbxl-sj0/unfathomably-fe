import { useCallback, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { expandGroupsTimeline } from '@/actions/timelines.ts';
import { useGroupsFeedStream } from '@/api/hooks/index.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

import Timeline from '../ui/components/timeline.tsx';

import TabBar, { TabItems } from './components/tab-bar.tsx';

const timelineId = 'groups:feed';

const GroupsFeed: React.FC = () => {
  const dispatch = useAppDispatch();
  const next = useAppSelector(state => state.timelines.get(timelineId)?.next);

  useGroupsFeedStream();

  const handleLoadMore = useCallback((maxId: string) => {
    dispatch(expandGroupsTimeline({ url: next, maxId }));
  }, [dispatch, next]);

  const handleRefresh = useCallback(() => dispatch(expandGroupsTimeline()), [dispatch]);

  useEffect(() => {
    dispatch(expandGroupsTimeline());
  }, []);

  return (
    <Stack space={4}>
      <TabBar activeTab={TabItems.GROUP_FEED} />

      <PullToRefresh onRefresh={handleRefresh}>
        <Timeline
          scrollKey='groups_feed_timeline'
          timelineId={timelineId}
          onLoadMore={handleLoadMore}
          onRefreshAtTop={handleRefresh}
          emptyMessage={
            <Stack space={1}>
              <Text size='xl' weight='medium' align='center'>
                <FormattedMessage
                  id='empty_column.groups_feed.title'
                  defaultMessage='No group posts yet'
                />
              </Text>

              <Text theme='muted' align='center'>
                <FormattedMessage
                  id='empty_column.groups_feed.subtitle'
                  defaultMessage='Follow groups to build a feed of discussion roots.'
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

export default GroupsFeed;
