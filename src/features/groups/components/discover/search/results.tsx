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
}

export default (props: Props) => {
  const { targetSearchResult } = props;
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

  const renderTarget = useCallback((target: DiscoveryTarget, index: number) => (
    <div
      className={
        clsx({
          'pt-4': index !== 0,
        })
      }
    >
      {target.target_type === 'group' ? (
        <GroupListItem group={target.group} withJoinAction />
      ) : (
        <SourceListItem source={target.source} onChanged={() => undefined} />
      )}
    </div>
  ), []);

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
