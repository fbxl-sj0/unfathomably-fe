/*
 * Unfathomably received model discovery panel
 * --------------------------------------------
 *
 * File: received-model-discovery-panel.tsx
 *
 * Purpose:
 *   Present locally known Manyfold models, creators, and collections.
 *
 * Responsibilities:
 *   - search local f3di actors without contacting remote catalogues
 *   - show previews, descriptions, licence, attribution, tags, and links
 *   - page through known actors without crawling their outboxes or files
 *   - expose model, creator, collection, and source actions explicitly
 *
 * This file intentionally does not load model binaries, promise printability,
 * embed an untrusted 3D viewer, or imply that linked files are federated.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useReceivedModelDiscovery } from '@/api/hooks/discovery/useReceivedModelDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ReceivedModelDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 18;

const kindLabel = (kind: string): string => {
  if (kind === 'model') return '3D model';
  return kind.charAt(0).toUpperCase() + kind.slice(1);
};

const ReceivedModelDiscoveryPanel: React.FC<ReceivedModelDiscoveryPanelProps> = ({ enabled, family }) => {
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && family === 'models';
  const result = useReceivedModelDiscovery(visible, query, offset);

  if (!visible) return null;

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.received_models.title' defaultMessage='Received models and creators' />}
        description={(
          <FormattedMessage
            id='native_discovery.received_models.description'
            defaultMessage='Search models, creators, and collections already shared with this server.'
          />
        )}
        disabled={draftQuery.trim().length === 1}
        id='native-received-model-search'
        label={<FormattedMessage id='native_discovery.received_models.search_label' defaultMessage='Search received models, creators, and collections' />}
        value={draftQuery}
        placeholder='Model, creator, collection, licence, or tag'
        secondaryLabel={query
          ? <FormattedMessage id='native_discovery.clear' defaultMessage='Clear' />
          : undefined}
        submitLabel={<FormattedMessage id='native_discovery.received_models.search' defaultMessage='Search known models' />}
        onChange={setDraftQuery}
        onSecondary={() => {
          setDraftQuery('');
          setQuery('');
          setOffset(0);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const nextQuery = draftQuery.trim().slice(0, 200);
          if (nextQuery.length === 0 || nextQuery.length >= 2) {
            setOffset(0);
            setQuery(nextQuery);
          }
        }}
      />

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.received_models.error' defaultMessage='Models and creators could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          {query ? (
            <FormattedMessage id='native_discovery.received_models.empty_search' defaultMessage='No models, creators, or collections matched this search.' />
          ) : (
            <FormattedMessage id='native_discovery.received_models.empty' defaultMessage='No models or creators have reached your server yet. Find one below, then open it here to follow.' />
          )}
        </NativeDiscoveryState>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {result.data.items.map(item => (
            <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
              {!item.sensitive && item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt='' loading='lazy' className='aspect-[16/10] w-full bg-black object-contain' />
              ) : (
                <div className='flex aspect-[16/10] w-full items-center justify-center bg-primary-100 black:bg-primary-900 text-sm font-black uppercase tracking-[0.18em] text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                  {item.sensitive ? 'Sensitive preview' : kindLabel(item.kind)}
                </div>
              )}

              <div className='pt-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.activitypub_handle || item.source_host}</p>
                  </div>
                  <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>{kindLabel(item.kind)}</span>
                </div>

                {item.summary && <p className='mt-2 line-clamp-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                {item.description && item.description !== item.summary && <p className='mt-2 line-clamp-4 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.description}</p>}
                {item.creator && (
                  <p className='mt-3 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>
                    By <Link className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to={nativeResolvePath('models', item.creator.url)}>{item.creator.name}</Link>
                  </p>
                )}
                {item.collections.length > 0 && (
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    {item.collections.map(collection => (
                      <Link
                        className='rounded-full border border-primary-300 black:border-primary-700 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-900 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-700'
                        key={collection.url}
                        to={nativeResolvePath('models', collection.url)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                )}
                {item.license && (
                  <p className='mt-3 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                    Licence:{' '}
                    {item.license_url ? (
                      <a className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' href={item.license_url} rel='noopener noreferrer' target='_blank'>{item.license}</a>
                    ) : item.license}
                  </p>
                )}
                {item.commercial_license && (
                  <p className='mt-2 rounded-lg bg-primary-50 black:bg-primary-950 p-2 text-xs font-bold text-primary-900 black:text-primary-200 dark:bg-primary-950/50 dark:text-primary-100'>
                    Commercial licence marker. Confirm purchase and reuse terms on the source before downloading.
                  </p>
                )}

                {item.tags.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                  </div>
                )}

                {item.links.length > 0 && (
                  <div className='mt-3'>
                    <p className='text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>Related source links</p>
                    <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold'>
                      {item.links.map(link => <a key={link.url} href={link.url} target='_blank' rel='noopener noreferrer' className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>{link.label}</a>)}
                    </div>
                  </div>
                )}

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Link to={nativeResolvePath('models', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                    <FormattedMessage id='native_discovery.resolve' defaultMessage='Open here' />
                  </Link>
                  <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.received_models.open_source' defaultMessage='Open source and files' />
                  </a>
                  {item.creator_url && <Link to={nativeResolvePath('models', item.creator_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.received_models.open_creator' defaultMessage='Open creator here' />
                  </Link>}
                  {item.collection_urls.map((collectionUrl, index) => (
                    <Link key={collectionUrl} to={nativeResolvePath('models', collectionUrl)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.received_models.open_collection' defaultMessage='Collection {number}' values={{ number: index + 1 }} />
                    </Link>
                  ))}
                </div>
              </div>
            </NativeDiscoveryArticle>
          ))}
          <NativeDiscoveryPagination
            className='col-span-full border-t border-gray-200 pt-4 black:border-gray-800 dark:border-gray-700'
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.items.length === pageSize}
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

export default ReceivedModelDiscoveryPanel;

/* end of received-model-discovery-panel.tsx */
