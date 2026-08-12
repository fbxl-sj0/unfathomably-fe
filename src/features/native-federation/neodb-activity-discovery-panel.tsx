/*
  Project: Unfathomably FE
  File: neodb-activity-discovery-panel.tsx
  Purpose: Present received NeoDB ratings, reviews, and collection activity.

  Responsibilities:
  - provide a focused search over locally cached cultural activity
  - explain ratings and collection states in ordinary user language
  - connect objects, catalog items, and reviewers to the local resolver

  This file intentionally does not search or crawl remote NeoDB instances.
*/

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useNeoDBActivityDiscovery } from '@/api/hooks/discovery/useNeoDBActivityDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';

import type { NeoDBActivityDiscoveryItem } from '@/api/hooks/discovery/useNeoDBActivityDiscovery.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface NeoDBActivityDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const pageSize = 12;

const externalResourceLabel = (value: string, index: number): string => {
  try {
    return new URL(value).hostname;
  } catch {
    return `External catalog ${index + 1}`;
  }
};

const relationshipLabel = (item: NeoDBActivityDiscoveryItem): string => {
  if (item.kind === 'neodb_collection') {
    return item.collection_kind === 'shelf' ? 'Shelf' : 'Collection';
  }

  if (item.related_types.includes('Review')) return 'Review';
  if (item.related_types.includes('Rating')) return 'Rating';
  if (item.related_types.includes('Status')) return 'Collection state';
  if (item.related_types.includes('Comment')) return 'Comment';
  return 'Cultural activity';
};

const collectionStateLabel = (value: string | null): string | null => {
  switch (value?.trim().toLowerCase().replaceAll('_', '-')) {
    case 'wishlist': return 'Want to try';
    case 'progress':
    case 'in-progress': return 'In progress';
    case 'complete':
    case 'completed': return 'Finished';
    case 'dropped': return 'Dropped';
    default: return value;
  }
};

const cultureCategory = (catalogType: string | null): string => {
  switch (catalogType) {
    case 'Movie': return 'film';
    case 'Series':
    case 'TVEpisode':
    case 'TVSeason':
    case 'TVShow': return 'series';
    case 'Album': return 'album';
    case 'Podcast':
    case 'PodcastEpisode': return 'podcast';
    case 'Performance':
    case 'PerformanceProduction': return 'performance';
    case 'Game': return 'game';
    default: return 'other';
  }
};

const cultureActivityPath = (item: NeoDBActivityDiscoveryItem): string => {
  const params = new URLSearchParams({
    category: cultureCategory(item.catalog_type),
    reference: item.catalog_url || '',
    template: 'culture',
    title: item.catalog_name || item.title,
    view: 'create',
  });

  return `/worlds/culture?${params.toString()}#worlds-create`;
};

