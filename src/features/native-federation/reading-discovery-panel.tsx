/*
 * Unfathomably federated reading discovery panel
 * -----------------------------------------------
 *
 * File: reading-discovery-panel.tsx
 *
 * Purpose:
 *   Make public BookWyrm-style social reading objects locally discoverable.
 *
 * Responsibilities:
 *   - search received reviews, quotations, ratings, shelves, lists, and suggestions
 *   - preserve the relationship between commentary, readers, and books
 *   - route each stable ActivityPub reference through the local resolver
 *
 * This file intentionally does not contact remote reading communities,
 * display private shelves, or turn bibliographic records into fake reviews.
 */

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import BookShelfControl from '@/components/book-shelf-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useReadingDiscovery } from '@/api/hooks/discovery/useReadingDiscovery.ts';

import type { ReadingBookContext, ReadingDiscoveryItem } from '@/api/hooks/discovery/useReadingDiscovery.ts';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ReadingDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const kindLabel = (item: ReadingDiscoveryItem): string => item.kind.replaceAll('_', ' ');

const publishedLabel = (value: string | undefined, locale: string): string | undefined => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const ratingLabel = (item: ReadingDiscoveryItem): string | undefined => {
  if (typeof item.rating !== 'number') return undefined;
  return `${item.rating.toFixed(item.rating % 1 === 0 ? 0 : 1)} / ${item.rating_best}`;
};

const collectionLabel = (item: ReadingDiscoveryItem): string | undefined => {
  if (typeof item.item_count === 'number') {
    return `${item.item_count} ${item.item_count === 1 ? 'book' : 'books'}`;
  }

  if (typeof item.known_item_count === 'number') {
    return `${item.known_item_count} known ${item.known_item_count === 1 ? 'book' : 'books'}`;
  }

  return undefined;
};

const measurementLabel = (value: number | undefined, mode: string | undefined): string | undefined => {
  if (typeof value !== 'number') return undefined;
  return mode ? `${value} ${mode.replaceAll('_', ' ')}` : String(value);
};

