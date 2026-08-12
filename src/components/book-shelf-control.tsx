/*
  Unfathomably native book library
  ---------------------------------

  File: src/components/book-shelf-control.tsx

  Purpose:

    Present BookWyrm-compatible reading shelves as a normal reader workflow.

  Responsibilities:

    * load and summarize the current reader's shelves
    * add, move, update progress, or remove a canonical book URI
    * preserve a small presentation snapshot for the personal library
    * send reviews through the ordinary Worlds post composer

  This file intentionally does NOT turn shelf changes into Review objects or
  classify arbitrary statuses as books.
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as z from '@/zod.ts';

import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import { markQueriesStale, restoreQuerySnapshot, snapshotQueries } from '@/queries/optimistic-mutation.ts';

const shelfIdSchema = z.enum(['to-read', 'reading', 'read', 'stopped-reading']);
const progressModeSchema = z.enum(['page', 'percent']);
const shelfDateTimeSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/, 'Expected an ISO 8601 date-time')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Expected a valid date-time');
const shelfEntrySchema = z.object({
  book_uri: z.string().url(),
  presentation: z.object({
    author: z.string().optional(),
    image: z.string().optional(),
    isbn: z.string().optional(),
    published_at: z.string().optional(),
    subtitle: z.string().optional(),
    title: z.string().optional(),
  }),
  progress: z.number().int().nonnegative().nullable(),
  progress_mode: progressModeSchema.nullable(),
  shelf: shelfIdSchema,
  started_at: shelfDateTimeSchema.nullable(),
  finished_at: shelfDateTimeSchema.nullable(),
  updated_at: shelfDateTimeSchema,
});
export const shelfResponseSchema = z.object({
  shelves: z.array(z.object({
    id: shelfIdSchema,
    items: z.array(shelfEntrySchema),
    name: z.string(),
  })),
  total: z.number().int().nonnegative(),
});

type ShelfId = z.infer<typeof shelfIdSchema>;
type ProgressMode = z.infer<typeof progressModeSchema>;
type ShelfEntry = z.infer<typeof shelfEntrySchema>;
type ShelfResponse = z.infer<typeof shelfResponseSchema>;

interface BookShelfControlProps {
  bookUri: string;
  canReview?: boolean;
  native: Record<string, any>;
}

const shelfNames: Record<ShelfId, string> = {
  'to-read': 'Want to read',
  reading: 'Reading',
  read: 'Read',
  'stopped-reading': 'Stopped',
};

const shelfOrder: ShelfId[] = ['to-read', 'reading', 'read', 'stopped-reading'];
const libraryPageSize = 50;
const localBookPath = (bookUri: string): string => `/worlds/books?view=search&resolve=${encodeURIComponent(bookUri)}`;

const nextShelfAction = (currentShelf?: ShelfId): { label: string; shelf: ShelfId } => {
  switch (currentShelf) {
    case 'to-read':
      return { label: 'Start reading', shelf: 'reading' };
    case 'reading':
      return { label: 'Finish reading', shelf: 'read' };
    case 'read':
      return { label: 'Read again', shelf: 'reading' };
    case 'stopped-reading':
      return { label: 'Resume reading', shelf: 'reading' };
    default:
      return { label: 'Want to read', shelf: 'to-read' };
  }
};

const reviewPath = (bookUri: string, title?: string): string => {
  const params = new URLSearchParams({ view: 'create', template: 'books', reference: bookUri });
  if (title) params.set('title', title);
  return `/worlds/books?${params.toString()}`;
};

const presentationValue = (native: Record<string, any>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const directValue = native[key];
    if (typeof directValue === 'string' && directValue.trim()) return directValue.trim();

    if (Array.isArray(native.fields)) {
      const field = native.fields.find((candidate: any) => candidate?.key === key || candidate?.name === key);
      if (typeof field?.value === 'string' && field.value.trim()) return field.value.trim();
    } else if (typeof native.fields?.[key] === 'string' && native.fields[key].trim()) {
      return native.fields[key].trim();
    }
  }

  return undefined;
};

const useBookShelves = (accountId?: string) => {
  const api = useApi();
  const { account } = useOwnAccount();
  const requestedAccountId = accountId || account?.id;

  return useQuery<ShelfResponse>({
    queryKey: ['book-shelves', requestedAccountId],
    queryFn: async () => {
      const endpoint = accountId
        ? `/api/v1/accounts/${accountId}/book_shelves`
        : '/api/v1/book_shelves';
      const response = await api.get(endpoint);
      return shelfResponseSchema.parse(await response.json());
    },
    enabled: Boolean(requestedAccountId),
    staleTime: 30_000,
  });
};

interface ShelfMutationInput {
  nextProgress?: number | null;
  nextProgressMode?: ProgressMode | null;
  nextShelf: ShelfId;
}

const shelfPresentation = (native: Record<string, any>): ShelfEntry['presentation'] => ({
  title: presentationValue(native, 'title', 'name'),
  subtitle: presentationValue(native, 'subtitle'),
  author: presentationValue(native, 'author', 'creator'),
  image: presentationValue(native, 'image', 'cover'),
  isbn: presentationValue(native, 'isbn', 'isbn13', 'isbn10'),
  published_at: presentationValue(native, 'published_at', 'publishedDate'),
});

const mergeShelfPresentation = (
  current: ShelfEntry['presentation'] | undefined,
  incoming: ShelfEntry['presentation'],
): ShelfEntry['presentation'] => Object.fromEntries([
  ...Object.entries(current || {}),
  ...Object.entries(incoming).filter(([_key, value]) => value !== undefined),
]) as ShelfEntry['presentation'];

const replaceShelfEntry = (data: ShelfResponse, entry: ShelfEntry): ShelfResponse => {
  const shelves = data.shelves.map((shelf) => {
    const remaining = shelf.items.filter((candidate) => candidate.book_uri !== entry.book_uri);
    return shelf.id === entry.shelf ? { ...shelf, items: [entry, ...remaining] } : { ...shelf, items: remaining };
  });

  return {
    shelves,
    total: shelves.reduce((total, shelf) => total + shelf.items.length, 0),
  };
};

const removeShelfEntry = (data: ShelfResponse, bookUri: string): ShelfResponse => {
  const shelves = data.shelves.map((shelf) => ({
    ...shelf,
    items: shelf.items.filter((candidate) => candidate.book_uri !== bookUri),
  }));

  return {
    shelves,
    total: shelves.reduce((total, shelf) => total + shelf.items.length, 0),
  };
};

const optimisticShelfEntry = (
  bookUri: string,
  current: ShelfEntry | undefined,
  input: ShelfMutationInput,
  native: Record<string, any>,
): ShelfEntry => {
  const now = new Date().toISOString();
  const progress = input.nextProgress ?? null;

  return {
    book_uri: bookUri,
    presentation: mergeShelfPresentation(current?.presentation, shelfPresentation(native)),
    progress,
    progress_mode: progress === null ? null : input.nextProgressMode ?? null,
    shelf: input.nextShelf,
    started_at: input.nextShelf === 'reading' ? current?.started_at || now : current?.started_at || null,
    finished_at: input.nextShelf === 'read' ? current?.finished_at || now : null,
    updated_at: now,
  };
};

export const BookLibraryOverview: React.FC = () => {
  const { account } = useOwnAccount();
  const { data, isError, isFetching, refetch } = useBookShelves();

  if (!account) return null;

  const isInitialLoading = isFetching && !data;
  const isEmpty = !isInitialLoading && !isError && data?.total === 0;
  const hasBooks = Boolean(data && data.total > 0);

  return (
    <section className='border-b border-gray-200 bg-white px-4 py-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
      <div className='flex items-baseline justify-between gap-3'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>My books</h2>
        <div className='flex items-center gap-3'>
          {data ? <span className='text-sm text-gray-500 black:text-gray-400 dark:text-gray-400'>{data.total} total</span> : null}
          <Link className='text-sm font-bold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300' to='/worlds/books?view=library'>Open library</Link>
        </div>
      </div>

      {isInitialLoading ? (
        <p className='mt-3 text-sm text-gray-500 black:text-gray-400 dark:text-gray-400'>Loading your shelves...</p>
      ) : null}

      {isError ? (
        <div className='mt-3 flex flex-wrap items-center gap-3'>
          <p className='text-sm text-danger-600'>Your shelves could not be loaded.</p>
          <button type='button' className='text-sm font-bold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300' onClick={() => void refetch()}>Try again</button>
        </div>
      ) : null}

      {isEmpty ? (
        <p className='mt-3 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>Your shelves are empty. Find a book below, then choose Want to read, Reading, or Read.</p>
      ) : null}

      {hasBooks && data ? (
        <div className='mt-3 grid gap-4 sm:grid-cols-2'>
          {data.shelves.filter((shelf) => shelf.items.length > 0).map((shelf) => (
            <div key={shelf.id}>
              <h3 className='text-sm font-black text-gray-950 black:text-white dark:text-white'>{shelf.name} ({shelf.items.length})</h3>
              <ul className='mt-2 divide-y divide-solid divide-gray-200 border-y border-gray-200 black:divide-gray-800 black:border-gray-800 dark:divide-gray-800 dark:border-gray-800'>
                {shelf.items.slice(0, 5).map((entry) => (
                  <li key={entry.book_uri} className='py-2'>
                    <Link className='line-clamp-1 text-sm font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to={localBookPath(entry.book_uri)}>
                      {entry.presentation.title || entry.book_uri}
                    </Link>
                    {entry.presentation.author ? <p className='line-clamp-1 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>by {entry.presentation.author}</p> : null}
                    {entry.progress !== null ? <p className='text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{entry.progress}{entry.progress_mode === 'percent' ? '%' : ` ${entry.progress === 1 ? 'page' : 'pages'}`}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

const readableDate = (value: string | null): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

interface BookLibraryProps {
  accountId?: string;
  accountName?: string;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({ accountId, accountName }) => {
  const { account } = useOwnAccount();
  const { data, isError, isFetching, refetch } = useBookShelves(accountId);
  const [activeShelf, setActiveShelf] = useState<ShelfId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(libraryPageSize);
  const editable = Boolean(account && (!accountId || account.id === accountId));
  const libraryName = editable ? 'My books' : `${accountName || 'Reader'}'s books`;

  const entries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return (data?.shelves || [])
      .filter((shelf) => activeShelf === 'all' || shelf.id === activeShelf)
      .flatMap((shelf) => shelf.items)
      .filter((entry) => {
        if (!normalizedQuery) return true;

        return [
          entry.presentation.title,
          entry.presentation.subtitle,
          entry.presentation.author,
          entry.presentation.isbn,
          entry.book_uri,
        ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      });
  }, [activeShelf, data, query]);

  const visibleEntries = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount]);
  const remainingEntries = entries.length - visibleEntries.length;

  useEffect(() => {
    setVisibleCount(libraryPageSize);
  }, [activeShelf, query]);

  if (!account && !accountId) {
    return (
      <section className='border-b border-gray-200 bg-white px-4 py-8 text-center black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
        <h2 className='text-xl font-black text-gray-950 black:text-white dark:text-white'>My books</h2>
        <p className='mt-2 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>Sign in to build reading shelves, track progress, and publish reviews.</p>
      </section>
    );
  }

  return (
    <section className='bg-white black:bg-black dark:bg-primary-900'>
      <header className='border-b border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-xl font-black text-gray-950 black:text-white dark:text-white'>{libraryName}</h2>
            <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>{editable ? 'Keep a reading list, track where you are, and review books for the fediverse.' : 'Public reading shelves and progress shared by this account.'}</p>
          </div>
          {editable ? <Link className='rounded-full bg-primary-600 px-4 py-2 text-sm font-black text-white hover:bg-primary-500' to='/worlds/books?view=search'>Find books</Link> : null}
        </div>

        <div className='mt-4 flex gap-2 overflow-x-auto pb-1'>
          <button type='button' className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${activeShelf === 'all' ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:border-primary-500 black:border-gray-700 black:text-gray-200 dark:border-gray-700 dark:text-gray-200'}`} onClick={() => setActiveShelf('all')}>
            All {data ? `(${data.total})` : ''}
          </button>
          {shelfOrder.map((shelfId) => {
            const count = data?.shelves.find((shelf) => shelf.id === shelfId)?.items.length || 0;
            return (
              <button key={shelfId} type='button' className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${activeShelf === shelfId ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:border-primary-500 black:border-gray-700 black:text-gray-200 dark:border-gray-700 dark:text-gray-200'}`} onClick={() => setActiveShelf(shelfId)}>
                {shelfNames[shelfId]} ({count})
              </button>
            );
          })}
        </div>

        <label className='mt-3 block'>
          <span className='sr-only'>Search {libraryName}</span>
          <input type='search' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search title, author, or ISBN' className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-primary-500 black:border-gray-700 black:bg-black black:text-white dark:border-gray-700 dark:bg-primary-950 dark:text-white' />
        </label>
      </header>

      {isFetching && !data ? <p className='px-4 py-8 text-center text-sm text-gray-500 black:text-gray-400 dark:text-gray-400'>Loading your library...</p> : null}

      {isError ? (
        <div className='px-4 py-8 text-center sm:px-5'>
          <p className='text-sm font-bold text-danger-600'>Your library could not be loaded.</p>
          <button type='button' className='mt-3 rounded-full border border-primary-500 px-4 py-2 text-sm font-black text-primary-700 hover:bg-primary-50 black:text-primary-300 black:hover:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900' onClick={() => void refetch()}>Try again</button>
        </div>
      ) : null}

      {!isFetching && data?.total === 0 ? (
        <div className='px-4 py-10 text-center sm:px-5'>
          <h3 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>{editable ? 'Your shelves are ready' : 'No public books yet'}</h3>
          <p className='mt-2 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>{editable ? 'Find a book and choose Want to read, Reading, or Read to add it here.' : 'This account has not added any books to its public shelves.'}</p>
          {editable ? <Link className='mt-4 inline-block rounded-full bg-primary-600 px-4 py-2 text-sm font-black text-white hover:bg-primary-500' to='/worlds/books?view=search'>Find your first book</Link> : null}
        </div>
      ) : null}

      {data && data.total > 0 && entries.length === 0 ? <p className='px-4 py-8 text-center text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>No books match this shelf and search.</p> : null}

      {visibleEntries.map((entry) => {
        const title = entry.presentation.title || entry.book_uri;
        const startedAt = readableDate(entry.started_at);
        const finishedAt = readableDate(entry.finished_at);
        const native = { ...entry.presentation, title };

        return (
          <article key={entry.book_uri} className='border-b border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
            <div className='flex gap-4'>
              <Link className='h-28 w-20 shrink-0 overflow-hidden rounded bg-primary-100 black:bg-primary-950 dark:bg-primary-950' to={localBookPath(entry.book_uri)}>
                {entry.presentation.image ? <img src={entry.presentation.image} alt='' className='h-full w-full object-cover' loading='lazy' /> : <span className='flex h-full items-center justify-center text-2xl font-black text-primary-700 black:text-primary-300 dark:text-primary-300'>B</span>}
              </Link>

              <div className='min-w-0 flex-1'>
                <Link className='text-base font-black text-gray-950 hover:text-primary-700 hover:underline black:text-white black:hover:text-primary-300 dark:text-white dark:hover:text-primary-300' to={localBookPath(entry.book_uri)}>{title}</Link>
                {entry.presentation.subtitle ? <p className='mt-0.5 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>{entry.presentation.subtitle}</p> : null}
                {entry.presentation.author ? <p className='mt-1 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>by {entry.presentation.author}</p> : null}

                <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
                  <span className='font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{shelfNames[entry.shelf]}</span>
                  {startedAt ? <span>Started {startedAt}</span> : null}
                  {finishedAt ? <span>Finished {finishedAt}</span> : null}
                  {entry.presentation.isbn ? <span>ISBN {entry.presentation.isbn}</span> : null}
                </div>

                {entry.progress !== null ? (
                  <div className='mt-2 max-w-sm'>
                    <p className='text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>{entry.progress}{entry.progress_mode === 'percent' ? '%' : ` ${entry.progress === 1 ? 'page' : 'pages'}`}</p>
                    {entry.progress_mode === 'percent' ? <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 black:bg-gray-800 dark:bg-gray-800'><div className='h-full rounded-full bg-primary-600' style={{ width: `${Math.min(entry.progress, 100)}%` }} /></div> : null}
                  </div>
                ) : null}
              </div>
            </div>

            {editable ? <BookShelfControl bookUri={entry.book_uri} native={native} /> : null}
          </article>
        );
      })}

      {remainingEntries > 0 ? (
        <div className='border-b border-gray-200 px-4 py-5 text-center black:border-gray-800 dark:border-gray-800 sm:px-5'>
          <button type='button' className='rounded-full border border-primary-500 px-4 py-2 text-sm font-black text-primary-700 hover:bg-primary-50 black:text-primary-300 black:hover:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900' onClick={() => setVisibleCount((count) => count + libraryPageSize)}>
            Show more books ({remainingEntries} remaining)
          </button>
        </div>
      ) : null}
    </section>
  );
};

const BookShelfControl: React.FC<BookShelfControlProps> = ({ bookUri, canReview = true, native }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { account } = useOwnAccount();
  const { data } = useBookShelves();
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressMode, setProgressMode] = useState<ProgressMode>('percent');

  const current = useMemo(
    () => data?.shelves.flatMap((candidate) => candidate.items).find((entry) => entry.book_uri === bookUri),
    [bookUri, data],
  );

  useEffect(() => {
    if (!current) return;
    setProgress(current.progress === null ? '' : String(current.progress));
    setProgressMode(current.progress_mode || 'percent');
  }, [current]);

  const saveMutation = useMutation({
    mutationFn: async ({ nextShelf, nextProgress, nextProgressMode }: ShelfMutationInput) => {
      const response = await api.post('/api/v1/book_shelves', {
        book_uri: bookUri,
        shelf: nextShelf,
        progress: nextProgress ?? null,
        progress_mode: nextProgressMode ?? null,
        presentation: shelfPresentation(native),
      });

      return shelfEntrySchema.parse(await response.json());
    },
    mutationKey: ['book-shelf', bookUri],
    scope: { id: `book-shelves:${account?.id || 'anonymous'}` },
    onMutate: async (input) => {
      const snapshot = await snapshotQueries<ShelfResponse>(queryClient, { queryKey: ['book-shelves'] });
      const ownQueryKey = ['book-shelves', account?.id] as const;
      const optimisticEntry = optimisticShelfEntry(bookUri, current, input, native);

      queryClient.setQueryData<ShelfResponse>(ownQueryKey, (existing) => (
        existing ? replaceShelfEntry(existing, optimisticEntry) : existing
      ));

      return { snapshot };
    },
    onError: (_error, _input, context) => {
      if (context) restoreQuerySnapshot(queryClient, context.snapshot);
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<ShelfResponse>(['book-shelves', account?.id], (existing) => (
        existing ? replaceShelfEntry(existing, entry) : existing
      ));
    },
    onSettled: () => markQueriesStale(queryClient, { queryKey: ['book-shelves'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/v1/book_shelves', { searchParams: { book_uri: bookUri } });
    },
    mutationKey: ['book-shelf-remove', bookUri],
    scope: { id: `book-shelves:${account?.id || 'anonymous'}` },
    onMutate: async () => {
      const snapshot = await snapshotQueries<ShelfResponse>(queryClient, { queryKey: ['book-shelves'] });

      queryClient.setQueryData<ShelfResponse>(['book-shelves', account?.id], (existing) => (
        existing ? removeShelfEntry(existing, bookUri) : existing
      ));

      return { snapshot };
    },
    onError: (_error, _input, context) => {
      if (context) restoreQuerySnapshot(queryClient, context.snapshot);
    },
    onSuccess: () => {
      setExpanded(false);
    },
    onSettled: () => markQueriesStale(queryClient, { queryKey: ['book-shelves'] }),
  });

  if (!account) return null;

  const chooseShelf = (nextShelf: ShelfId) => {
    const preserveProgress = nextShelf === 'reading' && ['reading', 'stopped-reading'].includes(current?.shelf || '');
    saveMutation.mutate({ nextShelf, nextProgress: preserveProgress ? current?.progress ?? null : null, nextProgressMode: preserveProgress ? current?.progress_mode ?? null : null });
    setExpanded(nextShelf === 'reading');
  };

  const saveProgress = () => {
    const numericProgress = progress.trim() === '' ? null : Number(progress);
    saveMutation.mutate({
      nextShelf: 'reading',
      nextProgress: Number.isFinite(numericProgress) ? numericProgress : null,
      nextProgressMode: progress.trim() === '' ? null : progressMode,
    });
  };

  const title = presentationValue(native, 'title', 'name');
  const primaryAction = nextShelfAction(current?.shelf);
  const alternateShelves = shelfOrder.filter((shelfId) => shelfId !== current?.shelf && shelfId !== primaryAction.shelf);

  return (
    <div className='mt-3 w-full border-y border-gray-200 py-3 black:border-gray-800 dark:border-gray-800'>
      {current ? <p className='mb-2 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>On your {shelfNames[current.shelf].toLowerCase()} shelf</p> : null}

      <div className='flex flex-wrap items-center gap-2'>
        <button type='button' className='rounded-full bg-primary-600 px-3 py-1.5 text-sm font-black text-white hover:bg-primary-500 disabled:opacity-50' disabled={saveMutation.isPending} onClick={() => chooseShelf(primaryAction.shelf)}>
          {primaryAction.label}
        </button>

        {current?.shelf === 'reading' ? (
          <button type='button' className='rounded-full border border-gray-300 px-3 py-1.5 text-sm font-bold text-gray-800 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-gray-100 black:hover:text-primary-300 dark:border-gray-700 dark:text-gray-100 dark:hover:text-primary-300' onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Hide progress' : 'Update progress'}
          </button>
        ) : null}

        {alternateShelves.length > 0 ? (
          <label>
            <span className='sr-only'>Other reading status</span>
            <select value='' className='rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-800 hover:border-primary-500 black:border-gray-700 black:bg-black black:text-gray-100 dark:border-gray-700 dark:bg-primary-950 dark:text-gray-100' disabled={saveMutation.isPending} onChange={(event) => chooseShelf(event.target.value as ShelfId)}>
              <option value='' disabled>Other reading status...</option>
              {alternateShelves.map((shelfId) => <option key={shelfId} value={shelfId}>{shelfNames[shelfId]}</option>)}
            </select>
          </label>
        ) : null}

        {canReview ? <Link className='rounded-full border border-primary-500 px-3 py-1.5 text-sm font-black text-primary-700 hover:bg-primary-50 black:text-primary-300 black:hover:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900' to={reviewPath(bookUri, title)}>Review</Link> : null}
      </div>

      {expanded ? (
        <div className='mt-3 flex flex-wrap items-end gap-2'>
          <label className='text-xs font-bold text-gray-700 black:text-gray-300 dark:text-gray-300'>
            Progress
            <input type='number' min='0' max={progressMode === 'percent' ? 100 : undefined} value={progress} onChange={(event) => setProgress(event.target.value)} placeholder={progressMode === 'percent' ? '0 to 100' : 'Page'} className='mt-1 block w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 black:border-gray-700 black:bg-black black:text-white dark:border-gray-700 dark:bg-primary-950 dark:text-white' />
          </label>
          <label className='text-xs font-bold text-gray-700 black:text-gray-300 dark:text-gray-300'>
            Measured in
            <select value={progressMode} onChange={(event) => setProgressMode(event.target.value as ProgressMode)} className='mt-1 block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 black:border-gray-700 black:bg-black black:text-white dark:border-gray-700 dark:bg-primary-950 dark:text-white'>
              <option value='percent'>Percent</option>
              <option value='page'>Pages</option>
            </select>
          </label>
          <button type='button' className='rounded-md bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500 disabled:opacity-50' disabled={saveMutation.isPending} onClick={saveProgress}>Save progress</button>
        </div>
      ) : null}

      {saveMutation.isError || removeMutation.isError ? <p className='mt-2 text-xs text-danger-600'>Your reading state could not be saved. Please try again.</p> : null}
      {current ? <button type='button' className='mt-2 text-xs font-bold text-gray-500 hover:text-danger-600 black:text-gray-400 dark:text-gray-400' disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>Remove from my books</button> : null}
    </div>
  );
};

export default BookShelfControl;

/* end of src/components/book-shelf-control.tsx */
