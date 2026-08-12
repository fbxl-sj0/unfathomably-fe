/*
  Project: Unfathomably FE
  File: music-catalog-discovery-panel.tsx
  Purpose: Present durable music-catalog objects received through federation.

  Responsibilities:
  - browse and search locally known artists, albums, libraries, and playlists
  - explain ownership, catalogue size, release, and MusicBrainz relationships
  - hand protected library access and playback back to the authoritative source

  This file intentionally does not crawl remote collections or bypass a
  Funkwhale library's signed follow and access-control workflow.
*/

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useMusicCatalogDiscovery } from '@/api/hooks/discovery/useMusicCatalogDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';

import type { MusicCatalogDiscoveryItem } from '@/api/hooks/discovery/useMusicCatalogDiscovery.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface MusicCatalogDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 12;

const kindLabel = (kind: MusicCatalogDiscoveryItem['kind']): React.ReactNode => {
  switch (kind) {
    case 'artist':
      return <FormattedMessage id='native_discovery.music_catalog.artist' defaultMessage='Artist' />;
    case 'album':
      return <FormattedMessage id='native_discovery.music_catalog.album' defaultMessage='Album' />;
    case 'library':
      return <FormattedMessage id='native_discovery.music_catalog.library' defaultMessage='Library' />;
    case 'playlist':
      return <FormattedMessage id='native_discovery.music_catalog.playlist' defaultMessage='Playlist' />;
  }
};

const sourceActionLabel = (kind: MusicCatalogDiscoveryItem['kind']): React.ReactNode => {
  if (kind === 'library') {
    return <FormattedMessage id='native_discovery.music_catalog.library_source' defaultMessage='Browse or request access' />;
  }

  if (kind === 'playlist') {
    return <FormattedMessage id='native_discovery.music_catalog.playlist_source' defaultMessage='Open playlist at source' />;
  }

  return <FormattedMessage id='native_discovery.music_catalog.source' defaultMessage='Open at source' />;
};

