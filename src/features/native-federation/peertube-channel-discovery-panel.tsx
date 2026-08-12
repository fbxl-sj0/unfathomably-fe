/*
 * Unfathomably PeerTube channel discovery panel
 * ----------------------------------------------
 *
 * File: peertube-channel-discovery-panel.tsx
 *
 * Purpose:
 *   Present PeerTube channels as first-class ActivityPub actors.
 *
 * Responsibilities:
 *   - search channels known through the configured PeerTube bridge
 *   - distinguish channel identity from its owner account and server
 *   - route the channel actor through Unfathomably's local resolver
 *
 * This file intentionally does not subscribe automatically, search arbitrary
 * PeerTube servers, or present whole PeerTube servers as content channels.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoverySearchHeader from '@/features/native-federation/native-discovery-search-header.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { usePeerTubeChannelDiscovery } from '@/api/hooks/discovery/usePeerTubeChannelDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface PeerTubeChannelDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const PeerTubeChannelDiscoveryPanel: React.FC<PeerTubeChannelDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && (family === 'all' || family === 'video');
  const result = usePeerTubeChannelDiscovery(submittedQuery, offset, visible && submittedQuery.length >= 2);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().slice(0, 200);
    if (normalized.length < 2) return;

    setOffset(0);
    setSubmittedQuery(normalized);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.peertube_channels.title' defaultMessage='Find a PeerTube channel' />}
        description={<FormattedMessage id='native_discovery.peertube_channels.description' defaultMessage='Find channels you can follow. Results are channels, not whole servers or owner accounts.' />}
        id='native-peertube-channel-search'
        label={<FormattedMessage id='native_discovery.peertube_channels.search_label' defaultMessage='Search PeerTube channels' />}
        value={query}
        placeholder='Search channel names and descriptions'
        submitLabel={<FormattedMessage id='native_discovery.peertube_channels.search' defaultMessage='Search channels' />}
        disabled={query.trim().length < 2}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!submittedQuery ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.peertube_channels.start' defaultMessage='Enter a topic or channel name. No channel is followed and no unlinked PeerTube server is queried automatically.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(item => item.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.peertube_channels.error' defaultMessage='Channel search is temporarily unavailable. Videos already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.peertube_channels.empty' defaultMessage='No channels from linked PeerTube servers matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {item.banner_url && <img src={item.banner_url} alt='' loading='lazy' className='h-20 w-full bg-black object-cover' />}
                <div className='flex gap-3 pt-4'>
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt='' loading='lazy' className='h-16 w-16 shrink-0 rounded-xl bg-black object-cover' />
                  ) : (
                    <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-100 black:bg-primary-900 text-xl font-black text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                      {item.title.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-lg font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    <p className='truncate text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.handle}</p>
                    {item.owner_name && <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>Owned by {item.owner_name}</p>}
                  </div>
                </div>
                <div className='px-4 pb-4'>
                  {item.summary && <p className='line-clamp-4 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    {item.followers_count > 0 && <span>{item.followers_count} followers</span>}
                    <span>{item.source_host}</span>
                  </div>
                  {item.support && <p className='mt-2 line-clamp-2 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'><span className='font-bold'>Support:</span> {item.support}</p>}
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('video', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.peertube_channels.resolve' defaultMessage='Open and follow locally' />
                    </Link>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.peertube_channels.view' defaultMessage='View at source' />
                    </a>
                    {item.owner_url && item.owner_url !== item.activitypub_url && (
                      <Link to={nativeResolvePath('video', item.owner_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.peertube_channels.owner' defaultMessage='Open owner locally' />
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

export default PeerTubeChannelDiscoveryPanel;

/* end of peertube-channel-discovery-panel.tsx */
