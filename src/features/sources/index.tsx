import minusIcon from '@tabler/icons/outline/minus.svg';
import plusIcon from '@tabler/icons/outline/plus.svg';
import rssIcon from '@tabler/icons/outline/rss.svg';
import { useEffect, useId, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useFollowSource, useSources, useUnfollowSource } from '@/api/hooks/index.ts';
import SourceItemsPreview from './source-items-preview.tsx';
import ScrollableList from '@/components/scrollable-list.tsx';
import Avatar from '@/components/ui/avatar.tsx';
import Button from '@/components/ui/button.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import IconButton from '@/components/ui/icon-button.tsx';
import Input from '@/components/ui/input.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import CapabilityChips from '@/features/federation/capability-chips.tsx';
import PlatformBadge from '@/features/federation/platform-badge.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';

import type { Source } from '@/schemas/index.ts';

import TabBar, { TabItems } from './components/tab-bar.tsx';

const messages = defineMessages({
  collapseSource: { id: 'sources.actions.collapse', defaultMessage: 'Collapse feed' },
  expandSource: { id: 'sources.actions.expand', defaultMessage: 'Expand feed' },
  hideAutomated: { id: 'sources.filters.hide_automated', defaultMessage: 'Hide bots and services' },
  placeholder: { id: 'sources.search.placeholder', defaultMessage: 'Search feeds or paste a feed/actor URL' },
});

type SourceFilter = 'all' | 'rss_feed' | 'blog_publisher' | 'collection_channel' | 'library' | 'application_source';

const sourceFilters: SourceFilter[] = [
  'all',
  'rss_feed',
  'blog_publisher',
  'collection_channel',
  'library',
  'application_source',
];

const filterPreferenceKey = 'unfathomably:feeds:filter';
const hideAutomatedPreferenceKey = 'unfathomably:feeds:hide-automated';
const automatedActorTypes = new Set(['Application', 'Service']);

const loadSourceFilterPreference = (): SourceFilter => {
  if (typeof window === 'undefined') {
    return 'all';
  }

  try {
    const value = window.localStorage.getItem(filterPreferenceKey);

    if (sourceFilters.includes(value as SourceFilter)) {
      return value as SourceFilter;
    }
  } catch {
    // Private browsing and test harnesses can deny local storage access.
  }

  return 'all';
};

const loadHideAutomatedPreference = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(hideAutomatedPreferenceKey) === 'true';
  } catch {
    return false;
  }
};

const profileLabel = (source: Source) => {
  switch (source.source_profile) {
    case 'application_source':
      return <FormattedMessage id='sources.profile.application_source' defaultMessage='Application source' />;
    case 'blog_publisher':
      return <FormattedMessage id='sources.profile.blog_publisher' defaultMessage='Blog publisher' />;
    case 'collection_channel':
      return <FormattedMessage id='sources.profile.collection_channel' defaultMessage='Collection channel' />;
    case 'library':
      return <FormattedMessage id='sources.profile.library' defaultMessage='Library' />;
    case 'rss_feed':
      return <FormattedMessage id='sources.profile.rss_feed' defaultMessage='RSS feed' />;
    default:
      return <FormattedMessage id='sources.profile.activitypub_profile' defaultMessage='Profile feed' />;
  }
};

const sourceNativeHint = (source: Source) => {
  switch (source.source_profile) {
    case 'blog_publisher':
      return <FormattedMessage id='sources.native.blog_publisher' defaultMessage='Blog posts and article replies' />;
    case 'collection_channel':
      return <FormattedMessage id='sources.native.collection_channel' defaultMessage='Channel, collection, or event updates' />;
    case 'library':
      return <FormattedMessage id='sources.native.library' defaultMessage='Library collection items' />;
    case 'rss_feed':
      return <FormattedMessage id='sources.native.rss_feed' defaultMessage='Read-only feed items' />;
    case 'application_source':
      return <FormattedMessage id='sources.native.application_source' defaultMessage='Application-published activity' />;
    default:
      return <FormattedMessage id='sources.native.activitypub_profile' defaultMessage='Profile feed items' />;
  }
};

const sourceFilterLabel = (filter: SourceFilter) => {
  switch (filter) {
    case 'rss_feed':
      return <FormattedMessage id='sources.filters.rss_feed' defaultMessage='RSS' />;
    case 'blog_publisher':
      return <FormattedMessage id='sources.filters.blog_publisher' defaultMessage='Blogs' />;
    case 'collection_channel':
      return <FormattedMessage id='sources.filters.collection_channel' defaultMessage='Channels' />;
    case 'library':
      return <FormattedMessage id='sources.filters.library' defaultMessage='Libraries' />;
    case 'application_source':
      return <FormattedMessage id='sources.filters.application_source' defaultMessage='Apps' />;
    default:
      return <FormattedMessage id='sources.filters.all' defaultMessage='All' />;
  }
};

