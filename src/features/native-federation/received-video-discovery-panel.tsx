/*
 * Unfathomably received video discovery panel
 * --------------------------------------------
 *
 * File: received-video-discovery-panel.tsx
 *
 * Purpose:
 *   Present locally received PeerTube-compatible videos as useful video cards.
 *
 * Responsibilities:
 *   - browse and search public Video objects already known locally
 *   - show thumbnails, duration, channel, publication, and interaction policy
 *   - hand video interactions to the normal local object resolver
 *
 * This file intentionally does not autoplay or embed remote video, fetch
 * media files, crawl PeerTube, or describe a live-broadcast object as live now.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useReceivedVideoDiscovery } from '@/api/hooks/discovery/useReceivedVideoDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ReceivedVideoDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const formatDuration = (seconds?: number): string | null => {
  if (seconds === undefined) return null;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
    : `${minutes}:${String(remaining).padStart(2, '0')}`;
};

const formatFutureSchedule = (value?: string): string | null => {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp) || timestamp <= Date.now()) return null;

  return new Date(timestamp).toLocaleString();
};

const ReceivedVideoDiscoveryPanel: React.FC<ReceivedVideoDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [requested, setRequested] = useState(false);
  const visible = enabled && family === 'video';
  const result = useReceivedVideoDiscovery(submittedQuery, offset, visible && requested);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSubmittedQuery(query.trim().slice(0, 200));
    setRequested(true);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.video.received_title' defaultMessage='Videos known here' />}
        description={(
          <FormattedMessage
            id='native_discovery.video.received_description'
            defaultMessage='Browse public PeerTube-compatible videos already received by this server. Thumbnails use the media proxy, sensitive previews stay hidden, and opening locally restores normal comments and reactions.'
          />
        )}
        id='native-received-video-search'
        label={<FormattedMessage id='native_discovery.video.local_search_label' defaultMessage='Search locally known videos' />}
        value={query}
        placeholder='Optional title, description, channel, tag, or language'
        submitLabel={<FormattedMessage id='native_discovery.video.local_search' defaultMessage='Search local videos' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!requested ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.video.start' defaultMessage='Search by text, or leave the field blank to browse recently received public videos.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || result.data.providers.every(provider => provider.status === 'unavailable') ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.video.error' defaultMessage='Videos could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<a href='#native-federation-target-search' className='mt-4 inline-flex rounded-lg border border-primary-500 px-3 py-2 font-black text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30'>
            <FormattedMessage id='native_discovery.video.open_link' defaultMessage='Open a channel or video link' />
          </a>}
        >
          <FormattedMessage id='native_discovery.video.empty' defaultMessage='No videos matched this search. Open a channel or video link below to bring it into this feed.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => {
              const duration = formatDuration(item.duration_seconds);
              const scheduledAt = formatFutureSchedule(item.scheduled_at);

              return (
                <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                  {item.thumbnail_url ? (
                    <Link to={nativeResolvePath('video', item.activitypub_url)} className='relative block aspect-video overflow-hidden bg-black'>
                      <img src={item.thumbnail_url} alt='' loading='lazy' className='size-full object-cover' />
                      {duration && <span className='absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-black text-white'>{duration}</span>}
                    </Link>
                  ) : (
                    <div className='flex aspect-video items-center justify-center bg-primary-100 black:bg-primary-900 px-6 text-center text-sm font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                      {item.sensitive
                        ? <FormattedMessage id='native_discovery.video.sensitive' defaultMessage='Sensitive preview hidden. Open locally to review the content warning.' />
                        : <FormattedMessage id='native_discovery.video.no_preview' defaultMessage='Video thumbnail unavailable' />}
                    </div>
                  )}

                  <div className='pt-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                        <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.channel?.name || item.source_host}</p>
                      </div>
                      {item.is_live_broadcast && <span className='shrink-0 rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>Live format</span>}
                    </div>

                    {item.content_warning && <p className='mt-3 rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-bold text-gray-800 black:text-gray-200 dark:border-gray-600 dark:text-gray-100'>{item.content_warning}</p>}
                    {item.description && <p className='mt-3 line-clamp-4 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.description}</p>}

                    <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      {item.category && <span>{item.category}</span>}
                      {item.language && <span>{item.language}</span>}
                      {item.licence && <span>{item.licence}</span>}
                      {item.views !== undefined && <span>{item.views.toLocaleString()} views</span>}
                      {scheduledAt && <span>Scheduled {scheduledAt}</span>}
                    </div>

                    {(item.wait_transcoding || item.comments_enabled === false || item.download_enabled === false || !item.embed_url) && (
                      <div className='mt-3 flex flex-wrap gap-1.5' aria-label='Video availability and interaction controls'>
                        {item.wait_transcoding && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Processing</span>}
                        {item.comments_enabled === false && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Comments disabled</span>}
                        {item.download_enabled === false && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Downloads disabled</span>}
                        {!item.embed_url && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Embedding restricted</span>}
                      </div>
                    )}

                    {item.tags.length > 0 && (
                      <div className='mt-3 flex flex-wrap gap-1.5'>
                        {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                      </div>
                    )}

                    <div className='mt-4 flex flex-wrap gap-2'>
                      <Link to={nativeResolvePath('video', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                        <FormattedMessage id='native_discovery.video.open_local' defaultMessage='Open and interact here' />
                      </Link>
                      <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.video.open_source' defaultMessage='Open original' />
                      </a>
                      {item.channel && (
                        <Link to={nativeResolvePath('video', item.channel.url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                          <FormattedMessage id='native_discovery.video.open_channel' defaultMessage='Open channel locally' />
                        </Link>
                      )}
                      {item.channel?.owner_url && item.channel.owner_url !== item.channel.url && (
                        <Link to={nativeResolvePath('video', item.channel.owner_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                          <FormattedMessage id='native_discovery.video.open_owner' defaultMessage='Open owner locally' />
                        </Link>
                      )}
                    </div>
                  </div>
                </NativeDiscoveryArticle>
              );
            })}
          </div>

          <NativeDiscoveryPagination
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - 16))}
            onNext={() => setOffset(result.data.next_offset || offset + 16)}
          />
        </>
      )}
    </section>
  );
};

export default ReceivedVideoDiscoveryPanel;

/* end of received-video-discovery-panel.tsx */