const BookContext: React.FC<{ book: ReadingBookContext }> = ({ book }) => {
  const authors = book.authors.flatMap(author => author.name || []);
  const details = [
    book.type,
    book.physical_format,
    typeof book.pages === 'number' ? `${book.pages} pages` : undefined,
    book.published_date,
    book.isbn_13 ? `ISBN ${book.isbn_13}` : (book.isbn_10 ? `ISBN ${book.isbn_10}` : undefined),
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <div className='mt-3 rounded-lg border border-gray-200 black:border-gray-800 bg-white black:bg-black p-3 dark:border-gray-700 dark:bg-primary-900'>
      <p className='font-black text-gray-950 black:text-white dark:text-white'>{book.title}</p>
      {book.subtitle && <p className='text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>{book.subtitle}</p>}
      {authors.length > 0 && <p className='mt-1 text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>by {authors.join(', ')}</p>}
      {details.length > 0 && <p className='mt-2 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{details.join(' / ')}</p>}
      {book.publishers.length > 0 && <p className='mt-1 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{book.publishers.join(', ')}</p>}
      <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs'>
        <Link to={nativeResolvePath('books', book.id)} className='font-black text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
          Open {book.type}
        </Link>
        {book.work_url && (
          <Link to={nativeResolvePath('books', book.work_url)} className='font-black text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
            Open work
          </Link>
        )}
        {book.authors.map((author, index) => (
          <Link key={author.url} to={nativeResolvePath('books', author.url)} className='font-black text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
            {author.name || `Author ${index + 1}`}
          </Link>
        ))}
        {book.catalogue_links.map(link => (
          <a
            key={`${link.label}:${link.url}`}
            href={link.url}
            target='_blank'
            rel='noopener noreferrer'
            className='font-black text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'
          >
            Open in {link.label}
          </a>
        ))}
      </div>
      <BookShelfControl
        bookUri={book.id}
        native={{
          author: authors.join(', '),
          isbn: book.isbn_13 || book.isbn_10,
          published_at: book.published_date,
          subtitle: book.subtitle,
          title: book.title,
        }}
      />
    </div>
  );
};

const ReadingDiscoveryPanel: React.FC<ReadingDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && (family === 'all' || family === 'books');
  const result = useReadingDiscovery(submittedQuery, offset, visible);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().slice(0, 200);
    if (normalized.length === 1) return;

    setOffset(0);
    setSubmittedQuery(normalized);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.reading.title' defaultMessage='What readers are saying' />}
        description={<FormattedMessage id='native_discovery.reading.description' defaultMessage='Search reviews, quotes, lists, and reading updates already known to this server.' />}
        disabled={query.trim().length === 1}
        id='native-reading-discovery-search'
        label={<FormattedMessage id='native_discovery.reading.search_label' defaultMessage='Search received reading activity' />}
        value={query}
        placeholder='Search titles, review text, readers, and shelf names'
        submitLabel={<FormattedMessage id='native_discovery.reading.search' defaultMessage='Search reading activity' />}
        onChange={setQuery}
        onSubmit={submit}
      />

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.reading.error' defaultMessage='Reading activity could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.reading.empty' defaultMessage='No reading activity matched this view.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => {
              const rating = ratingLabel(item);
              const collection = collectionLabel(item);
              const published = publishedLabel(item.published_at, intl.locale);
              const progress = measurementLabel(item.progress, item.progress_mode);
              const position = measurementLabel(item.position, item.position_mode);

              const commentary = (
                <>
                  {item.summary && <p className='mt-3 line-clamp-5 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  {item.quote && <blockquote className='mt-3 border-l-4 border-primary-400 pl-3 text-sm italic text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.quote}</blockquote>}
                </>
              );

              return (
                <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                  <div className='flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>
                    <span>{kindLabel(item)}</span>
                    {rating && <span>{rating}</span>}
                    {collection && <span>{collection}</span>}
                    {position && <span>position {position}</span>}
                    {progress && <span>progress {progress}</span>}
                    {item.reading_status && <span>{item.reading_status.replaceAll('_', ' ')}</span>}
                  </div>
                  <h3 className='mt-1 text-lg font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  {item.actor_label && <p className='mt-1 truncate text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.actor_label}</p>}
                  {item.book && <BookContext book={item.book} />}
                  {item.sensitive ? (
                    <details className='mt-3 rounded-lg border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 px-3 py-2 dark:border-primary-700 dark:bg-primary-900/40'>
                      <summary className='cursor-pointer text-sm font-black text-primary-900 black:text-primary-200 dark:text-primary-100'>
                        {item.content_warning || 'Sensitive or spoiler-marked reading note'}
                      </summary>
                      {commentary}
                    </details>
                  ) : commentary}
                  {item.books.length > 0 && (
                    <div className='mt-3 space-y-2'>
                      {item.books.slice(0, 4).map(book => <BookContext key={book.id} book={book} />)}
                    </div>
                  )}
                  <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    {published && <span>{published}</span>}
                    <span>{item.source_host}</span>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('books', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.reading.open' defaultMessage='Open locally' />
                    </Link>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.reading.source' defaultMessage='View source' />
                    </a>
                    {item.book_url && !item.book && (
                      <Link to={nativeResolvePath('books', item.book_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.reading.book' defaultMessage='Open book' />
                      </Link>
                    )}
                    {item.collection_url && (
                      <Link to={nativeResolvePath('books', item.collection_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.reading.collection' defaultMessage='Open collection' />
                      </Link>
                    )}
                    {item.books.length === 0 && item.book_urls.slice(0, 4).map((bookUrl, index) => (
                      <Link key={bookUrl} to={nativeResolvePath('books', bookUrl)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage
                          id='native_discovery.reading.collection_book'
                          defaultMessage='Book {number}'
                          values={{ number: index + 1 }}
                        />
                      </Link>
                    ))}
                    {item.actor_url && (
                      <Link to={nativeResolvePath('books', item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.reading.reader' defaultMessage='Open reader' />
                      </Link>
                    )}
                  </div>
                </NativeDiscoveryArticle>
              );
            })}
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

export default ReadingDiscoveryPanel;

/* end of reading-discovery-panel.tsx */
