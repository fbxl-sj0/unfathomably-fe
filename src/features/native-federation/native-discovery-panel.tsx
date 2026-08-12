/*
 * Unfathomably Worlds discovery panel
 * ------------------------------------
 *
 * File: native-discovery-panel.tsx
 *
 * Purpose:
 *   Turn approved ecosystem indexes into useful, understandable Worlds
 *   browsing and search results.
 *
 * Responsibilities:
 *   - search approved video directories only after an explicit user action
 *   - show the originating channel, preview, and media details
 *   - distinguish PeerTube ActivityPub videos from Owncast live services
 *
 * This file intentionally does not auto-play media, follow channels, or make
 * direct API requests to remote video servers. Owncast stream pages are kept
 * source-native when they do not expose an ActivityPub object.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoverySearchHeader from '@/features/native-federation/native-discovery-search-header.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useNativeDiscovery } from '@/api/hooks/discovery/useNativeDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface NativeDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const NativeDiscoveryPanel: React.FC<NativeDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const visible = enabled && (family === 'all' || family === 'video');
  const result = useNativeDiscovery(submittedQuery, offset, visible && hasSubmittedSearch, 'search');

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setHasSubmittedSearch(true);
    setSubmittedQuery(query.trim());
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.video.title' defaultMessage='Find videos and live streams' />}
        description={(
          <FormattedMessage
            id='native_discovery.video.description'
            defaultMessage='Search public videos and opted-in live streams by title, description, or channel. Nothing is requested from an outside discovery source until you submit a search.'
          />
        )}
        id='native-video-discovery-search'
        label={<FormattedMessage id='native_discovery.video.connected_search_label' defaultMessage='Search connected videos' />}
        value={query}
        placeholder='Search titles, descriptions, and channels'
        submitLabel={<FormattedMessage id='native_discovery.video.connected_search' defaultMessage='Search videos' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!hasSubmittedSearch ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.video.prompt' defaultMessage='Enter a title, subject, or channel. Visiting this page does not fetch an outside video directory automatically.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.error' defaultMessage='Video search is temporarily unavailable. Videos already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.providers.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.video.not_configured' defaultMessage='Outside search is not available here yet. Posts already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.empty' defaultMessage='No public videos matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          {result.data.items.length > 0 && (
            <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
              {result.data.items.map(item => {
                const duration = formatDuration(item.duration);
                const isLiveService = item.kind === 'live_stream';
                const channelLabel = item.channel.name || item.channel.handle || item.source_host;

                return (
                  <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                    {item.thumbnail_url && (
                      <a href={item.url} target='_blank' rel='noopener noreferrer' className='relative block aspect-video overflow-hidden bg-black'>
                        <img src={item.thumbnail_url} alt='' loading='lazy' className='size-full object-cover' />
                        {(duration || item.live) && (
                          <span className='absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-xs font-black text-white'>
                            {item.live ? <FormattedMessage id='native_discovery.video.live' defaultMessage='LIVE' /> : duration}
                          </span>
                        )}
                      </a>
                    )}
                    <div className='pt-4'>
                      <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                      {item.channel.url ? (
                        <Link to={nativeResolvePath('video', item.channel.url)} className='mt-1 block truncate text-sm font-bold text-primary-700 black:text-primary-300 hover:text-primary-500 dark:text-primary-300'>
                          {channelLabel}
                        </Link>
                      ) : (
                        <p className='mt-1 truncate text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{channelLabel}</p>
                      )}
                      <p className='truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
                      {item.summary && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                      <div className='mt-4 flex flex-wrap gap-2'>
                        <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                          {isLiveService ? (
                            <FormattedMessage id='native_discovery.video.watch_live_source' defaultMessage='Watch live source' />
                          ) : (
                            <FormattedMessage id='native_discovery.video.watch_source' defaultMessage='Watch on source' />
                          )}
                        </a>
                        {!isLiveService && (
                          <Link to={nativeResolvePath('video', item.url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                            <FormattedMessage id='native_discovery.video.open_here' defaultMessage='Open video here' />
                          </Link>
                        )}
                      </div>
                    </div>
                  </NativeDiscoveryArticle>
                );
              })}
            </div>
          )}

          {result.data.items.length > 0 && (
            <NativeDiscoveryPagination
              empty={result.data.items.length === 0}
              failed={result.isError}
              hasMore={result.data.has_more}
              loading={result.isFetching}
              offset={offset}
              onRecover={() => setOffset(0)}
              onPrevious={() => setOffset(Math.max(0, offset - 12))}
              onNext={() => setOffset(result.data.next_offset || offset + 12)}
            />
          )}
        </>
      )}
    </section>
  );
};

export default NativeDiscoveryPanel;

/* end of native-discovery-panel.tsx */
