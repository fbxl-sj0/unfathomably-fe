import photoOffIcon from '@tabler/icons/outline/photo-off.svg';
import { List as ImmutableList } from 'immutable';
import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { openModal } from '@/actions/modals.ts';
import Account from '@/components/account.tsx';
import GroupAvatar from '@/components/groups/group-avatar.tsx';
import Markup from '@/components/markup.tsx';
import StillImage from '@/components/still-image.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { normalizeAttachment } from '@/normalizers/index.ts';
import { isDefaultHeader } from '@/utils/accounts.ts';

import GroupActionButton from './group-action-button.tsx';
import GroupMemberCount from './group-member-count.tsx';
import GroupOptionsButton from './group-options-button.tsx';
import GroupPrivacy from './group-privacy.tsx';
import GroupRelationship from './group-relationship.tsx';

import type { Group } from '@/types/entities.ts';

const messages = defineMessages({
  header: { id: 'group.header.alt', defaultMessage: 'Group header' },
  moderators: {
    id: 'group.header.moderators',
    defaultMessage: '{count, plural, one {# moderator} other {# moderators}}',
  },
  owner: { id: 'group.header.owner', defaultMessage: 'Group owner' },
  posts: {
    id: 'group.header.posts',
    defaultMessage: '{count, plural, one {# post} other {# posts}}',
  },
});

interface IGroupHeader {
  group?: Group | false | null;
}

const GroupHeader: React.FC<IGroupHeader> = ({ group }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const [isHeaderMissing, setIsHeaderMissing] = useState<boolean>(false);

  if (!group) {
    return (
      <div data-testid='group-header-missing'>
        <div>
          <div className='relative h-32 w-full bg-gray-200 dark:bg-gray-900/50 lg:h-48' />
        </div>

        <div className='px-4 sm:px-6'>
          <HStack alignItems='bottom' space={5} className='-mt-12'>
            <div className='relative flex'>
              <div
                className='size-24 rounded-full bg-gray-400 ring-4 ring-white dark:ring-gray-800'
              />
            </div>
          </HStack>
        </div>
      </div>
    );
  }

  const isDeleted = !!group.deleted_at;

  const onAvatarClick = () => {
    const avatar = normalizeAttachment({
      type: 'image',
      url: group.avatar,
    });
    dispatch(openModal('MEDIA', { media: ImmutableList.of(avatar).toJS(), index: 0 }));
  };

  const handleAvatarClick: React.MouseEventHandler = (e) => {
    if (e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onAvatarClick();
    }
  };

  const onHeaderClick = () => {
    const header = normalizeAttachment({
      type: 'image',
      url: group.header,
    });
    dispatch(openModal('MEDIA', { media: ImmutableList.of(header).toJS(), index: 0 }));
  };

  const handleHeaderClick: React.MouseEventHandler = (e) => {
    if (e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onHeaderClick();
    }
  };

  const renderHeader = () => {
    let header: React.ReactNode;

    if (group.header) {
      header = (
        <StillImage
          src={group.header}
          alt={intl.formatMessage(messages.header)}
          className='relative h-32 w-full bg-gray-200 object-center dark:bg-gray-900/50 md:rounded-t-xl lg:h-52'
          onError={() => setIsHeaderMissing(true)}
        />
      );

      if (!isDefaultHeader(group.header)) {
        header = (
          <a href={group.header} onClick={handleHeaderClick} target='_blank' className='relative w-full'>
            {header}
          </a>
        );
      }
    }

    return (
      <div
        data-testid='group-header-image'
        className='flex h-32 w-full items-center justify-center bg-gray-200 dark:bg-gray-800/30 md:rounded-t-xl lg:h-52'
      >
        {isHeaderMissing ? (
          <Icon src={photoOffIcon} className='size-6 text-gray-500 dark:text-gray-700' />
        ) : header}
      </div>
    );
  };

  return (
    <div>
      <div className='relative'>
        {renderHeader()}

        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' data-testid='group-avatar'>
          <a href={group.avatar} onClick={handleAvatarClick} target='_blank'>
            <GroupAvatar
              group={group}
              size={80}
              withRing
              fallbackSrc={group.owner_account?.avatar}
            />
          </a>
        </div>
      </div>

      <Stack alignItems='center' space={3} className='mx-auto mt-10 w-5/6 py-4'>
        <Text size='xl' weight='bold' data-testid='group-name'>
          {group.display_name}
        </Text>

        {!isDeleted && (
          <>
            <Stack data-testid='group-meta' space={1} alignItems='center'>
              <HStack className='text-gray-700 dark:text-gray-600' space={2} wrap>
                <GroupRelationship group={group} />
                <GroupPrivacy group={group} />
                <GroupMemberCount group={group} />
              </HStack>

              {group.nostr && (
                <HStack justifyContent='center' space={2} wrap>
                  <Text size='sm' theme='muted'>{group.platform_label}</Text>
                  {group.domain && <Text size='sm' theme='muted'>{group.domain}</Text>}
                  {group.moderators_count > 0 && (
                    <Text size='sm' theme='muted'>
                      <FormattedMessage {...messages.moderators} values={{ count: group.moderators_count }} />
                    </Text>
                  )}
                  {group.statuses_count > 0 && (
                    <Text size='sm' theme='muted'>
                      <FormattedMessage {...messages.posts} values={{ count: group.statuses_count }} />
                    </Text>
                  )}
                </HStack>
              )}

              <Markup
                theme='muted'
                align='center'
                html={{ __html: group.note }}
                emojis={group.emojis}
                className='min-w-0 max-w-full whitespace-pre-wrap [overflow-wrap:anywhere] [&_a]:text-primary-600 [&_a]:hover:underline [&_a]:dark:text-accent-blue'
              />
            </Stack>

            {group.owner_account && (
              <Stack space={1} className='w-full max-w-sm'>
                <Text size='xs' theme='muted' weight='medium'>
                  <FormattedMessage {...messages.owner} />
                </Text>
                <Account
                  account={group.owner_account}
                  avatarSize={32}
                  hideActions
                  withRelationship={false}
                />
              </Stack>
            )}

            <HStack alignItems='center' space={2} data-testid='group-actions'>
              <GroupOptionsButton group={group} />
              <GroupActionButton group={group} />
            </HStack>
          </>
        )}
      </Stack>
    </div>
  );
};

export default GroupHeader;
