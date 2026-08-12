import xIcon from '@tabler/icons/outline/x.svg';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import {
  FormattedMessage,
} from 'react-intl';

import {
  expandSearch,
  setSearchAccount,
} from '@/actions/search.ts';
import { expandTrendingStatuses, fetchTrendingStatuses } from '@/actions/trending-statuses.ts';
import { useAccount, useFederationStatus, useTargetSearch } from '@/api/hooks/index.ts';
import Hashtag from '@/components/hashtag.tsx';
import IconButton from '@/components/icon-button.tsx';
import ScrollableList from '@/components/scrollable-list.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Text from '@/components/ui/text.tsx';
import AccountContainer from '@/containers/account-container.tsx';
import StatusContainer from '@/containers/status-container.tsx';
import GroupListItem from '@/features/groups/components/discover/group-list-item.tsx';
import PlaceholderAccount from '@/features/placeholder/components/placeholder-account.tsx';
import PlaceholderHashtag from '@/features/placeholder/components/placeholder-hashtag.tsx';
import PlaceholderStatus from '@/features/placeholder/components/placeholder-status.tsx';
import { SourceListItem } from '@/features/sources/index.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useSuggestions } from '@/queries/suggestions.ts';

import FaspSearchNotice from './fasp-search-notice.tsx';

import type { DiscoveryTarget } from '@/api/hooks/discovery/useTargetSearch.ts';
import type { OrderedSet as ImmutableOrderedSet } from 'immutable';
import type { VirtuosoHandle } from 'react-virtuoso';