const MusicCatalogDiscoveryPanel: React.FC<MusicCatalogDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = family === 'all' || family === 'audio';
  const discovery = useMusicCatalogDiscovery(query, offset, enabled && visible);

  if (!visible) return null;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();

    if (nextQuery.length === 1) return;

    setOffset(0);
    setQuery(nextQuery);
  };

  const resetBrowse = () => {
    setDraftQuery('');
    setQuery('');
    setOffset(0);
  };

  return (
    <section className='border-b border-gray-200 bg-white px-4 py-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
      <h2 className='text-lg font-black text-gray-900 black:text-white dark:text-white'>
        <FormattedMessage id='native_discovery.music_catalog.title' defaultMessage='Music catalogues from connected worlds' />
      </h2>
      <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
        <FormattedMessage id='native_discovery.music_catalog.description' defaultMessage='Browse artists, albums, libraries, and playlists already received from Funkwhale-compatible servers, or narrow the local catalogue with a search.' />
      </p>

      <NativeDiscoverySearchForm
        disabled={draftQuery.trim().length === 1}
        id='music-catalog-search'
        label={<FormattedMessage id='native_discovery.music_catalog.search_label' defaultMessage='Search received music catalogues' />}
        value={draftQuery}
        placeholder={intl.formatMessage({
          id: 'native_discovery.music_catalog.placeholder',
          defaultMessage: 'Artist, album, library, playlist, or MusicBrainz ID',
        })}
        secondaryLabel={query
          ? <FormattedMessage id='native_discovery.music_catalog.browse' defaultMessage='Browse latest' />
          : undefined}
        submitLabel={<FormattedMessage id='native_discovery.music_catalog.search' defaultMessage='Search catalogues' />}
        onChange={setDraftQuery}
        onSecondary={resetBrowse}
        onSubmit={submitSearch}
      />

      <p className='mt-3 text-xs leading-5 text-gray-500 black:text-gray-400 dark:text-gray-400'>
        <FormattedMessage id='native_discovery.music_catalog.access_note' defaultMessage='Public libraries may be browsed immediately. Restricted Funkwhale libraries require the source to approve a signed follow before their audio can be retrieved.' />
      </p>

      {discovery.isFetching && discovery.data.items.length === 0 && (
        <div className='mt-4 overflow-hidden'>
          <NativeDiscoveryLoading />
        </div>
      )}

      {discovery.isError && (
        <NativeDiscoveryState className='mt-4' tone='danger' onRetry={() => void discovery.refetch()}>
          <FormattedMessage id='native_discovery.music_catalog.error' defaultMessage='Music libraries and playlists could not be loaded right now.' />
        </NativeDiscoveryState>
      )}

      {!discovery.isFetching && !discovery.isError && discovery.data.items.length === 0 && (
        <NativeDiscoveryState className='mt-4'>
          {query
            ? <FormattedMessage id='native_discovery.music_catalog.empty_search' defaultMessage='No music libraries or playlists matched this search.' />
            : <FormattedMessage id='native_discovery.music_catalog.empty_browse' defaultMessage='No music libraries or playlists have reached your server yet.' />}
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
                  <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-100 black:bg-primary-900 px-2 text-center text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                    {kindLabel(item.kind)}
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{kindLabel(item.kind)}</p>
                  <h3 className='mt-1 line-clamp-2 text-base font-black text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  {item.artist && <p className='mt-1 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.artist}</p>}
                  <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.actor_label || item.source_host}</p>
                </div>
              </div>

              {item.summary && <p className='px-4 pb-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

              {(item.total_items !== null || item.released || item.musicbrainz_id) && (
                <dl className='grid grid-cols-2 gap-x-3 gap-y-2 px-4 pb-3 text-xs'>
                  {item.total_items !== null && (
                    <>
                      <dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.music_catalog.items' defaultMessage='Items' /></dt>
                      <dd className='text-right font-black text-gray-800 black:text-gray-200 dark:text-gray-100'>{item.total_items.toLocaleString()}</dd>
                    </>
                  )}
                  {item.released && (
                    <>
                      <dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.music_catalog.released' defaultMessage='Released' /></dt>
                      <dd className='truncate text-right font-black text-gray-800 black:text-gray-200 dark:text-gray-100'>{item.released}</dd>
                    </>
                  )}
                  {item.musicbrainz_id && (
                    <>
                      <dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>MusicBrainz</dt>
                      <dd className='truncate text-right font-black text-gray-800 black:text-gray-200 dark:text-gray-100'>
                        {item.musicbrainz_url
                          ? <a href={item.musicbrainz_url} target='_blank' rel='noreferrer' className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>{item.musicbrainz_id}</a>
                          : item.musicbrainz_id}
                      </dd>
                    </>
                  )}
                </dl>
              )}

              <div className='flex flex-wrap gap-2 border-t border-gray-200 black:border-gray-800 p-4 dark:border-gray-700'>
                <Link to={nativeResolvePath('audio', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                  <FormattedMessage id='native_discovery.music_catalog.open' defaultMessage='Open locally' />
                </Link>
                {item.artist_url && item.artist_url !== item.activitypub_url && (
                  <Link to={nativeResolvePath('audio', item.artist_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.music_catalog.open_artist' defaultMessage='Open artist locally' />
                  </Link>
                )}
                {item.actor_url && item.actor_url !== item.artist_url && (
                  <Link to={nativeResolvePath('audio', item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.music_catalog.owner' defaultMessage='Open owner locally' />
                  </Link>
                )}
                <a href={item.url} target='_blank' rel='noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-white dark:hover:text-primary-300'>
                  {sourceActionLabel(item.kind)}
                </a>
              </div>
            </NativeDiscoveryArticle>
          ))}
        </div>
      )}

      <NativeDiscoveryPagination
        empty={discovery.data.items.length === 0}
        failed={discovery.isError}
        hasMore={discovery.data.has_more}
        inset
        loading={discovery.isFetching}
        offset={offset}
        onRecover={() => setOffset(0)}
        onPrevious={() => setOffset(Math.max(0, offset - pageSize))}
        onNext={() => setOffset(discovery.data.next_offset ?? offset + pageSize)}
      />
    </section>
  );
};

export default MusicCatalogDiscoveryPanel;

/* end of music-catalog-discovery-panel.tsx */
