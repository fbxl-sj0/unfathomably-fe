/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/world-object-library.tsx

  Purpose:
    Present saved native objects as a useful personal or public workspace.

  Responsibilities:
    - group entries by native workflow state
    - render recognisable object cards with progress and completion dates
    - open the object through Unfathomably's local resolver
    - keep private notes confined to the current user's workspace

  This file intentionally does not duplicate book shelves or publish timeline
  statuses when a user changes local workflow state.
*/

import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as z from '@/zod.ts';

import { worldObjectStateSchema, type WorldObjectState } from '@/api/hooks/discovery/useWorldObjectState.ts';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

interface WorldObjectLibraryProps {
  accountId?: string;
  accountName?: string;
  family: string;
}

const responseSchema = z.object({ states: z.array(worldObjectStateSchema) });

const familyNames: Record<string, string> = {
  audio: 'audio',
  video: 'videos',
  longform: 'reading',
  photo: 'photos',
  bookmarks: 'bookmarks',
  groups: 'communities',
  events: 'events',
  development: 'projects',
  models: 'models',
  marketplace: 'listings',
  games: 'games',
  routes: 'routes',
  culture: 'culture',
  coordination: 'coordination',
  publishing: 'publications',
};

const readable = (value: string): string => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const progressLabel = (entry: WorldObjectState): string | null => {
  if (entry.progress === null) return null;
  const total = entry.progress_total === null ? '' : ` / ${entry.progress_total}`;
  return `${entry.progress}${total} ${entry.progress_unit || ''}`.trim();
};

const dateLabel = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const WorldObjectLibrary: React.FC<WorldObjectLibraryProps> = ({ accountId, accountName, family }) => {
  const api = useApi();
  const { account } = useOwnAccount();
  const [filter, setFilter] = useState('all');
  const ownLibrary = !accountId || accountId === account?.id;
  const query = useQuery({
    queryKey: ['world-object-states', accountId || account?.id, family],
    queryFn: async () => {
      const endpoint = accountId
        ? `/api/v1/discovery/native-objects/states/account/${accountId}`
        : '/api/v1/discovery/native-objects/states';
      const response = await api.get(endpoint, { searchParams: { family, limit: 200 } });
      return responseSchema.parse(await response.json()).states;
    },
    enabled: Boolean(accountId || account?.id),
    staleTime: 30_000,
  });
  const states = query.data || [];
  const availableStates = useMemo(() => Array.from(new Set(states.map(entry => entry.state))), [states]);
  const visibleStates = filter === 'all' ? states : states.filter(entry => entry.state === filter);
  const worldName = familyNames[family] || family;

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <header className='border-b border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
          {ownLibrary ? `My ${worldName}` : `${accountName || 'Account'}: ${worldName}`}
        </h2>
        {availableStates.length > 1 && (
          <div className='mt-3 flex flex-wrap gap-2'>
            {['all', ...availableStates].map(state => (
              <button
                className={state === filter
                  ? 'rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white'
                  : 'rounded-full border border-primary-300 bg-transparent px-3 py-1 text-xs font-bold text-primary-700 black:border-primary-700 black:text-primary-300 dark:border-primary-700 dark:text-primary-300'}
                key={state}
                onClick={() => setFilter(state)}
                type='button'
              >
                {readable(state)}
              </button>
            ))}
          </div>
        )}
      </header>

      {query.isFetching && !query.data ? (
        <p className='px-4 py-6 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>Loading workspace...</p>
      ) : query.isError ? (
        <div className='px-4 py-6'>
          <p className='text-sm font-semibold text-danger-600'>This workspace could not be loaded.</p>
          <button className='mt-2 font-bold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300' onClick={() => void query.refetch()} type='button'>Try again</button>
        </div>
      ) : visibleStates.length === 0 ? (
        <div className='px-4 py-8 text-center'>
          <p className='font-bold text-gray-950 black:text-white dark:text-white'>
            {ownLibrary ? `No saved ${worldName} yet.` : `No public ${worldName} here yet.`}
          </p>
          {ownLibrary && <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>Use the save or progress action on any item in this World.</p>}
        </div>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {visibleStates.map(entry => {
            const title = entry.presentation.title || entry.object_uri;
            const progress = progressLabel(entry);
            const finished = dateLabel(entry.finished_at);
            const params = new URLSearchParams({ resolve: entry.object_uri, view: 'search' });

            return (
              <article className='px-4 py-4 sm:px-5' key={entry.id}>
                <div className='flex min-w-0 items-start gap-3'>
                  {entry.presentation.image && (
                    <img alt='' className='h-20 w-16 shrink-0 rounded object-cover' loading='lazy' src={entry.presentation.image} />
                  )}
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='rounded-full bg-primary-100 px-2 py-0.5 text-xs font-black text-primary-800 black:bg-primary-950 black:text-primary-200 dark:bg-primary-800 dark:text-primary-100'>{readable(entry.state)}</span>
                      {progress && <span className='text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>{progress}</span>}
                      {entry.rating && <span className='text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>{entry.rating}/10</span>}
                      {finished && <span className='text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>Finished {finished}</span>}
                    </div>
                    <Link className='mt-1 block break-words text-base font-black text-gray-950 hover:underline black:text-white dark:text-white' to={`/worlds/${family}?${params.toString()}`}>{title}</Link>
                    {entry.presentation.author && <p className='mt-0.5 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>{entry.presentation.author}</p>}
                    {ownLibrary && entry.note && <p className='mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{entry.note}</p>}
                    {ownLibrary && (
                      <WorldObjectStateControl family={family} initialState={entry} objectUri={entry.object_uri} presentation={entry.presentation} />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default WorldObjectLibrary;

/* end of src/features/native-federation/world-object-library.tsx */
