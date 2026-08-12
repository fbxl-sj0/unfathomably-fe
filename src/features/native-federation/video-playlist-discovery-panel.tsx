/*
 * Unfathomably received video playlist discovery panel
 * -----------------------------------------------------
 *
 * File: video-playlist-discovery-panel.tsx
 *
 * Purpose:
 *   Present received PeerTube-compatible playlists as video collections.
 *
 * Responsibilities:
 *   - browse and search public playlists already known locally
 *   - show collection artwork, channel, item count, and description
 *   - hand collection viewing to local resolution or its source
 *
 * This file intentionally does not expand remote collection pages, autoplay
 * media, infer missing members, or display audio playlists.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useVideoPlaylistDiscovery } from '@/api/hooks/discovery/useVideoPlaylistDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface VideoPlaylistDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const VideoPlaylistDiscoveryPanel: React.FC<VideoPlaylistDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [requested, setRequested] = useState(false);
  const visible = enabled && family === 'video';
  const result = useVideoPlaylistDiscovery(submittedQuery, offset, visible && requested);

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
        title={<FormattedMessage id='native_discovery.video_playlist.title' defaultMessage='Video playlists known here' />}
        description={(
          <FormattedMessage
            id='native_discovery.video_playlist.description'
            defaultMessage='Browse public PeerTube playlists this server has already received. Collections remain owned by their video channel and are not expanded by crawling remote pages.'
          />
        )}
        id='native-video-playlist-search'
        label={<FormattedMessage id='native_discovery.video_playlist.search_label' defaultMessage='Search locally known video playlists' />}
        value={query}
        placeholder='Optional playlist title, description, channel, or UUID'
        submitLabel={<FormattedMessage id='native_discovery.video_playlist.search' defaultMessage='Search playlists' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!requested ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.video_playlist.start' defaultMessage='Search by text, or leave the field blank to browse recently received public video playlists.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || result.data.providers.every(provider => provider.status === 'unavailable') ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.video_playlist.error' defaultMessage='Video playlists could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.video_playlist.empty' defaultMessage='No video playlists matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {item.thumbnail_url ? (
                  <Link to={nativeResolvePath('video', item.activitypub_url)} className='block aspect-video overflow-hidden bg-black'>
                    <img src={item.thumbnail_url} alt='' loading='lazy' className='size-full object-cover' />
                  </Link>
                ) : (
                  <div className='flex aspect-video items-center justify-center bg-primary-100 black:bg-primary-900 text-sm font-black uppercase tracking-[0.16em] text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100'>
                    <FormattedMessage id='native_discovery.video_playlist.collection' defaultMessage='Video collection' />
                  </div>
                )}

                <div className='pt-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                      <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.channel?.name || item.source_host}</p>
                    </div>
                    {item.item_count !== undefined && (
                      <span className='shrink-0 rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                        {item.item_count} videos
                      </span>
                    )}
                  </div>

                  {item.description && <p className='mt-3 line-clamp-4 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.description}</p>}
                  <p className='mt-3 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    <FormattedMessage
                      id='native_discovery.video_playlist.channel_position'
                      defaultMessage='Playlist {position} in this channel'
                      values={{ position: item.channel_position }}
                    />
                  </p>
                  {item.known_item_count > 0 && item.item_count !== undefined && item.known_item_count < item.item_count && (
                    <p className='mt-3 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
                      <FormattedMessage
                        id='native_discovery.video_playlist.partial'
                        defaultMessage='{count} item references arrived with this collection; open the source for the complete current ordering.'
                        values={{ count: item.known_item_count }}
                      />
                    </p>
                  )}

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('video', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.video_playlist.open_local' defaultMessage='Open playlist here' />
                    </Link>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.video_playlist.open_source' defaultMessage='Open complete playlist' />
                    </a>
                    {item.channel && (
                      <Link to={nativeResolvePath('video', item.channel.url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.video.open_channel' defaultMessage='Open channel locally' />
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
            onPrevious={() => setOffset(Math.max(0, offset - 16))}
            onNext={() => setOffset(result.data.next_offset || offset + 16)}
          />
        </>
      )}
    </section>
  );
};

export default VideoPlaylistDiscoveryPanel;

/* end of video-playlist-discovery-panel.tsx */