const sourceLooksAutomated = (source: Source) => (
  automatedActorTypes.has(source.actor_type) ||
  source.source_profile === 'application_source'
);

const sourceMatchesFilter = (source: Source, filter: SourceFilter) => (
  filter === 'all' || source.source_profile === filter
);

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim();

interface ISourceListItem {
  source: Source;
  onChanged: () => void;
}

const SourceListItem: React.FC<ISourceListItem> = ({ source, onChanged }) => {
  const intl = useIntl();
  const detailsId = useId();
  const followSource = useFollowSource(source);
  const unfollowSource = useUnfollowSource(source);
  const [expanded, setExpanded] = useState(false);
  const isFollowing = !!source.relationship?.following;
  const isRequested = !!source.relationship?.requested;
  const isConnected = isFollowing || isRequested;
  const isSubmitting = followSource.isSubmitting || unfollowSource.isSubmitting;
  const note = stripHtml(source.note);
  const expandLabel = intl.formatMessage(expanded ? messages.collapseSource : messages.expandSource);

  let buttonMessage = <FormattedMessage id='sources.actions.follow' defaultMessage='Follow' />;

  if (isFollowing) {
    buttonMessage = <FormattedMessage id='sources.actions.unfollow' defaultMessage='Following' />;
  } else if (isRequested) {
    buttonMessage = <FormattedMessage id='sources.actions.requested' defaultMessage='Requested' />;
  }

  const handleClick = () => {
    const mutation = isConnected ? unfollowSource : followSource;

    mutation.mutate({}, {
      onSuccess: () => {
        mutation.invalidate();
        onChanged();
      },
    });
  };

  const handleExpandClick = () => {
    setExpanded((value) => !value);
  };

  return (
    <Stack space={expanded ? 3 : 0}>
      <HStack alignItems='center' justifyContent='between' space={3} className='gap-y-3' wrap>
        <HStack alignItems='center' space={3} className='min-w-0' grow>
          <IconButton
            aria-label={expandLabel}
            aria-controls={detailsId}
            aria-expanded={expanded}
            iconClassName='size-5'
            onClick={handleExpandClick}
            src={expanded ? minusIcon : plusIcon}
            theme='outlined'
            title={expandLabel}
          />

          <Avatar src={source.avatar} size={48} />

          <Stack className='min-w-0' space={0.5}>
            <HStack alignItems='center' space={1.5} className='min-w-0' wrap>
              <Text weight='bold' truncate>
                {source.display_name || source.acct || source.url}
              </Text>

              <Text size='xs' theme='muted'>
                {profileLabel(source)}
              </Text>

              <PlatformBadge family={source.platform_family} label={source.platform_label} />
            </HStack>

            <Text size='sm' theme='muted' truncate>
              {source.acct || source.domain || source.url}
            </Text>

            <Text size='sm' theme='muted' truncate>
              {sourceNativeHint(source)}
            </Text>
          </Stack>
        </HStack>

        <HStack alignItems='center' space={2} className='ml-auto shrink-0'>
          {source.url ? (
            <Button
              href={source.url}
              rel='noopener'
              size='sm'
              target='_blank'
              theme='tertiary'
            >
              <FormattedMessage id='sources.actions.open_native' defaultMessage='Open' />
            </Button>
          ) : null}

          <Button
            disabled={isSubmitting}
            onClick={handleClick}
            size='sm'
            theme={isConnected ? 'secondary' : 'primary'}
          >
            {buttonMessage}
          </Button>
        </HStack>
      </HStack>

      {expanded ? (
        <Stack
          className='border-l border-solid border-gray-200 pl-4 sm:ml-[84px] dark:border-gray-800'
          id={detailsId}
          space={2}
        >
          <CapabilityChips labels={source.capabilities} />

          {note && (
            <Text size='sm' theme='muted'>
              {note}
            </Text>
          )}

          <SourceItemsPreview source={source} />
        </Stack>
      ) : null}
    </Stack>
  );
};

