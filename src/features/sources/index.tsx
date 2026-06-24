import minusIcon from '@tabler/icons/outline/minus.svg';
import plusIcon from '@tabler/icons/outline/plus.svg';
import rssIcon from '@tabler/icons/outline/rss.svg';
import { useId, useState } from 'react';
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
  collapseSource: { id: 'sources.actions.collapse', defaultMessage: 'Collapse source' },
  expandSource: { id: 'sources.actions.expand', defaultMessage: 'Expand source' },
  placeholder: { id: 'sources.search.placeholder', defaultMessage: 'Search sources or paste an actor/feed URL' },
});

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
      return <FormattedMessage id='sources.profile.activitypub_profile' defaultMessage='ActivityPub profile' />;
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
      return <FormattedMessage id='sources.native.activitypub_profile' defaultMessage='Profile posts and replies' />;
  }
};

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

  const [searchValue, setSearchValue] = useState('');
  const debouncedValue = debounce(searchValue, 300);
  const { sources, isLoading, hasNextPage, fetchNextPage, invalidate } = useSources(debouncedValue);

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
          <FormattedMessage id='sources.empty.title' defaultMessage='No sources yet' />
        </Text>

        <Text size='sm' theme='muted' align='center'>
          <FormattedMessage
            id='sources.empty.subtitle'
            defaultMessage='Search for a blog, channel, profile, feed URL, or ActivityPub actor URL to follow it as a source.'
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
          <FormattedMessage id='sources.heading' defaultMessage='Sources' />
        </Text>

        <Text theme='muted'>
          <FormattedMessage
            id='sources.subtitle'
            defaultMessage='Follow ActivityPub blogs, channels, profiles, collection publishers, and RSS feeds without pretending they are all the same kind of group.'
          />
        </Text>
      </Stack>

      <div>
        <label className='sr-only' htmlFor={searchId}>
          {intl.formatMessage(messages.placeholder)}
        </label>

        <Input
          id={searchId}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={intl.formatMessage(messages.placeholder)}
          theme='search'
          value={searchValue}
        />
      </div>

      <ScrollableList
        scrollKey='sources'
        emptyMessage={renderBlankslate()}
        emptyMessageCard={false}
        itemClassName='border-b border-solid border-gray-200 py-4 last:border-b-0 dark:border-gray-800'
        isLoading={isLoading}
        showLoading={isLoading && sources.length === 0}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
      >
        {sources.map((source) => (
          <SourceListItem key={source.id} source={source} onChanged={invalidate} />
        ))}
      </ScrollableList>
    </Stack>
  );
};

export default Sources;
export { SourceListItem };
