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
  next: { id: 'floating_media_player.next', defaultMessage: 'Next' },
  position: { id: 'floating_media_player.position', defaultMessage: '{current} of {total}' },
  previous: { id: 'floating_media_player.previous', defaultMessage: 'Previous' },
  queue: { id: 'floating_media_player.queue', defaultMessage: 'Queue' },
  queueSummary: { id: 'floating_media_player.queue_summary', defaultMessage: 'Queue, {count} items' },
  remove: { id: 'floating_media_player.remove', defaultMessage: 'Remove' },
  removeItem: { id: 'floating_media_player.remove_item', defaultMessage: 'Remove {title}' },
  restore: { id: 'floating_media_player.restore', defaultMessage: 'Restore player' },
});

const FloatingMediaPlayer: React.FC = () => {
  const intl = useIntl();
  const {
    close,
    isMinimized,
    item,
    currentIndex,
    playAt,
    playNext,
    playPrevious,
    queue,
    removeAt,
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
        'fixed bottom-20 left-3 right-3 z-[98] overflow-hidden rounded-lg border border-solid border-gray-200 bg-white shadow-3xl black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-gray-900',
        'sm:left-auto sm:right-5 sm:w-96 rtl:sm:left-5 rtl:sm:right-auto',
        'xl:bottom-5 ltr:xl:right-[27rem] rtl:xl:left-[27rem]',
        isMinimized && 'sm:w-80',
      )}
      data-testid='floating-media-player'
    >
      <div className='flex min-w-0 items-center gap-2 border-b border-solid border-gray-200 px-3 py-2 black:border-gray-800 dark:border-gray-800'>
        <SvgIcon className='size-5 flex-none text-primary-600 dark:text-primary-400' src={playerPlayIcon} />

        <div className='min-w-0 flex-1'>
          <a
            className='block truncate text-sm font-semibold text-gray-900 hover:underline black:text-white dark:text-gray-100'
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
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 black:text-gray-400 black:hover:bg-primary-900/50 black:hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          href={item.url}
          target='_blank'
          rel='noopener'
          title={intl.formatMessage(messages.openOriginal)}
        >
          <SvgIcon className='size-5' src={externalLinkIcon} />
        </a>

        <button
          aria-label={minimizeLabel}
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 black:text-gray-400 black:hover:bg-primary-900/50 black:hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          onClick={toggleMinimized}
          title={minimizeLabel}
          type='button'
        >
          <SvgIcon className='size-5' src={isMinimized ? arrowsMaximizeIcon : minusIcon} />
        </button>

        <button
          aria-label={intl.formatMessage(messages.close)}
          className='inline-flex size-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 black:text-gray-400 black:hover:bg-primary-900/50 black:hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          onClick={close}
          title={intl.formatMessage(messages.close)}
          type='button'
        >
          <SvgIcon className='size-5' src={xIcon} />
        </button>
      </div>

      <div className='bg-primary-50/50 p-3 black:bg-black dark:bg-primary-950/20'>
        {renderMedia(item, isMinimized, intl.formatMessage(messages.mediaFallback), playNext)}
        <div className='mt-2 flex items-center justify-between gap-2'>
          <button className='text-xs font-bold text-primary-700 disabled:opacity-40 black:text-primary-300 dark:text-primary-300' disabled={currentIndex <= 0} onClick={playPrevious} type='button'>{intl.formatMessage(messages.previous)}</button>
          <span className='text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>{intl.formatMessage(messages.position, { current: currentIndex + 1, total: queue.length })}</span>
          <button className='text-xs font-bold text-primary-700 disabled:opacity-40 black:text-primary-300 dark:text-primary-300' disabled={currentIndex >= queue.length - 1} onClick={playNext} type='button'>{intl.formatMessage(messages.next)}</button>
        </div>
        {!isMinimized && queue.length > 1 && (
          <details className='mt-2 border-t border-primary-200 pt-2 black:border-primary-800 dark:border-primary-800'>
            <summary className='cursor-pointer text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{intl.formatMessage(messages.queueSummary, { count: queue.length })}</summary>
            <ol className='mt-2 max-h-48 space-y-1 overflow-y-auto'>
              {queue.map((queuedItem, index) => (
                <li className='flex min-w-0 items-center gap-2' key={`${queuedItem.id}:${queuedItem.mediaUrl}:${index}`}>
                  <button className={clsx('min-w-0 flex-1 truncate text-left text-sm hover:underline', index === currentIndex ? 'font-black text-primary-700 black:text-primary-300 dark:text-primary-300' : 'text-gray-800 black:text-gray-200 dark:text-gray-200')} onClick={() => playAt(index)} type='button'>{queuedItem.title}</button>
                  <button aria-label={intl.formatMessage(messages.removeItem, { title: queuedItem.title })} className='px-1 text-xs font-bold text-danger-600' onClick={() => removeAt(index)} type='button'>{intl.formatMessage(messages.remove)}</button>
                </li>
              ))}
            </ol>
          </details>
        )}
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
    <p className='truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
      {labels.join(' / ')}
    </p>
  );
}

function renderMedia(item: FloatingMediaItem, isMinimized: boolean, fallbackLabel: string, onEnded: () => void) {
  if (item.kind === 'audio') {
    return (
      <audio
        aria-label={item.title}
        autoPlay
        className='h-9 w-full'
        controls
        key={item.mediaUrl}
        onEnded={onEnded}
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
      onEnded={onEnded}
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
