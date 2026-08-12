/*
 * Unfathomably 3D model discovery panel
 * --------------------------------------
 *
 * File: model-discovery-panel.tsx
 *
 * Purpose:
 *   Turn public Manyfold model search results into a useful Worlds workflow.
 *
 * Responsibilities:
 *   - explain that Manyfold models are followable ActivityPub actors
 *   - display model previews, creators, collections, and tags
 *   - page through the reviewed catalogue without crawling model actors
 *   - separate native source viewing from local actor resolution
 *
 * This file intentionally does not download files, promise printability, or
 * follow a model without an explicit user action.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoverySearchHeader from '@/features/native-federation/native-discovery-search-header.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useModelDiscovery } from '@/api/hooks/discovery/useModelDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ModelDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 18;

const ModelDiscoveryPanel: React.FC<ModelDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && family === 'models';
  const result = useModelDiscovery(submittedQuery, offset, visible);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim().slice(0, 200);
    if (nextQuery.length === 0 || nextQuery.length >= 2) {
      setOffset(0);
      setSubmittedQuery(nextQuery);
    }
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.models.title' defaultMessage='Browse 3D models' />}
        description={(
          <FormattedMessage
            id='native_discovery.models.description'
            defaultMessage='Browse recently shared Manyfold models or narrow the catalogue by model, creator, collection, or tag. Open a model here to follow and discuss it; files remain on its original model page.'
          />
        )}
        id='native-model-discovery-search'
        label={<FormattedMessage id='native_discovery.models.search_label' defaultMessage='Search public 3D models' />}
        value={query}
        placeholder='Search model names, creators, or tags'
        submitLabel={<FormattedMessage id='native_discovery.models.search' defaultMessage='Search models' />}
        disabled={query.trim().length === 1}
        secondaryLabel={submittedQuery
          ? <FormattedMessage id='native_discovery.clear' defaultMessage='Clear' />
          : undefined}
        onChange={setQuery}
        onSecondary={() => {
          setQuery('');
          setSubmittedQuery('');
          setOffset(0);
        }}
        onSubmit={submit}
      />

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(provider => provider.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.models.error' defaultMessage='Model search is temporarily unavailable. Models already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          {submittedQuery ? (
            <FormattedMessage id='native_discovery.models.empty' defaultMessage='No public models matched this search.' />
          ) : (
            <FormattedMessage id='native_discovery.models.empty_browse' defaultMessage='No public models are available from the connected catalogues right now.' />
          )}
        </NativeDiscoveryState>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {result.data.items.map(item => (
            <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt='' loading='lazy' className='aspect-[16/10] w-full bg-black object-contain' />
              ) : (
                <div className='flex aspect-[16/10] w-full items-center justify-center bg-primary-100 black:bg-primary-900 text-sm font-black uppercase tracking-[0.18em] text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                  3D model
                </div>
              )}

              <div className='pt-4'>
                <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.activitypub_handle}</p>

                <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold'>
                  {item.creator && (
                    <Link to={nativeResolvePath(family, item.creator.url)} className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
                      <FormattedMessage id='native_discovery.models.by_creator' defaultMessage='By {creator}' values={{ creator: item.creator.name }} />
                    </Link>
                  )}
                  {item.collection && (
                    <Link to={nativeResolvePath(family, item.collection.url)} className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
                      {item.collection.name}
                    </Link>
                  )}
                </div>

                {item.summary && <p className='mt-2 line-clamp-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

                {item.tags.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                  </div>
                )}

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Link to={nativeResolvePath(family, item.activitypub_handle)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                    <FormattedMessage id='native_discovery.models.resolve' defaultMessage='Open model here' />
                  </Link>
                  <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.models.view' defaultMessage='Open original files' />
                  </a>
                </div>
              </div>
            </NativeDiscoveryArticle>
          ))}
          <NativeDiscoveryPagination
            className='col-span-full border-t border-gray-200 pt-4 black:border-gray-800 dark:border-gray-700'
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            inset
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - pageSize))}
            onNext={() => setOffset(offset + pageSize)}
          />
        </div>
      )}
    </section>
  );
};

export default ModelDiscoveryPanel;

/* end of model-discovery-panel.tsx */
