/*
 * Unfathomably public photograph discovery panel
 * -----------------------------------------------
 *
 * File: photo-discovery-panel.tsx
 *
 * Purpose:
 *   Make received Pixelfed-compatible photographs useful in Worlds.
 *
 * Responsibilities:
 *   - browse recent or search indexed public photographic objects
 *   - present captions, descriptions, places, tags, licences, and publishers
 *   - hand accepted objects to the normal local status interaction workflow
 *
 * This file intentionally does not crawl Pixelfed servers, render sensitive
 * thumbnails, or imply that a local cache contains the whole photo network.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { usePhotoDiscovery } from '@/api/hooks/discovery/usePhotoDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface PhotoDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const PhotoInteractionNotice: React.FC<{
  allowed: { announce: boolean; like: boolean; reply: boolean };
  declared: { announce: boolean; like: boolean; reply: boolean };
}> = ({ allowed, declared }) => {
  const hasDeclaration = declared.announce || declared.like || declared.reply;

  if (!hasDeclaration) {
    return (
      <div className='mt-3 flex flex-wrap gap-1.5' aria-label='Remote interaction information'>
        <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>
          <FormattedMessage id='native_discovery.photo.interactions_unknown' defaultMessage='Interaction support checked when opened' />
        </span>
      </div>
    );
  }

  if ((!declared.reply || allowed.reply) && (!declared.like || allowed.like) && (!declared.announce || allowed.announce)) return null;

  return (
    <div className='mt-3 flex flex-wrap gap-1.5' aria-label='Creator interaction controls'>
      {declared.reply && !allowed.reply && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Replies disabled</span>}
      {declared.like && !allowed.like && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Likes disabled</span>}
      {declared.announce && !allowed.announce && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Sharing disabled</span>}
    </div>
  );
};

const PhotoGallery: React.FC<{
  activitypubUrl: string;
  altText?: string;
  count: number;
  images: Array<{ alt_text?: string; preview_url: string }>;
}> = ({ activitypubUrl, altText, count, images }) => {
  const visibleImages = images.slice(0, 4);

  return (
    <Link
      to={nativeResolvePath('photo', activitypubUrl)}
      className={`grid aspect-[4/3] overflow-hidden bg-black ${visibleImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
    >
      {visibleImages.map((image, index) => (
        <span key={image.preview_url} className='relative min-h-0 overflow-hidden'>
          <img
            src={image.preview_url}
            alt={image.alt_text || (index === 0 ? altText || '' : '')}
            loading='lazy'
            className='size-full object-cover'
          />
          {index === 3 && count > 4 && (
            <span className='absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-black text-white' aria-label={`${count - 4} more images`}>
              +{count - 4}
            </span>
          )}
        </span>
      ))}
    </Link>
  );
};

const PhotoDiscoveryPanel: React.FC<PhotoDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [requested, setRequested] = useState(false);
  const visible = enabled && family === 'photo';
  const result = usePhotoDiscovery(submittedQuery, offset, visible && requested);

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
        title={<FormattedMessage id='native_discovery.photo.title' defaultMessage='Photography known here' />}
        description={(
          <FormattedMessage
            id='native_discovery.photo.description'
            defaultMessage='Browse or search public Pixelfed-compatible photographs this server has already received. Previews use the media proxy, sensitive thumbnails stay hidden, and no outside photo server is crawled.'
          />
        )}
        id='native-photo-discovery-search'
        label={<FormattedMessage id='native_discovery.photo.search_label' defaultMessage='Search known public photographs' />}
        value={query}
        maxLength={200}
        placeholder='Optional caption, tag, place, or photographer'
        submitLabel={<FormattedMessage id='native_discovery.photo.search' defaultMessage='Search local photographs' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!requested ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.photo.start' defaultMessage='Search by text, or leave the field blank to browse recently received public photographs.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || result.data.providers.every(provider => provider.status === 'unavailable') ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.photo.error' defaultMessage='Photographs could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<a href='#native-federation-target-search' className='mt-4 inline-flex rounded-lg border border-primary-500 px-3 py-2 font-black text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30'>
            <FormattedMessage id='native_discovery.photo.resolve_exact' defaultMessage='Open a photographer or photograph link' />
          </a>}
        >
          <FormattedMessage id='native_discovery.photo.empty' defaultMessage='No photographs matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {item.images.length > 0 ? (
                  <PhotoGallery activitypubUrl={item.activitypub_url} altText={item.alt_text} count={item.image_count} images={item.images} />
                ) : item.preview_url ? (
                  <PhotoGallery
                    activitypubUrl={item.activitypub_url}
                    altText={item.alt_text}
                    count={item.image_count}
                    images={[{ preview_url: item.preview_url, alt_text: item.alt_text }]}
                  />
                ) : (
                  <div className='flex aspect-[4/3] items-center justify-center bg-primary-100 black:bg-primary-900 px-6 text-center text-sm font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                    {item.sensitive
                      ? <FormattedMessage id='native_discovery.photo.sensitive' defaultMessage='Sensitive preview hidden. Open locally to review the content warning.' />
                      : <FormattedMessage id='native_discovery.photo.no_preview' defaultMessage='Photograph preview unavailable' />}
                  </div>
                )}

                <div className='pt-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                      <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.actor_label || item.source_host}</p>
                    </div>
                    {item.image_count > 1 && <span className='shrink-0 rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>{item.image_count} images</span>}
                  </div>

                  {item.summary && <p className='mt-3 line-clamp-4 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  {item.alt_text && <p className='mt-2 line-clamp-3 text-xs leading-5 text-gray-500 black:text-gray-400 dark:text-gray-400'><strong>Image description:</strong> {item.alt_text}</p>}

                  <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                    {item.location && <span>{item.location}</span>}
                    {item.licence && <span>{item.licence}</span>}
                  </div>

                  <PhotoInteractionNotice
                    allowed={item.capabilities}
                    declared={item.capabilities_declared}
                  />

                  {item.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                    </div>
                  )}

                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('photo', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.photo.open_local' defaultMessage='Open and interact here' />
                    </Link>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.photo.open_source' defaultMessage='Open original' />
                    </a>
                    {item.actor_url && item.actor_url !== item.url && (
                      <Link to={nativeResolvePath('photo', item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.photo.open_photographer' defaultMessage='Open photographer locally' />
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

export default PhotoDiscoveryPanel;

/* end of photo-discovery-panel.tsx */
