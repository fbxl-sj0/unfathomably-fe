/*
 * Unfathomably FE
 * ----------------
 *
 * File: profile-protocol-addresses.tsx
 *
 * Purpose:
 *   Present the public protocol addresses assigned to a local account.
 *
 * Responsibilities:
 *   - always expose the account's ActivityPub address
 *   - expose Nostr and Bluesky identities only when provisioned
 *   - provide useful profile links and copy controls without adding a card
 *
 * This file intentionally does NOT provision identities, fetch profiles, or
 * present protocol mirrors as local accounts.
 */

import clipboardCopyIcon from '@tabler/icons/outline/clipboard-copy.svg';
import { FormattedMessage, useIntl } from 'react-intl';

import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import copy from '@/utils/copy.ts';

import type { Account } from '@/schemas/index.ts';

interface IProfileProtocolAddresses {
  account: Account;
}

interface IProtocolAddress {
  id: 'activitypub' | 'nostr' | 'bluesky' | 'diaspora';
  label: React.ReactNode;
  value: string;
  href: string;
}

const protocolName = (id: IProtocolAddress['id']): string => {
  switch (id) {
    case 'activitypub':
      return 'ActivityPub';
    case 'nostr':
      return 'Nostr';
    case 'bluesky':
      return 'Bluesky';
    case 'diaspora':
      return 'Diaspora';
  }
};

const ProfileProtocolAddresses: React.FC<IProfileProtocolAddresses> = ({ account }) => {
  const intl = useIntl();

  if (!account.local) return null;

  const activityPubAddress = `@${account.fqn}`;
  const nostrAddress = account.nostr.npub;
  const blueskyHandle = account.atproto?.handle;
  const diasporaAddress = account.diaspora?.id;

  const addresses: IProtocolAddress[] = [
    {
      id: 'activitypub',
      label: <FormattedMessage id='account.protocol_address.activitypub' defaultMessage='ActivityPub' />,
      value: activityPubAddress,
      href: account.url,
    },
  ];

  if (nostrAddress) {
    addresses.push({
      id: 'nostr',
      label: <FormattedMessage id='account.protocol_address.nostr' defaultMessage='Nostr' />,
      value: nostrAddress,
      href: `nostr:${account.nostr.nprofile || nostrAddress}`,
    });
  }

  if (blueskyHandle) {
    addresses.push({
      id: 'bluesky',
      label: <FormattedMessage id='account.protocol_address.bluesky' defaultMessage='Bluesky' />,
      value: `@${blueskyHandle}`,
      href: account.atproto?.profile_url || `https://bsky.app/profile/${encodeURIComponent(blueskyHandle)}`,
    });
  }

  if (diasporaAddress) {
    addresses.push({
      id: 'diaspora',
      label: <FormattedMessage id='account.protocol_address.diaspora' defaultMessage='Diaspora' />,
      value: diasporaAddress,
      href: account.diaspora?.profile_url || account.url,
    });
  }

  return (
    <Stack space={0.5} className='mt-0.5 max-w-full'>
      {addresses.map(({ id, label, value, href }) => (
        <HStack key={id} alignItems='center' space={1.5} className='min-w-0 max-w-full'>
          <Text size='xs' theme='muted' className='w-[68px] shrink-0'>
            {label}
          </Text>

          <a
            href={href}
            target={id === 'activitypub' ? undefined : '_blank'}
            rel={id === 'activitypub' ? undefined : 'noopener noreferrer'}
            title={value}
            className='min-w-0 truncate text-sm text-primary-600 hover:underline dark:text-accent-blue'
          >
            {value}
          </a>

          <button
            type='button'
            onClick={() => copy(value)}
            title={intl.formatMessage(
              { id: 'account.protocol_address.copy', defaultMessage: 'Copy {protocol} address' },
              { protocol: protocolName(id) },
            )}
            className='shrink-0 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300'
          >
            <Icon src={clipboardCopyIcon} className='size-3.5' />
          </button>
        </HStack>
      ))}
    </Stack>
  );
};

export default ProfileProtocolAddresses;

/* end of profile-protocol-addresses.tsx */
