/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/federation/floating-media-player.tsx

  Purpose:

    Render the route-persistent docked player used by playable source
    items such as Funkwhale tracks and PeerTube videos.

  Responsibilities:

    * keep audio or video visible while the user navigates the app
    * sit beside the chat widget on wide screens
    * expose compact minimize, restore, external-open, and close controls

  This file intentionally does NOT contain:

    * source item fetching
    * custom media decoding
    * chat state management
*/

import arrowsMaximizeIcon from '@tabler/icons/outline/arrows-maximize.svg';
import externalLinkIcon from '@tabler/icons/outline/external-link.svg';
import minusIcon from '@tabler/icons/outline/minus.svg';
import playerPlayIcon from '@tabler/icons/outline/player-play.svg';
import xIcon from '@tabler/icons/outline/x.svg';
import clsx from 'clsx';
import { defineMessages, useIntl } from 'react-intl';

import SvgIcon from '@/components/ui/svg-icon.tsx';
import { useFloatingMediaPlayer, type FloatingMediaItem } from '@/contexts/floating-media-player-context.tsx';

const messages = defineMessages({
  close: { id: 'floating_media_player.close', defaultMessage: 'Close player' },
  dockLabel: { id: 'floating_media_player.label', defaultMessage: 'Docked media player' },
  mediaFallback: { id: 'floating_media_player.media_fallback', defaultMessage: 'Open media' },
  minimize: { id: 'floating_media_player.minimize', defaultMessage: 'Minimize player' },
  openOriginal: { id: 'floating_media_player.open_original', defaultMessage: 'Open original' },
  restore: { id: 'floating_media_player.restore', defaultMessage: 'Restore player' },
});

const FloatingMediaPlayer: React.FC = () => {
  const intl = useIntl();
  const {
    close,
    isMinimized,
    item,
    toggleMinimized,
  } = useFloatingMediaPlayer();

  if (!item) {
    return null;
  }

  const minimizeLabel = intl.formatMessage(isMinimized ? messages.restore : messages.minimize);

  return (
    <aside
      aria-label={intl.formatMessage(messages.dockLabel)}
      className={clsx(
        'fixed bottom-20 left-3 right-3 z-[98] overflow-hidden rounded-lg border border-solid border-gray-200 bg-white shadow-3xl dark:border-gray-800 dark:bg-gray-900',
        'sm:left-auto sm:right-5 sm:w-96 rtl:sm:left-5 rtl:sm:right-auto',
        'xl:bottom-5 ltr:xl:right-[27rem] rtl:xl:left-[27rem]',
        isMinimized && 'sm:w-80',
      )}
      data-testid='floating-media-player'
    >
      <div className='flex min-w-0 items-center gap-2 border-b border-solid border-gray-200 px-3 py-2 dark:border-gray-800'>
        <SvgIcon className='size-5 flex-none text-primary-600 dark:text-primary-400' src={playerPlayIcon} />

        <div className='min-w-0 flex-1'>
          <a
            className='block truncate text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100'
            href={item.url}
            target='_blank'
            rel='noopener'
          >
            {item.title}
          </a>

          {renderSubtitle(item)}
        </div>

        <a
          aria-label={intl.formatMessage(messages.openOriginal)}
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          href={item.url}
          target='_blank'
          rel='noopener'
          title={intl.formatMessage(messages.openOriginal)}
        >
          <SvgIcon className='size-5' src={externalLinkIcon} />
        </a>

        <button
          aria-label={minimizeLabel}
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          onClick={toggleMinimized}
          title={minimizeLabel}
          type='button'
        >
          <SvgIcon className='size-5' src={isMinimized ? arrowsMaximizeIcon : minusIcon} />
        </button>

        <button
          aria-label={intl.formatMessage(messages.close)}
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          onClick={close}
          title={intl.formatMessage(messages.close)}
          type='button'
        >
          <SvgIcon className='size-5' src={xIcon} />
        </button>
      </div>

      <div className='bg-gray-50 p-3 dark:bg-gray-950/70'>
        {renderMedia(item, isMinimized, intl.formatMessage(messages.mediaFallback))}
      </div>
    </aside>
  );
};

function renderSubtitle(item: FloatingMediaItem) {
  const labels = [item.platformLabel, item.sourceKindLabel].filter(Boolean);

  if (!labels.length) {
    return null;
  }

  return (
    <p className='truncate text-xs text-gray-500 dark:text-gray-400'>
      {labels.join(' · ')}
    </p>
  );
}

function renderMedia(item: FloatingMediaItem, isMinimized: boolean, fallbackLabel: string) {
  if (item.kind === 'audio') {
    return (
      <audio
        aria-label={item.title}
        autoPlay
        className='h-9 w-full'
        controls
        key={item.mediaUrl}
        preload='none'
        src={item.mediaUrl}
      >
        <a href={item.mediaUrl}>{fallbackLabel}</a>
      </audio>
    );
  }

  return (
    <video
      aria-label={item.title}
      autoPlay
      className={clsx(
        'w-full rounded-md bg-black object-contain',
        isMinimized ? 'h-24' : 'max-h-72',
      )}
      controls
      key={item.mediaUrl}
      playsInline
      poster={item.thumbnailUrl || undefined}
      preload='metadata'
      src={item.mediaUrl}
    >
      <a href={item.mediaUrl}>{fallbackLabel}</a>
    </video>
  );
}

export default FloatingMediaPlayer;

/* end of src/features/federation/floating-media-player.tsx */
