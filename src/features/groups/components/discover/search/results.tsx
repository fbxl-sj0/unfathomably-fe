import clsx from 'clsx';
import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Virtuoso } from 'react-virtuoso';

import { useTargetSearch } from '@/api/hooks/index.ts';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { SourceListItem } from '@/features/sources/index.tsx';

import GroupListItem from '../group-list-item.tsx';

import type { DiscoveryTarget } from '@/api/hooks/discovery/useTargetSearch.ts';

interface Props {
  targetSearchResult?: ReturnType<typeof useTargetSearch>;
  showNativeFamilies?: boolean;
}

const nativeFamilyLabels: Record<string, string> = {
  audio: 'Audio',
  books: 'Books',
  bookmarks: 'Bookmarks',
  coordination: 'Coordination',
  culture: 'Culture',
  development: 'Software',
  events: 'Events',
  games: 'Games',
  groups: 'Communities',
  longform: 'Articles',
  marketplace: 'Markets',
  models: '3D models',
  photo: 'Photos',
  publishing: 'Publishing',
  routes: 'Routes',
  video: 'Video',
};

const nativeFamilyLabel = (family?: string): string | null => (
  family ? nativeFamilyLabels[family] || null : null
);

export default (props: Props) => {
  const { targetSearchResult, showNativeFamilies = false } = props;
  const {
    targets = [],
    hasNextPage = false,
    isFetching = false,
    fetchNextPage = () => undefined,
  } = targetSearchResult || {};

  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  };

  const renderTarget = useCallback((target: DiscoveryTarget, index: number) => {
    const family = showNativeFamilies ? nativeFamilyLabel(target.native_family) : null;

    return (
      <div
        className={
          clsx({
            'pt-4': index !== 0,
          })
        }
      >
        {(family || target.curated) && (
          <div className='mb-2 flex flex-wrap gap-x-3 gap-y-1'>
            {family && (
              <Text size='xs' theme='muted' weight='semibold'>
                <FormattedMessage id='groups.discover.search.results.native_family' defaultMessage='World type: {family}' values={{ family }} />
              </Text>
            )}
            {target.curated && (
              <Text className='text-primary-700 black:text-primary-300 dark:text-primary-300' size='xs' weight='semibold'>
                <FormattedMessage id='groups.discover.search.results.curated' defaultMessage='Featured by this server' />
              </Text>
            )}
          </div>
        )}
        {target.target_type === 'group' ? (
          <GroupListItem group={target.group} withJoinAction />
        ) : (
          <SourceListItem source={target.source} onChanged={() => undefined} />
        )}
      </div>
    );
  }, [showNativeFamilies]);

  return (
    <Stack space={4} data-testid='results'>
      <Text weight='semibold'>
        <FormattedMessage
          id='groups.discover.search.results.targets'
          defaultMessage='Groups and feeds'
        />
      </Text>

      <Virtuoso
        useWindowScroll
        data={targets}
        itemContent={(index, target) => renderTarget(target, index)}
        endReached={handleLoadMore}
      />
    </Stack>
  );
};
