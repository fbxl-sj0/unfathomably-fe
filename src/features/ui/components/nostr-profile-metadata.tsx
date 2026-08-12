/*
 * Unfathomably FE
 * File: nostr-profile-metadata.tsx
 * Purpose: Present native Nostr status and badge profile metadata.
 * Responsibilities: Render bounded status links and unprivileged badge imagery.
 * This file intentionally does not grant roles or fetch data from Nostr relays.
 */

import activityIcon from '@tabler/icons/outline/activity.svg';
import externalLinkIcon from '@tabler/icons/outline/external-link.svg';
import musicIcon from '@tabler/icons/outline/music.svg';
import { FormattedMessage } from 'react-intl';

import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';

import type { Account } from '@/schemas/index.ts';

interface INostrProfileMetadata {
  account: Account;
}

const safeWebUrl = (value?: string): string | undefined => {
  try {
    const url = new URL(value || '');
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const NostrProfileMetadata: React.FC<INostrProfileMetadata> = ({ account }) => {
  const statuses = account.nostr.statuses;
  const badges = account.nostr.badges;

  if (!statuses.length && !badges.length) return null;

  return (
    <Stack space={2}>
      {statuses.map((status) => {
        const url = safeWebUrl(status.url);
        const music = status.type === 'music';

        return (
          <HStack
            key={`${status.type}:${status.event_id || status.created_at || status.content}`}
            alignItems='center'
            space={1.5}
            className='w-fit max-w-full rounded border border-primary-500/30 bg-primary-500/10 px-2 py-1'
          >
            <Icon src={music ? musicIcon : activityIcon} className='size-4 shrink-0 text-primary-600 dark:text-primary-300' />
            <Text size='sm' className='min-w-0 break-words'>
              <span className='mr-1 font-medium'>
                {music ? (
                  <FormattedMessage id='account.nostr_status.music' defaultMessage='Listening:' />
                ) : (
                  <FormattedMessage id='account.nostr_status.general' defaultMessage='Status:' />
                )}
              </span>
              {status.content}
            </Text>
            {url ? (
              <a href={url} target='_blank' rel='noopener noreferrer' title={url}>
                <Icon src={externalLinkIcon} className='size-4 text-primary-600 dark:text-primary-300' />
              </a>
            ) : null}
          </HStack>
        );
      })}

      {badges.length ? (
        <HStack space={1} alignItems='center' className='flex-wrap'>
          {badges.map((badge) => {
            const image = badge.thumbnail || badge.image;
            const title = badge.description ? `${badge.name}: ${badge.description}` : badge.name;

            return image ? (
              <img
                key={`${badge.id}:${badge.award_event_id}`}
                src={image}
                alt={badge.name}
                title={title}
                loading='lazy'
                className='size-7 rounded-full border border-primary-500/40 object-cover'
              />
            ) : (
              <span
                key={`${badge.id}:${badge.award_event_id}`}
                title={title}
                className='inline-flex rounded border border-primary-500/40 bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-200'
              >
                {badge.name}
              </span>
            );
          })}
        </HStack>
      ) : null}
    </Stack>
  );
};

export default NostrProfileMetadata;

/* end of nostr-profile-metadata.tsx */