const Sources: React.FC = () => {
  const debounce = useDebounce;
  const intl = useIntl();
  const searchId = useId();
  const hideAutomatedId = useId();

  const [searchValue, setSearchValue] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(loadSourceFilterPreference);
  const [hideAutomated, setHideAutomated] = useState(loadHideAutomatedPreference);
  const debouncedValue = debounce(searchValue, 300);
  const { sources, isLoading, hasNextPage, fetchNextPage, invalidate } = useSources(debouncedValue);

  useEffect(() => {
    try {
      window.localStorage.setItem(filterPreferenceKey, sourceFilter);
    } catch {
      // The selected filter is still useful for the current page load.
    }
  }, [sourceFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem(hideAutomatedPreferenceKey, String(hideAutomated));
    } catch {
      // The selected filter is still useful for the current page load.
    }
  }, [hideAutomated]);

  const visibleSources = useMemo(() => sources.filter((source) => {
    if (hideAutomated && sourceLooksAutomated(source)) {
      return false;
    }

    return sourceMatchesFilter(source, sourceFilter);
  }), [hideAutomated, sourceFilter, sources]);

  const sourceCounts = useMemo(() => {
    const counts = Object.fromEntries(sourceFilters.map((filter) => [filter, 0])) as Record<SourceFilter, number>;

    sources.forEach((source) => {
      if (hideAutomated && sourceLooksAutomated(source)) {
        return;
      }

      counts.all += 1;

      const profile = source.source_profile as SourceFilter;

      if (profile !== 'all' && sourceFilters.includes(profile)) {
        counts[profile] += 1;
      }
    });

    return counts;
  }, [hideAutomated, sources]);

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const renderBlankslate = () => (
    <Stack space={4} alignItems='center' justifyContent='center' className='py-8'>
      <div className='rounded-full bg-primary-50 p-4 dark:bg-gray-800'>
        <Icon src={rssIcon} className='size-7 text-primary-500' />
      </div>

      <Stack space={2} className='max-w-md'>
        <Text size='2xl' weight='bold' tag='h2' align='center'>
          <FormattedMessage id='sources.empty.title' defaultMessage='No feeds yet' />
        </Text>

        <Text size='sm' theme='muted' align='center'>
          <FormattedMessage
            id='sources.empty.subtitle'
            defaultMessage='Search for RSS/Atom feeds, Funkwhale libraries, blogs, podcasts, channels, and other feed-like actors.'
          />
        </Text>
      </Stack>
    </Stack>
  );

  const renderFilteredBlankslate = () => (
    <Stack space={4} alignItems='center' justifyContent='center' className='py-8'>
      <div className='rounded-full bg-primary-50 p-4 dark:bg-gray-800'>
        <Icon src={rssIcon} className='size-7 text-primary-500' />
      </div>

      <Stack space={2} className='max-w-md'>
        <Text size='xl' weight='bold' tag='h2' align='center'>
          <FormattedMessage id='sources.filters.empty.title' defaultMessage='No matching feeds' />
        </Text>

        <Text size='sm' theme='muted' align='center'>
          <FormattedMessage
            id='sources.filters.empty.subtitle'
            defaultMessage='Change the feed type or automated-source filter to show more feeds.'
          />
        </Text>
      </Stack>
    </Stack>
  );

  return (
    <Stack space={4}>
      <TabBar activeTab={TabItems.MY_SOURCES} />

      <Stack space={1}>
        <Text size='2xl' weight='bold' tag='h1'>
          <FormattedMessage id='sources.heading' defaultMessage='Feeds' />
        </Text>

        <Text theme='muted'>
          <FormattedMessage
            id='sources.subtitle'
            defaultMessage='Follow RSS/Atom feeds, libraries, podcasts, blogs, and channel-like actors that do not fit cleanly into the normal account or group feeds.'
          />
        </Text>
      </Stack>

      <div>
        <label className='sr-only' htmlFor={searchId}>
          {intl.formatMessage(messages.placeholder)}
        </label>

        <Input
          id={searchId}
          name='sources-search'
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={intl.formatMessage(messages.placeholder)}
          theme='search'
          value={searchValue}
        />
      </div>

      <Stack space={2}>
        <HStack space={2} className='gap-y-2' wrap>
          {sourceFilters.map((filter) => (
            <Button
              className='shrink-0'
              key={filter}
              onClick={() => setSourceFilter(filter)}
              size='sm'
              theme={sourceFilter === filter ? 'primary' : 'secondary'}
            >
              {sourceFilterLabel(filter)}

              <span className='ml-1 text-xs opacity-75'>
                {sourceCounts[filter]}
              </span>
            </Button>
          ))}
        </HStack>

        <label className='inline-flex max-w-max items-center gap-2 text-sm text-gray-700 dark:text-gray-300' htmlFor={hideAutomatedId}>
          <input
            checked={hideAutomated}
            className='size-4 rounded border-2 border-gray-300 bg-white text-primary-600 accent-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 black:border-gray-700 black:bg-gray-900'
            id={hideAutomatedId}
            name='sources-hide-automated'
            onChange={(event) => setHideAutomated(event.currentTarget.checked)}
            type='checkbox'
          />

          <span>{intl.formatMessage(messages.hideAutomated)}</span>
        </label>
      </Stack>

      <ScrollableList
        scrollKey='sources'
        emptyMessage={sources.length > 0 ? renderFilteredBlankslate() : renderBlankslate()}
        emptyMessageCard={false}
        itemClassName='border-b border-solid border-gray-200 py-4 last:border-b-0 dark:border-gray-800'
        isLoading={isLoading}
        showLoading={isLoading && sources.length === 0}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
      >
        {visibleSources.map((source) => (
          <SourceListItem key={source.id} source={source} onChanged={invalidate} />
        ))}
      </ScrollableList>
    </Stack>
  );
};

export default Sources;
export { SourceListItem };
