/*
 * Unfathomably cultural catalog discovery panel
 * ---------------------------------------------
 *
 * File: catalog-discovery-panel.tsx
 *
 * Purpose:
 *   Present outside cultural catalog records as clear, useful objects.
 *
 * Responsibilities:
 *   - search books, games, films, television, podcasts, and music
 *   - display credit, rating, language, tags, and release context
 *   - distinguish the canonical source record from its local ActivityPub view
 *
 * This file intentionally does not infer availability, ownership, streaming
 * rights, or a user's relationship to a remote catalog item. The local action
 * is reserved for catalog records whose canonical pages support ActivityPub.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import BookShelfControl, { BookLibraryOverview } from '@/components/book-shelf-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useCatalogDiscovery } from '@/api/hooks/discovery/useCatalogDiscovery.ts';

import type { CatalogCategory, CatalogDiscoveryItem } from '@/api/hooks/discovery/useCatalogDiscovery.ts';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface CatalogDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const cultureCategories: Array<{ id: CatalogCategory; label: string }> = [
  { id: 'movie', label: 'Films' },
  { id: 'tv', label: 'Television' },
  { id: 'music', label: 'Music' },
  { id: 'podcast', label: 'Podcasts' },
];

const categoryForFamily = (family: PresentationFamily, cultureCategory: CatalogCategory): CatalogCategory => {
  if (family === 'books') return 'book';
  if (family === 'games') return 'game';
  return cultureCategory;
};

const creditLabel = (item: CatalogDiscoveryItem): string => item.credits.map(credit => `${credit.role}: ${credit.name}`).join(' / ');

const CatalogDiscoveryPanel: React.FC<CatalogDiscoveryPanelProps> = ({ enabled, family }) => {
  const [cultureCategory, setCultureCategory] = useState<CatalogCategory>('movie');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [submittedCategory, setSubmittedCategory] = useState<CatalogCategory | null>(null);
  const [offset, setOffset] = useState(0);
  const visible = enabled && (family === 'books' || family === 'culture' || family === 'games');
  const category = categoryForFamily(family, cultureCategory);
  const hasCurrentSearch = submittedQuery.length > 0 && submittedCategory === category;
  const result = useCatalogDiscovery(category, submittedQuery, offset, visible && hasCurrentSearch);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSubmittedQuery(query.trim());
    setSubmittedCategory(category);
  };

  const selectCultureCategory = (nextCategory: CatalogCategory) => {
    setCultureCategory(nextCategory);
    setOffset(0);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      {family === 'books' && <BookLibraryOverview />}
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
              {family === 'books'
                ? <FormattedMessage id='native_discovery.catalog.books_title' defaultMessage='Find a book' />
                : <FormattedMessage id='native_discovery.catalog.title' defaultMessage='Catalogs beyond this server' />}
            </h2>
            <p className='mt-1 max-w-3xl text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
              {family === 'books'
                ? <FormattedMessage id='native_discovery.catalog.books_description' defaultMessage='Choose a federated edition to add it to your shelves, track progress, read the conversation, or write a review.' />
                : <FormattedMessage id='native_discovery.catalog.description' defaultMessage='Search public independent catalogs for real works and releases. Catalog records open in their native source view, where editions, credits, ratings, and collection context remain meaningful.' />}
            </p>
          </div>

        </div>

        {family === 'culture' && (
          <div className='mt-4 flex flex-wrap gap-2'>
            {cultureCategories.map(item => (
              <button
                key={item.id}
                type='button'
                className={cultureCategory === item.id ? 'rounded-full bg-primary-600 px-3 py-1.5 text-sm font-black text-white' : 'rounded-full border border-gray-300 black:border-gray-700 px-3 py-1.5 text-sm font-bold text-gray-700 black:text-gray-200 hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-gray-200 dark:hover:text-primary-300'}
                onClick={() => selectCultureCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <NativeDiscoverySearchForm
          disabled={!query.trim()}
          id='native-catalog-discovery-search'
          label={<FormattedMessage id='native_discovery.catalog.search_label' defaultMessage='Search the public catalog' />}
          value={query}
          placeholder='Search titles, creators, and releases'
          submitLabel={<FormattedMessage id='native_discovery.catalog.search' defaultMessage='Search catalog' />}
          onChange={setQuery}
          onSubmit={submit}
        />
      </div>

      {!hasCurrentSearch ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.catalog.start' defaultMessage='Enter a title or creator to search the configured public catalog. No background catalog crawl is performed.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(item => item.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.catalog.error' defaultMessage='Catalog search is temporarily unavailable. Cultural posts already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.catalog.empty' defaultMessage='No public catalog records matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='flex gap-3 bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {item.image_url ? (
                  <img src={item.image_url} alt='' loading='lazy' className='h-28 w-20 shrink-0 rounded-lg bg-black object-cover' />
                ) : (
                  <div className='flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-100 black:bg-primary-900 px-2 text-center text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>{item.category}</div>
                )}
                <div className='min-w-0 flex-1'>
                  <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  {creditLabel(item) && <p className='mt-1 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>{creditLabel(item)}</p>}
                  <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
                  <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                    {typeof item.rating === 'number' && <span>{item.rating.toFixed(1)} / 10{item.rating_count > 0 ? ` (${item.rating_count})` : ''}</span>}
                    {item.year && <span>{item.year}</span>}
                    {item.languages.length > 0 && <span>{item.languages.join(', ')}</span>}
                  </div>
                  {item.summary && <p className='mt-2 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  {item.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                    </div>
                  )}
                  {family === 'books' && item.local_action === 'resolve' && (
                    <BookShelfControl
                      bookUri={item.url}
                      native={{ ...item, author: item.credits.filter((credit) => credit.role === 'author').map((credit) => credit.name).join(', ') }}
                    />
                  )}
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {item.local_action === 'resolve' && (
                      <Link to={nativeResolvePath(family, item.url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                        <FormattedMessage id='native_discovery.catalog.resolve' defaultMessage='Open record here' />
                      </Link>
                    )}
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.catalog.view' defaultMessage='View source record' />
                    </a>
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

export default CatalogDiscoveryPanel;

/* end of catalog-discovery-panel.tsx */
