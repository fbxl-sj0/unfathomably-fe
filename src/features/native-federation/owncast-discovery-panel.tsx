/*
 * Unfathomably Owncast discovery panel
 * -------------------------------------
 *
 * File: owncast-discovery-panel.tsx
 *
 * Purpose:
 *   Present opt-in Owncast directory streams as a useful live-video workflow.
 *
 * Responsibilities:
 *   - browse or filter live streams after explicit user action
 *   - display directory-observed live state without autoplay
 *   - protect sensitive thumbnails and expose directory tags
 *   - separate source viewing from deliberate local actor discovery
 *
 * This file intentionally does not embed HLS, join chat, poll stream servers,
 * or guess a stream's federated username.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useOwncastDiscovery } from '@/api/hooks/discovery/useOwncastDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface OwncastDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 24;

const OwncastDiscoveryPanel: React.FC<OwncastDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [requested, setRequested] = useState(false);
  const [loadArtwork, setLoadArtwork] = useState(false);
  const visible = enabled && family === 'video';
  const result = useOwncastDiscovery(submittedQuery, offset, visible && requested);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim().slice(0, 200);

    if (requested && submittedQuery === nextQuery && offset === 0) {
      void result.refetch();
      return;
    }

    setOffset(0);
    setSubmittedQuery(nextQuery);
    setRequested(true);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.owncast.title' defaultMessage='Owncast streams live now' />}
        description={(
          <FormattedMessage
            id='native_discovery.owncast.description'
            defaultMessage='Find live streams. Nothing plays until you press Play.'
          />
        )}
        id='native-owncast-discovery-search'
        label={<FormattedMessage id='native_discovery.owncast.search_label' defaultMessage='Filter live Owncast streams' />}
        value={query}
        maxLength={200}
        placeholder='Optional stream name, host, or category'
        submitLabel={<FormattedMessage id='native_discovery.owncast.browse' defaultMessage='Browse live streams' />}
        secondaryLabel={requested && !loadArtwork && result.data.items.some(item => Boolean(item.thumbnail_url) && !item.sensitive)
          ? <FormattedMessage id='native_discovery.owncast.load_artwork' defaultMessage='Load stream artwork' />
          : undefined}
        onChange={setQuery}
        onSecondary={() => setLoadArtwork(true)}
        onSubmit={submit}
      />

      {!requested ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.owncast.start' defaultMessage="The central directory is contacted only after you choose to browse. Individual stream servers are not contacted until you open or discover one, or explicitly load their artwork through this server's media proxy." />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(provider => provider.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.owncast.error' defaultMessage='Live-stream search is temporarily unavailable. Stream accounts already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.owncast.empty' defaultMessage='No currently live streams matched this filter.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {loadArtwork && item.thumbnail_url && !item.sensitive ? (
                  <img src={item.thumbnail_url} alt='' loading='lazy' className='aspect-[16/9] w-full bg-black object-contain' />
                ) : (
                  <div className='flex aspect-[16/9] items-center justify-center bg-primary-100 black:bg-primary-900 text-sm font-black uppercase tracking-[0.18em] text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                    {item.sensitive ? 'Sensitive stream' : 'Owncast'}
                  </div>
                )}

                <div className='pt-4'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                      <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
                    </div>
                    <span className='shrink-0 rounded-full bg-red-600 px-2 py-1 text-xs font-black uppercase tracking-wide text-white'>
                      <FormattedMessage id='native_discovery.owncast.live' defaultMessage='Listed live' />
                    </span>
                  </div>

                  {item.sensitive && (
                    <p className='mt-2 text-sm font-black text-red-700 dark:text-red-300'>
                      <FormattedMessage id='native_discovery.owncast.sensitive' defaultMessage='The directory marks this stream as sensitive.' />
                    </p>
                  )}

                  {item.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {item.tags.map(tag => (
                        <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <WorldObjectStateControl
                    family='video'
                    objectUri={item.activitypub_url}
                    presentation={{
                      source_host: item.source_host,
                      title: item.title,
                      url: item.url,
                    }}
                  />

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.owncast.watch' defaultMessage='Open stream' />
                    </a>
                    <Link to={nativeResolvePath(family, item.activitypub_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.owncast.resolve' defaultMessage='Discover locally' />
                    </Link>
                  </div>

                  <p className='mt-3 text-xs leading-5 text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    <FormattedMessage id='native_discovery.owncast.state_note' defaultMessage='"Listed live" reflects the most recent directory response. Artwork stays unloaded unless requested. Local discovery contacts only this selected server and does not follow it automatically.' />
                  </p>
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
            onPrevious={() => setOffset(Math.max(0, offset - pageSize))}
            onNext={() => setOffset(result.data.next_offset ?? offset + pageSize)}
          />
        </>
      )}
    </section>
  );
};

export default OwncastDiscoveryPanel;

/* end of owncast-discovery-panel.tsx */