const SearchResults = () => {
  const node = useRef<VirtuosoHandle>(null);

  const dispatch = useAppDispatch();

  const { data: suggestions } = useSuggestions();

  const value = useAppSelector((state) => state.search.submittedValue);
  const results = useAppSelector((state) => state.search.results);
  const trendingStatuses = useAppSelector((state) => state.trending_statuses.items);
  const nextTrendingStatuses = useAppSelector((state) => state.trending_statuses.next);
  const trends = useAppSelector((state) => state.trends.items);
  const submitted = useAppSelector((state) => state.search.submitted);
  const selectedFilter = useAppSelector((state) => state.search.filter);
  const filterByAccount = useAppSelector((state) => state.search.accountId || undefined);
  const me = useAppSelector((state) => state.me);
  const { account } = useAccount(filterByAccount);
  const federationStatus = useFederationStatus(submitted && !filterByAccount ? value : '');
  const targetSearch = useTargetSearch(
    submitted && me && !filterByAccount && ['accounts', 'statuses'].includes(selectedFilter) ? value : '',
  );

  const handleLoadMore = () => {
    if (selectedFilter === 'accounts' && !results.accountsHasMore && targetSearch.hasNextPage) {
      targetSearch.fetchNextPage();
    } else if (selectedFilter === 'statuses' && !results.statusesHasMore && targetSearch.hasNextPage) {
      targetSearch.fetchNextPage();
    } else if (results.accounts.size || results.statuses.size || results.hashtags.size) {
      dispatch(expandSearch(selectedFilter));
    } else if (nextTrendingStatuses) {
      dispatch(expandTrendingStatuses(nextTrendingStatuses));
    }
  };

  const handleUnsetAccount = () => dispatch(setSearchAccount(null));

  const getCurrentIndex = (id: string): number => {
    return resultsIds?.keySeq().findIndex(key => key === id);
  };

  const handleMoveUp = (id: string) => {
    if (!resultsIds) return;

    const elementIndex = getCurrentIndex(id) - 1;
    selectChild(elementIndex);
  };

  const handleMoveDown = (id: string) => {
    if (!resultsIds) return;

    const elementIndex = getCurrentIndex(id) + 1;
    selectChild(elementIndex);
  };

  const selectChild = (index: number) => {
    node.current?.scrollIntoView({
      index,
      behavior: 'smooth',
      done: () => {
        const element = document.querySelector<HTMLDivElement>(`#search-results [data-index="${index}"] .focusable`);
        element?.focus();
      },
    });
  };

  useEffect(() => {
    dispatch(fetchTrendingStatuses());
  }, []);

  const renderTarget = (target: DiscoveryTarget) => {
    if (target.target_type === 'group') {
      return <GroupListItem key={`target-group-${target.group.id}`} group={target.group} withJoinAction />;
    }

    return (
      <SourceListItem
        key={`target-source-${target.source.id}`}
        source={target.source}
        onChanged={() => undefined}
      />
    );
  };

  const renderTargetsSection = () => {
    if (!targetSearch.targets.length) {
      return [];
    }

    return [
      <div key='target-search-heading'>
        <Text
          className='pb-2 pt-1 uppercase tracking-wide'
          size='xs'
          theme='muted'
          weight='semibold'
        >
          <FormattedMessage id='search_results.targets' defaultMessage='Groups and feeds' />
        </Text>
      </div>,
      ...targetSearch.targets.map(renderTarget),
    ];
  };

  const renderFederationStatusMessage = () => {
    if (!federationStatus.status.defederated) {
      return null;
    }

    return (
      <div className='flex min-h-[120px] flex-1 items-center justify-center rounded-lg bg-red-50 p-6 text-center text-red-900 dark:bg-red-950 dark:text-red-200'>
        <Text>
          <FormattedMessage
            id='search_results.federation_blocked'
            defaultMessage='{host} is blocked by this instance federation policy. Search and follow may be unavailable.'
            values={{ host: federationStatus.status.host || value }}
          />
          {federationStatus.status.message ? (
            <>
              {' '}
              {federationStatus.status.message}
            </>
          ) : null}
        </Text>
      </div>
    );
  };

  let searchResults;
  let hasMore = false;
  let loaded;
  let noResultsMessage;
  let placeholderComponent = PlaceholderStatus as React.ComponentType;
  let resultsIds: ImmutableOrderedSet<string>;

  if (selectedFilter === 'accounts') {
    hasMore = results.accountsHasMore;
    loaded = results.accountsLoaded;
    placeholderComponent = PlaceholderAccount;

    if (results.accounts && results.accounts.size > 0) {
      searchResults = [
        <div key='account-search-heading'>
          <Text
            className='pb-2 pt-1 uppercase tracking-wide'
            size='xs'
            theme='muted'
            weight='semibold'
          >
            <FormattedMessage id='search_results.accounts' defaultMessage='Accounts' />
          </Text>
        </div>,
        ...results.accounts.map(accountId => <AccountContainer key={accountId} id={accountId} />).toArray(),
        ...renderTargetsSection(),
      ];
    } else if (targetSearch.targets.length) {
      searchResults = renderTargetsSection();
    } else if (!submitted && suggestions.length) {
      searchResults = suggestions.map(suggestion => <AccountContainer key={suggestion.account} id={suggestion.account} />);
    } else if (loaded && targetSearch.isFetching) {
      noResultsMessage = <Spinner />;
    } else if (loaded && !targetSearch.isFetching && federationStatus.status.defederated) {
      noResultsMessage = renderFederationStatusMessage();
    } else if (loaded && !targetSearch.isFetching) {
      noResultsMessage = (
        <div className='flex min-h-[160px] flex-1 items-center justify-center rounded-lg bg-primary-50 p-10 text-center text-gray-900 dark:bg-gray-700 dark:text-gray-300'>
          <FormattedMessage
            id='empty_column.search.accounts'
            defaultMessage='There are no people results for "{term}"'
            values={{ term: value }}
          />
        </div>
      );
    }
  }

  if (selectedFilter === 'statuses') {
    hasMore = results.statusesHasMore;
    loaded = results.statusesLoaded;

    if (results.statuses && results.statuses.size > 0) {
      searchResults = [
        ...renderTargetsSection(),
        ...results.statuses.map((statusId: string) => (
          <StatusContainer
            key={statusId}
            id={statusId}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )).toArray(),
      ];
      resultsIds = results.statuses;
    } else if (targetSearch.targets.length) {
      searchResults = renderTargetsSection();
    } else if (!submitted && trendingStatuses && !trendingStatuses.isEmpty()) {
      hasMore = !!nextTrendingStatuses;
      searchResults = trendingStatuses.map((statusId: string) => (
        // @ts-ignore
        <StatusContainer
          key={statusId}
          id={statusId}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      ));
      resultsIds = trendingStatuses;
    } else if (loaded && targetSearch.isFetching) {
      noResultsMessage = <Spinner />;
    } else if (loaded && !targetSearch.isFetching && federationStatus.status.defederated) {
      noResultsMessage = renderFederationStatusMessage();
    } else if (loaded && !targetSearch.isFetching) {
      noResultsMessage = (
        <div className='flex min-h-[160px] flex-1 items-center justify-center rounded-lg bg-primary-50 p-10 text-center text-gray-900 dark:bg-gray-700 dark:text-gray-300'>
          <FormattedMessage
            id='empty_column.search.statuses'
            defaultMessage='There are no posts results for "{term}"'
            values={{ term: value }}
          />
        </div>
      );
    } else {
      noResultsMessage = <Spinner />;
    }
  }

  if (selectedFilter === 'hashtags') {
    hasMore = results.hashtagsHasMore;
    loaded = results.hashtagsLoaded;
    placeholderComponent = PlaceholderHashtag;

    if (results.hashtags && results.hashtags.size > 0) {
      searchResults = results.hashtags.map(hashtag => <Hashtag key={hashtag.name} hashtag={hashtag} />);
    } else if (!submitted && !trends.isEmpty()) {
      searchResults = trends.map(hashtag => <Hashtag key={hashtag.name} hashtag={hashtag} />);
    } else if (loaded) {
      noResultsMessage = (
        <div className='flex min-h-[160px] flex-1 items-center justify-center rounded-lg bg-primary-50 p-10 text-center text-gray-900 dark:bg-gray-700 dark:text-gray-300'>
          <FormattedMessage
            id='empty_column.search.hashtags'
            defaultMessage='There are no hashtags results for "{term}"'
            values={{ term: value }}
          />
        </div>
      );
    }
  }

  return (
    <>
      {filterByAccount && (
        <HStack className='mb-4 border-b border-solid border-gray-200 px-2 pb-4 dark:border-gray-800' space={2}>
          <IconButton iconClassName='h-5 w-5' src={xIcon} onClick={handleUnsetAccount} />
          <Text truncate>
            <FormattedMessage
              id='search_results.filter_message'
              defaultMessage='You are searching for posts from @{acct}.'
              values={{ acct: <strong className='break-words'>{account?.acct}</strong> }}
            />
          </Text>
        </HStack>
      )}

      <FaspSearchNotice
        enabled={Boolean(submitted && me && !filterByAccount && selectedFilter === 'accounts')}
      />

      {noResultsMessage || (
        <ScrollableList
          id='search-results'
          ref={node}
          key={selectedFilter}
          scrollKey={`${selectedFilter}:${value}`}
          isLoading={submitted && !loaded}
          showLoading={submitted && !loaded && (Array.isArray(searchResults) ? !searchResults.length : searchResults?.isEmpty())}
          hasMore={hasMore || targetSearch.hasNextPage}
          onLoadMore={handleLoadMore}
          placeholderComponent={placeholderComponent}
          placeholderCount={20}
          listClassName={clsx({
            'divide-gray-200 dark:divide-gray-800 divide-solid divide-y': selectedFilter === 'statuses',
          })}
          itemClassName={clsx({
            'px-4': selectedFilter !== 'statuses',
            'pb-4': selectedFilter === 'accounts',
            'pb-3': selectedFilter === 'hashtags',
          })}
        >
          {searchResults || []}
        </ScrollableList>
      )}
    </>
  );
};

export default SearchResults;
