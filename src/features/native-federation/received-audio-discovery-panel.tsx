/*
  Project: Unfathomably FE
  File: received-audio-discovery-panel.tsx
  Purpose: Present searchable audio already received through federation.

  Responsibilities:
  - provide an explicit local-cache search for Audio objects
  - explain artist, album, licence, tags, and publishing source
  - connect audio, catalog, library, and publisher references to the local resolver
  - send explicitly selected public audio to the route-persistent player

  This file intentionally does not autoplay or prefetch remote audio.
*/

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useReceivedAudioDiscovery, type ReceivedAudioDiscoveryItem } from '@/api/hooks/discovery/useReceivedAudioDiscovery.ts';
import { useFloatingMediaPlayer, type FloatingMediaItem } from '@/contexts/floating-media-player-context.tsx';

import { nativeResolvePath } from './native-resolve-path.ts';

import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ReceivedAudioDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 12;

const ReceivedAudioQueueButtons: React.FC<{ item: ReceivedAudioDiscoveryItem }> = ({ item }) => {
  const { appendItem, enqueueNext, playItem } = useFloatingMediaPlayer();

  if (!item.media_url) return null;

  const playerItem: FloatingMediaItem = {
    id: item.id,
    kind: 'audio',
    mediaType: item.media_type,
    mediaUrl: item.media_url,
    platformLabel: item.platform_hint === 'funkwhale' ? 'Funkwhale' : 'Independent audio',
    sourceKindLabel: 'Received audio',
    thumbnailUrl: item.image_url,
    title: item.title,
    url: item.url,
  };

  return (
    <>
      <button type='button' onClick={() => playItem(playerItem)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
        <FormattedMessage id='native_discovery.received_audio.play' defaultMessage='Play' />
      </button>
      <button type='button' onClick={() => enqueueNext(playerItem)} className='rounded-lg border border-primary-300 black:border-primary-700 px-3 py-2 text-sm font-black text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-950 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-800'>
        <FormattedMessage id='native_discovery.received_audio.play_next' defaultMessage='Play next' />
      </button>
      <button type='button' onClick={() => appendItem(playerItem)} className='rounded-lg border border-primary-300 black:border-primary-700 px-3 py-2 text-sm font-black text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-950 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-800'>
        <FormattedMessage id='native_discovery.received_audio.queue' defaultMessage='Add to queue' />
      </button>
    </>
  );
};

const ReceivedAudioDiscoveryPanel: React.FC<ReceivedAudioDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = family === 'all' || family === 'audio';
  const discovery = useReceivedAudioDiscovery(query, offset, enabled && visible);

  if (!visible) return null;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();

    if (nextQuery.length < 2) return;

    setOffset(0);
    setQuery(nextQuery);
  };

  return (
    <section className='border-b border-gray-200 bg-white px-4 py-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
      <h2 className='text-lg font-black text-gray-900 black:text-white dark:text-white'>
        <FormattedMessage id='native_discovery.received_audio.title' defaultMessage='Audio received from connected worlds' />
      </h2>
      <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
        <FormattedMessage id='native_discovery.received_audio.description' defaultMessage='Search public tracks and audio already delivered to this server by Funkwhale and other compatible publishers. This search stays entirely local and never autoplays media.' />
      </p>

      <NativeDiscoverySearchForm
        disabled={draftQuery.trim().length < 2}
        id='received-audio-search'
        label={<FormattedMessage id='native_discovery.received_audio.search_label' defaultMessage='Search received audio' />}
        value={draftQuery}
        placeholder={intl.formatMessage({
          id: 'native_discovery.received_audio.placeholder',
          defaultMessage: 'Track, artist, album, tag, or phrase',
        })}
        submitLabel={<FormattedMessage id='native_discovery.received_audio.search' defaultMessage='Search received audio' />}
        onChange={setDraftQuery}
        onSubmit={submitSearch}
      />

      {query.length < 2 && (
        <NativeDiscoveryState className='mt-4'>
          <FormattedMessage id='native_discovery.received_audio.start' defaultMessage='Enter a track, artist, album, tag, or phrase. No remote catalog is contacted.' />
        </NativeDiscoveryState>
      )}

      {discovery.isFetching && discovery.data.items.length === 0 && (
        <div className='mt-4 overflow-hidden'>
          <NativeDiscoveryLoading />
        </div>
      )}

      {discovery.isError && (
        <NativeDiscoveryState className='mt-4' tone='danger' onRetry={() => void discovery.refetch()}>
          <FormattedMessage id='native_discovery.received_audio.error' defaultMessage='Audio could not be searched right now.' />
        </NativeDiscoveryState>
      )}

      {!discovery.isFetching && query.length >= 2 && !discovery.isError && discovery.data.items.length === 0 && (
        <NativeDiscoveryState className='mt-4'>
          <FormattedMessage id='native_discovery.received_audio.empty' defaultMessage='No tracks or audio posts matched this search.' />
        </NativeDiscoveryState>
      )}

      {discovery.data.items.length > 0 && (
        <div className='mt-4 divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {discovery.data.items.map((item) => (
            <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
              <div className='flex gap-3 pt-4'>
                {item.image_url ? (
                  <img src={item.image_url} alt='' loading='lazy' className='h-20 w-20 shrink-0 rounded-lg bg-black object-cover' />
                ) : (
                  <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-100 black:bg-primary-900 text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>Audio</div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>
                    {item.platform_hint === 'funkwhale' ? 'Funkwhale' : 'Independent audio'}
                  </p>
                  <h3 className='mt-1 line-clamp-2 text-base font-black text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  {(item.artist || item.album) && (
                    <p className='mt-1 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>
                      {item.artist && item.artist_url ? <Link to={nativeResolvePath('audio', item.artist_url)}>{item.artist}</Link> : item.artist}
                      {item.artist && item.album ? ' / ' : null}
                      {item.album && item.album_url ? <Link to={nativeResolvePath('audio', item.album_url)}>{item.album}</Link> : item.album}
                    </p>
                  )}
                  <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.actor_label || item.source_host}</p>
                </div>
              </div>

              {item.summary && <p className='px-4 pb-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

              {(item.duration || item.licence || item.tags.length > 0) && (
                <div className='flex flex-wrap gap-2 px-4 pb-3 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                  {item.duration && <span>{item.duration}</span>}
                  {item.licence && <span>{item.licence}</span>}
                  {item.tags.map((tag) => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                </div>
              )}

              <div className='px-4 pb-3'>
                <WorldObjectStateControl
                  family='audio'
                  objectUri={item.activitypub_url}
                  presentation={{
                    source_host: item.source_host,
                    title: item.title,
                    url: item.url,
                  }}
                />
              </div>

              <div className='flex flex-wrap gap-2 border-t border-gray-200 black:border-gray-800 p-4 dark:border-gray-700'>
                <ReceivedAudioQueueButtons item={item} />
                <Link to={nativeResolvePath('audio', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                  <FormattedMessage id='native_discovery.received_audio.open' defaultMessage='Open locally' />
                </Link>
                <a href={item.url} target='_blank' rel='noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                  <FormattedMessage id='native_discovery.received_audio.source' defaultMessage='Open at source' />
                </a>
                {item.actor_url && (
                  <Link to={nativeResolvePath('audio', item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.received_audio.publisher' defaultMessage='Open publisher locally' />
                  </Link>
                )}
                {item.track_url && (
                  <Link to={nativeResolvePath('audio', item.track_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.received_audio.track' defaultMessage='Track record' />
                  </Link>
                )}
                {item.library_url && (
                  <Link to={nativeResolvePath('audio', item.library_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.received_audio.library' defaultMessage='Library' />
                  </Link>
                )}
              </div>
            </NativeDiscoveryArticle>
          ))}
        </div>
      )}

      {query.length >= 2 && (
        <NativeDiscoveryPagination
          empty={discovery.data.items.length === 0}
          failed={discovery.isError}
          hasMore={discovery.data.items.length === pageSize}
          inset
          loading={discovery.isFetching}
          offset={offset}
          onRecover={() => setOffset(0)}
          onPrevious={() => setOffset(Math.max(0, offset - pageSize))}
          onNext={() => setOffset(offset + pageSize)}
        />
      )}
    </section>
  );
};

export default ReceivedAudioDiscoveryPanel;

/* end of received-audio-discovery-panel.tsx */
