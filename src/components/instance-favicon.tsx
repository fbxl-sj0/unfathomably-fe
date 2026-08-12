import asteriskIcon from '@tabler/icons/outline/asterisk.svg';
import blueskyIcon from '@tabler/icons/outline/brand-bluesky.svg';
import boltIcon from '@tabler/icons/outline/bolt.svg';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import Icon from '@/components/ui/icon.tsx';

import type { Account as AccountSchema } from '@/schemas/index.ts';

interface IInstanceFavicon {
  account: AccountSchema;
  disabled?: boolean;
}

const protocolFavicon = (account: AccountSchema) => {
  if (account.atproto?.mirror) {
    return { icon: blueskyIcon, label: 'AT Protocol' };
  }

  if (account.diaspora?.mirror) {
    return { icon: asteriskIcon, label: 'diaspora*' };
  }

  if (['mirror_profile', 'mirror_group'].includes(account.nostr?.kind || '')) {
    return { icon: boltIcon, label: 'Nostr' };
  }

  return undefined;
};

export const InstanceFavicon: React.FC<IInstanceFavicon> = ({ account, disabled }) => {
  const history = useHistory();
  const [missing, setMissing] = useState<boolean>(false);
  const protocol = protocolFavicon(account);

  const handleError = () => setMissing(true);

  const handleClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();

    if (disabled) return;

    const timelineUrl = `/timeline/${account.domain}`;
    if (!(e.ctrlKey || e.metaKey)) {
      history.push(timelineUrl);
    } else {
      window.open(timelineUrl, '_blank');
    }
  };

  if (protocol) {
    return (
      <span
        className='flex size-4 flex-none items-center justify-center text-primary-600 dark:text-primary-400'
        aria-label={protocol.label}
        title={protocol.label}
        data-testid='protocol-favicon'
      >
        <Icon src={protocol.icon} className='size-4' />
      </span>
    );
  }

  if (missing || !account.pleroma?.favicon) {
    return null;
  }

  return (
    <button
      className='size-4 flex-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      onClick={handleClick}
      disabled={disabled}
    >
      <img
        src={account.pleroma.favicon}
        alt=''
        title={account.domain}
        className='max-h-full w-full'
        onError={handleError}
      />
    </button>
  );
};
