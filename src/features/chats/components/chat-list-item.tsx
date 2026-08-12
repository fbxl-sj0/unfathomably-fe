/*
  Project: Unfathomably FE
  File: features/chats/components/chat-list-item.tsx

  Purpose:
    Render one chat inbox row and its available actions.

  Responsibilities:
    Show chat identity and unread state, expose advertised pin controls, and
    provide the supported leave-chat action.

  This file intentionally does NOT contain:
    Chat API endpoint construction or inbox query management.
*/

import dotsIcon from '@tabler/icons/outline/dots.svg';
import logoutIcon from '@tabler/icons/outline/logout.svg';
import pinIcon from '@tabler/icons/outline/pin.svg';
import pinnedOffIcon from '@tabler/icons/outline/pinned-off.svg';
import { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { openModal } from '@/actions/modals.ts';
import DropdownMenu from '@/components/dropdown-menu/index.ts';
import RelativeTimestamp from '@/components/relative-timestamp.tsx';
import Avatar from '@/components/ui/avatar.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import IconButton from '@/components/ui/icon-button.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import VerificationBadge from '@/components/verification-badge.tsx';
import { useChatContext } from '@/contexts/chat-context.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { IChat, useChatActions } from '@/queries/chats.ts';

import type { Menu } from '@/components/dropdown-menu/index.ts';

const messages = defineMessages({
  blockedYou: { id: 'chat_list_item.blocked_you', defaultMessage: 'This user has blocked you' },
  blocking: { id: 'chat_list_item.blocking', defaultMessage: 'You have blocked this user' },
  leaveMessage: { id: 'chat_settings.leave.message', defaultMessage: 'Are you sure you want to leave this chat? Messages will be deleted for you and this chat will be removed from your inbox.' },
  leaveHeading: { id: 'chat_settings.leave.heading', defaultMessage: 'Leave Chat' },
  leaveConfirm: { id: 'chat_settings.leave.confirm', defaultMessage: 'Leave Chat' },
  leaveChat: { id: 'chat_settings.options.leave_chat', defaultMessage: 'Leave Chat' },
  pinChat: { id: 'chat_settings.options.pin_chat', defaultMessage: 'Pin chat' },
  pinnedChat: { id: 'chat_list_item.pinned', defaultMessage: 'Pinned chat' },
  unpinChat: { id: 'chat_settings.options.unpin_chat', defaultMessage: 'Unpin chat' },
});

interface IChatListItemInterface {
  chat: IChat;
  onClick: (chat: any) => void;
}

const ChatListItem: React.FC<IChatListItemInterface> = ({ chat, onClick }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const features = useFeatures();
  const history = useHistory();

  const { isUsingMainChatPage } = useChatContext();
  const { deleteChat, toggleChatPin } = useChatActions(chat?.id as string);
  const isBlocked = useAppSelector((state) => state.relationships.getIn([chat.account.id, 'blocked_by']));
  const isBlocking = useAppSelector((state) => state.relationships.getIn([chat?.account?.id, 'blocking']));

  const menu = useMemo((): Menu => {
    const items: Menu = [];

    if (features.chatPinning) {
      items.push({
        text: intl.formatMessage(chat.pinned ? messages.unpinChat : messages.pinChat),
        action: (event) => {
          event.stopPropagation();
          toggleChatPin.mutate(!!chat.pinned);
        },
        icon: chat.pinned ? pinnedOffIcon : pinIcon,
      });
    }

    if (features.chatsDelete) {
      items.push({
        text: intl.formatMessage(messages.leaveChat),
        action: (event) => {
          event.stopPropagation();

          dispatch(openModal('CONFIRM', {
            heading: intl.formatMessage(messages.leaveHeading),
            message: intl.formatMessage(messages.leaveMessage),
            confirm: intl.formatMessage(messages.leaveConfirm),
            confirmationTheme: 'primary',
            onConfirm: () => {
              deleteChat.mutate(undefined, {
                onSuccess() {
                  if (isUsingMainChatPage) {
                    history.push('/chats');
                  }
                },
              });
            },
          }));
        },
        icon: logoutIcon,
      });
    }

    return items;
  }, [chat.pinned, deleteChat, dispatch, features.chatPinning, features.chatsDelete, history, intl, isUsingMainChatPage, toggleChatPin]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick(chat);
    }
  };

  return (
    <div
      role='button'
      key={chat.id}
      onClick={() => onClick(chat)}
      onKeyDown={handleKeyDown}
      className='group flex w-full flex-col rounded-lg px-2 py-3 hover:bg-gray-100 focus:shadow-inset-ring dark:hover:bg-gray-800'
      data-testid='chat-list-item'
      tabIndex={0}
    >
      <HStack alignItems='center' justifyContent='between' space={2} className='w-full'>
        <HStack alignItems='center' space={2} className='overflow-hidden'>
          <Avatar src={chat.account?.avatar} size={40} className='flex-none' />

          <Stack alignItems='start' className='overflow-hidden'>
            <div className='flex w-full grow items-center space-x-1'>
              <Text weight='bold' size='sm' align='left' truncate>{chat.account?.display_name || `@${chat.account.username}`}</Text> {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}
              {chat.pinned && (
                <Icon
                  src={pinIcon}
                  alt={intl.formatMessage(messages.pinnedChat)}
                  className='size-4 text-primary-600 dark:text-primary-400'
                  data-testid='chat-pinned-indicator'
                />
              )}
              {chat.account?.verified && <VerificationBadge />}
            </div>

            {(isBlocked || isBlocking) ? (
              <Text
                align='left'
                size='sm'
                weight='medium'
                theme='muted'
                truncate
                className='pointer-events-none h-5 w-full italic'
                data-testid='chat-last-message'
              >
                {intl.formatMessage(isBlocked ? messages.blockedYou : messages.blocking)}
              </Text>
            ) : (
              <>
                {chat.last_message?.content && (
                  <Text
                    align='left'
                    size='sm'
                    weight='medium'
                    theme={chat.last_message.unread ? 'default' : 'muted'}
                    truncate
                    className='truncate-child pointer-events-none h-5 w-full'
                    data-testid='chat-last-message'
                    dangerouslySetInnerHTML={{ __html: chat.last_message?.content }}
                  />
                )}
              </>
            )}
          </Stack>
        </HStack>

        <HStack alignItems='center' space={2}>
          {menu.length > 0 && (
            <div className='hidden text-gray-600 hover:text-gray-100 group-hover:block'>
              <DropdownMenu items={menu}>
                <IconButton
                  src={dotsIcon}
                  title='Settings'
                  className='text-gray-600 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-500'
                  iconClassName='h-4 w-4'
                />
              </DropdownMenu>
            </div>
          )}

          {chat.last_message && (
            <>
              {chat.last_message.unread && (
                <div
                  className='size-2 rounded-full bg-secondary-500'
                  data-testid='chat-unread-indicator'
                />
              )}

              <RelativeTimestamp
                timestamp={chat.last_message.created_at}
                align='right'
                size='xs'
                theme={chat.last_message.unread ? 'default' : 'muted'}
                truncate
              />
            </>
          )}
        </HStack>
      </HStack>
    </div>
  );
};

export default ChatListItem;

/* end of features/chats/components/chat-list-item.tsx */
