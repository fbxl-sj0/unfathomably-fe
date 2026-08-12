/*
 * Unfathomably federated audio discovery panel
 * ---------------------------------------------
 *
 * File: audio-discovery-panel.tsx
 *
 * Purpose:
 *   Present remote music catalogs as useful, deliberate track choices.
 *
 * Responsibilities:
 *   - browse and search public federated tracks
 *   - show performer, release, duration, license, tags, and source
 *   - lead into local playback, following, and interaction after resolution
 *
 * This file intentionally does not autoplay remote media or infer rights from
 * a missing license field. Source links remain available for protected audio
 * and capabilities that the publishing Funkwhale server cannot federate.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoverySearchHeader from '@/features/native-federation/native-discovery-search-header.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useAudioDiscovery } from '@/api/hooks/discovery/useAudioDiscovery.ts';

import type { AudioDiscoveryItem } from '@/api/hooks/discovery/useAudioDiscovery.ts';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface AudioDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const durationLabel = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const trackByline = (track: AudioDiscoveryItem): string => {
  const parts = [track.artist, track.album, track.release_date].filter(Boolean);
  return parts.join(' / ') || track.account.name || track.account.handle || 'Artist not provided';
};

const AudioDiscoveryPanel: React.FC<AudioDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const visible = enabled && (family === 'all' || family === 'audio');
  const result = useAudioDiscovery(submittedQuery, offset, visible && hasSubmittedSearch);

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
        title={<FormattedMessage id='native_discovery.audio.title' defaultMessage='Music beyond this server' />}
        description={<FormattedMessage id='native_discovery.audio.description' defaultMessage='Search public tracks from connected independent music catalogs. Open one here to play it, follow its publisher, favourite it, or join its conversation.' />}
        id='native-audio-discovery-search'
        label={<FormattedMessage id='native_discovery.audio.search_label' defaultMessage='Search public tracks' />}
        value={query}
        placeholder='Search tracks, artists, and releases'
        submitLabel={<FormattedMessage id='native_discovery.audio.search' defaultMessage='Search music' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!hasSubmittedSearch ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.audio.prompt' defaultMessage='Submit a music search to contact the configured catalog. Visiting Worlds does not query it automatically.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(item => item.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.audio.error' defaultMessage='Music search is temporarily unavailable. Tracks already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.providers.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.audio.not_configured' defaultMessage='Outside search is not available here yet. Posts already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.audio.empty' defaultMessage='No public tracks matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(track => (
              <NativeDiscoveryArticle item={track} key={track.id} className='flex gap-3 bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {track.image_url ? (
                  <img src={track.image_url} alt='' loading='lazy' className='h-24 w-24 shrink-0 rounded-lg bg-black object-cover' />
                ) : (
                  <div className='flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-primary-100 black:bg-primary-900 text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>Audio</div>
                )}
                <div className='min-w-0 flex-1'>
                  <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{track.title}</h3>
                  <p className='mt-1 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>{trackByline(track)}</p>
                  {(track.account.name || track.account.handle) && (
                    track.account.url ? (
                      <a href={track.account.url} target='_blank' rel='noopener noreferrer' className='mt-1 block truncate text-xs font-bold text-primary-700 black:text-primary-300 hover:text-primary-500 dark:text-primary-300'>
                        {track.account.name || track.account.handle}
                      </a>
                    ) : (
                      <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{track.account.name || track.account.handle}</p>
                    )
                  )}
                  <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{track.source_host}</p>
                  <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                    <span>{durationLabel(track.duration)}</span>
                    {track.licence && <span>{track.licence}</span>}
                  </div>
                  {track.tags.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {track.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                    </div>
                  )}
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('audio', track.url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.audio.resolve' defaultMessage='Play and interact here' />
                    </Link>
                    <a href={track.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.audio.listen' defaultMessage='Open at source' />
                    </a>
                    {track.account.url && (
                      <Link to={nativeResolvePath('audio', track.account.url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.audio.resolve_publisher' defaultMessage='Follow publisher here' />
                      </Link>
                    )}
                  </div>
                </div>
              </NativeDiscoveryArticle>
            ))}
          </div>

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
        </>
      )}
    </section>
  );
};

export default AudioDiscoveryPanel;

/* end of audio-discovery-panel.tsx */