const NeoDBActivityDiscoveryPanel: React.FC<NeoDBActivityDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = family === 'all' || family === 'culture';
  const discovery = useNeoDBActivityDiscovery(query, offset, enabled && visible);

  if (!visible) return null;

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();

    if (nextQuery.length === 1) return;

    setOffset(0);
    setQuery(nextQuery);
  };

  return (
    <section className='border-b border-gray-200 bg-white px-4 py-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
      <div>
        <h2 className='text-lg font-black text-gray-900 black:text-white dark:text-white'>
          <FormattedMessage id='native_discovery.neodb.title' defaultMessage='Ratings and reviews from connected culture communities' />
        </h2>
        <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage id='native_discovery.neodb.description' defaultMessage='Browse or search public ratings, reviews, collection states, shelves, and curated collections already received from NeoDB communities. No remote server is contacted.' />
        </p>
      </div>

      <NativeDiscoverySearchForm
        disabled={draftQuery.trim().length === 1}
        id='neodb-activity-search'
        label={<FormattedMessage id='native_discovery.neodb.search_label' defaultMessage='Search received cultural activity' />}
        value={draftQuery}
        placeholder={intl.formatMessage({
          id: 'native_discovery.neodb.placeholder',
          defaultMessage: 'Title, reviewer, rating, or phrase',
        })}
        submitLabel={<FormattedMessage id='native_discovery.neodb.search' defaultMessage='Search cultural activity' />}
        onChange={setDraftQuery}
        onSubmit={submitSearch}
      />

      {discovery.isFetching && discovery.data.items.length === 0 && (
        <div className='mt-4 overflow-hidden'>
          <NativeDiscoveryLoading />
        </div>
      )}

      {discovery.isError && (
        <NativeDiscoveryState className='mt-4' tone='danger' onRetry={() => void discovery.refetch()}>
          <FormattedMessage id='native_discovery.neodb.error' defaultMessage='Ratings and reviews could not be searched right now.' />
        </NativeDiscoveryState>
      )}

      {!discovery.isFetching && !discovery.isError && discovery.data.items.length === 0 && (
        <NativeDiscoveryState className='mt-4'>
          <FormattedMessage id='native_discovery.neodb.empty' defaultMessage='No ratings, reviews, or collections matched this view.' />
        </NativeDiscoveryState>
      )}

      {discovery.data.items.length > 0 && (
        <div className='mt-4 divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {discovery.data.items.map((item) => (
            <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
              {item.catalog_cover_url && (
                <img
                  alt=''
                  className='mb-4 aspect-[3/2] max-h-64 w-full rounded-lg bg-gray-100 black:bg-primary-900 object-contain dark:bg-primary-800'
                  loading='lazy'
                  src={item.catalog_cover_url}
                />
              )}
              <div className='flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>
                <span>{relationshipLabel(item)}</span>
                <span aria-hidden='true'>/</span>
                <span>{item.catalog_category || item.catalog_type || item.collection_kind}</span>
                {item.catalog_date && (
                  <>
                    <span aria-hidden='true'>/</span>
                    <span>{item.catalog_date}</span>
                  </>
                )}
                {item.source_host && (
                  <>
                    <span aria-hidden='true'>/</span>
                    <span>{item.source_host}</span>
                  </>
                )}
              </div>

              <h3 className='mt-2 text-base font-black text-gray-900 black:text-white dark:text-white'>
                {item.catalog_name || item.title}
              </h3>
              {item.actor_label && (
                <p className='mt-1 text-sm font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                  By{' '}
                  {item.actor_url ? (
                    <Link className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to={nativeResolvePath('culture', item.actor_url)}>{item.actor_label}</Link>
                  ) : item.actor_label}
                </p>
              )}

              <div className='mt-2 flex flex-wrap gap-2'>
                {item.rating !== null && (
                  <span className='rounded-full bg-primary-100 black:bg-primary-900 px-3 py-1 text-sm font-black text-primary-900 black:text-primary-200 dark:bg-primary-900/40 dark:text-primary-100'>
                    <FormattedMessage
                      id='native_discovery.neodb.rating'
                      defaultMessage='{rating} out of {best}'
                      values={{ rating: item.rating, best: item.rating_best || 10 }}
                    />
                  </span>
                )}
                {item.catalog_average_rating !== null && (
                  <span className='rounded-full bg-gray-100 black:bg-primary-900 px-3 py-1 text-sm font-bold text-gray-800 black:text-gray-200 dark:bg-primary-800 dark:text-gray-200'>
                    Community average {item.catalog_average_rating}/10
                    {item.catalog_rating_count !== null ? ` from ${item.catalog_rating_count} ratings` : ''}
                  </span>
                )}
                {(item.status || item.shelf_type) && (
                  <span className='rounded-full bg-gray-100 black:bg-primary-900 px-3 py-1 text-sm font-bold text-gray-800 black:text-gray-200 dark:bg-primary-800 dark:text-gray-200'>
                    <FormattedMessage id='native_discovery.neodb.state' defaultMessage='{state}' values={{ state: collectionStateLabel(item.status || item.shelf_type) }} />
                  </span>
                )}
                {item.total_items !== null && (
                  <span className='rounded-full bg-gray-100 black:bg-primary-900 px-3 py-1 text-sm font-bold text-gray-800 black:text-gray-200 dark:bg-primary-800 dark:text-gray-200'>
                    <FormattedMessage id='native_discovery.neodb.items' defaultMessage='{count, plural, one {# item} other {# items}}' values={{ count: item.total_items }} />
                  </span>
                )}
                {item.collection_query && (
                  <span className='rounded-full bg-gray-100 black:bg-primary-900 px-3 py-1 text-sm font-bold text-gray-800 black:text-gray-200 dark:bg-primary-800 dark:text-gray-200'>
                    <FormattedMessage id='native_discovery.neodb.dynamic' defaultMessage='Dynamic collection' />
                  </span>
                )}
              </div>

              {item.summary && <p className='mt-3 whitespace-pre-line text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
              {item.catalog_description && item.catalog_description !== item.summary && (
                <p className='mt-3 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.catalog_description}</p>
              )}

              {item.catalog_credits.length > 0 && (
                <div className='mt-3'>
                  <p className='text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>Credits</p>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    {item.catalog_credits.map((credit, index) => {
                      const label = [credit.name, credit.role, credit.character_name].filter(Boolean).join(' / ');
                      const className = 'rounded-full bg-gray-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-gray-800 black:text-gray-200 dark:bg-primary-800 dark:text-gray-200';

                      return credit.person_url ? (
                        <Link className={`${className} hover:text-primary-700 black:hover:text-primary-300 dark:hover:text-primary-300`} key={`${credit.name}-${credit.role}-${index}`} to={nativeResolvePath('culture', credit.person_url)}>
                          {label}
                        </Link>
                      ) : (
                        <span className={className} key={`${credit.name}-${credit.role}-${index}`}>{label}</span>
                      );
                    })}
                  </div>
                </div>
              )}

              {item.catalog_tags.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {item.catalog_tags.map(tag => (
                    <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-900 black:text-primary-200 dark:bg-primary-900/40 dark:text-primary-100' key={tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <div className='mt-4 flex flex-wrap gap-2'>
                {item.catalog_url && (
                  <Link to={cultureActivityPath(item)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                    <FormattedMessage id='native_discovery.neodb.track' defaultMessage='Review or track' />
                  </Link>
                )}
                <Link to={nativeResolvePath('culture', item.activitypub_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                  <FormattedMessage id='native_discovery.neodb.open' defaultMessage='Open locally' />
                </Link>
                {item.catalog_url && (
                  <Link to={nativeResolvePath('culture', item.catalog_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.neodb.catalog' defaultMessage='Open catalog item' />
                  </Link>
                )}
                {item.collection_url && (
                  <Link to={nativeResolvePath('culture', item.collection_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.neodb.collection' defaultMessage='Open collection locally' />
                  </Link>
                )}
                {item.actor_url && (
                  <Link to={nativeResolvePath('culture', item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.neodb.reviewer' defaultMessage='Open reviewer' />
                  </Link>
                )}
                {item.review_url && item.review_url !== item.activitypub_url && (
                  <Link to={nativeResolvePath('culture', item.review_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.neodb.review' defaultMessage='Open review locally' />
                  </Link>
                )}
                {item.catalog_external_resources.map((resource, index) => (
                  <a href={resource} key={resource} target='_blank' rel='noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    {externalResourceLabel(resource, index)}
                  </a>
                ))}
                <a href={item.url} target='_blank' rel='noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                  <FormattedMessage id='native_discovery.neodb.source' defaultMessage='View source' />
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
        onNext={() => setOffset(discovery.data.next_offset || offset + pageSize)}
      />
    </section>
  );
};

export default NeoDBActivityDiscoveryPanel;

/* end of neodb-activity-discovery-panel.tsx */
