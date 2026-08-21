/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/world-object-state-control.tsx

  Purpose:
    Provide native-domain save, progress, and completion controls for Worlds.

  Responsibilities:
    - present family-appropriate state choices instead of generic metadata
    - keep progress, ratings, and notes private unless the user opts in
    - update the shared object-state cache after every mutation
    - use the configured theme rather than a fixed light panel

  This file intentionally does not change an author's listing or project state
  and does not publish a social status.
*/

import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import {
  safeWorldObjectUri,
  useWorldObjectState,
  worldObjectStateQueryKey,
  worldObjectStateResponseSchema,
  type WorldObjectState,
  type WorldObjectStateResponse,
} from '@/api/hooks/discovery/useWorldObjectState.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

interface WorldObjectStateControlProps {
  family: string;
  initialState?: WorldObjectState;
  objectUri: string;
  presentation?: Record<string, unknown>;
}

const fallbackStates: Record<string, string[]> = {
  audio: ['queued', 'listening', 'listened'],
  video: ['watchlist', 'watching', 'watched'],
  longform: ['saved', 'reading', 'finished'],
  photo: ['saved'],
  bookmarks: ['saved'],
  groups: ['following'],
  events: ['saved', 'interested', 'going', 'attended'],
  development: ['watching', 'active', 'completed'],
  models: ['saved', 'printing', 'printed'],
  marketplace: ['watching', 'contacted', 'closed'],
  games: ['saved', 'active', 'completed'],
  routes: ['saved', 'planned', 'completed'],
  culture: ['wishlist', 'progress', 'complete', 'dropped'],
  coordination: ['watching', 'helping', 'completed'],
  publishing: ['saved', 'reading', 'finished'],
  local: ['saved'],
  generic: ['saved'],
};

const progressUnits = ['percent', 'page', 'chapter', 'episode', 'minute', 'hour', 'item', 'move', 'kilometre', 'mile'];
const progressFamilies = new Set(['audio', 'video', 'longform', 'culture', 'publishing', 'routes', 'games']);
const ratingFamilies = new Set(['culture', 'audio', 'video', 'games']);

const stateLabel = (state: string): string => state.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const firstActionLabel = (family: string): string => {
  switch (family) {
    case 'audio': return 'Add to queue';
    case 'video': return 'Watch later';
    case 'events': return 'Save event';
    case 'development': return 'Watch project';
    case 'models': return 'Save model';
    case 'marketplace': return 'Watch listing';
    case 'routes': return 'Save route';
    case 'coordination': return 'Follow task';
    case 'culture': return 'Add to list';
    default: return 'Save';
  }
};

const presentationSnapshot = (presentation?: Record<string, unknown>): Record<string, string> => {
  const keys = ['title', 'subtitle', 'author', 'image', 'media_url', 'source_host', 'duration'];

  return Object.fromEntries(keys.flatMap((key) => {
    const value = presentation?.[key];
    return typeof value === 'string' && value.length <= 2_048 ? [[key, value]] : [];
  }));
};

const optionalNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const WorldObjectStateControl: React.FC<WorldObjectStateControlProps> = ({ family, initialState, objectUri, presentation }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { account } = useOwnAccount();
  const supported = Boolean(fallbackStates[family]) && family !== 'books' && safeWorldObjectUri(objectUri);
  const initialData = initialState
    ? { allowed_states: fallbackStates[family] || [], state: initialState }
    : undefined;
  const query = useWorldObjectState(objectUri, family, Boolean(account) && supported && !initialState, initialData);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState('');
  const [progress, setProgress] = useState('');
  const [progressTotal, setProgressTotal] = useState('');
  const [progressUnit, setProgressUnit] = useState('percent');
  const [rating, setRating] = useState('');
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowedStates = useMemo(
    () => query.data?.allowed_states.length ? query.data.allowed_states : fallbackStates[family] || [],
    [family, query.data?.allowed_states],
  );

  useEffect(() => {
    const current = query.data?.state;
    setState(current?.state || allowedStates[0] || '');
    setProgress(current?.progress === null || current?.progress === undefined ? '' : String(current.progress));
    setProgressTotal(current?.progress_total === null || current?.progress_total === undefined ? '' : String(current.progress_total));
    setProgressUnit(current?.progress_unit || 'percent');
    setRating(current?.rating === null || current?.rating === undefined ? '' : String(current.rating));
    setNote(current?.note || '');
    setIsPublic(current?.public || false);
  }, [allowedStates, query.data?.state]);

  const saveMutation = useMutation({
    mutationFn: async (nextState?: string) => {
      const response = await api.put('/api/v1/discovery/native-objects/state', {
        family,
        note: note || null,
        object_uri: objectUri,
        presentation: presentationSnapshot(presentation),
        progress: optionalNumber(progress),
        progress_total: optionalNumber(progressTotal),
        progress_unit: progress.trim() ? progressUnit : null,
        public: isPublic,
        rating: optionalNumber(rating),
        state: nextState || state || allowedStates[0],
      });
      return worldObjectStateResponseSchema.parse(await response.json());
    },
    onMutate: () => setError(null),
    onSuccess: (data: WorldObjectStateResponse) => {
      queryClient.setQueryData(worldObjectStateQueryKey(objectUri), data);
      setExpanded(false);
    },
    onError: (cause: Error) => setError(cause.message || 'The workspace state could not be saved.'),
  });

  const removeMutation = useMutation({
    mutationFn: async () => api.delete('/api/v1/discovery/native-objects/state', { searchParams: { object_uri: objectUri } }),
    onMutate: () => setError(null),
    onSuccess: () => {
      queryClient.setQueryData(worldObjectStateQueryKey(objectUri), {
        allowed_states: allowedStates,
        state: null,
      });
      setExpanded(false);
    },
    onError: (cause: Error) => setError(cause.message || 'The workspace state could not be removed.'),
  });

  if (!account || !supported || allowedStates.length === 0) return null;

  const current = query.data?.state;
  const busy = saveMutation.isPending || removeMutation.isPending;

  return (
    <div className='my-2' data-testid='world-object-state-control'>
      <button
        className={clsx(
          'rounded-md border border-solid px-3 py-1.5 text-sm font-semibold',
          current
            ? 'border-primary-400 bg-primary-100 text-primary-900 black:border-primary-700 black:bg-primary-950/50 black:text-primary-100 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-100'
            : 'border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50 black:border-primary-700 black:text-primary-300 black:hover:bg-primary-950/40 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950/40',
        )}
        disabled={busy || query.isFetching}
        onClick={() => current ? setExpanded(value => !value) : saveMutation.mutate(allowedStates[0])}
        type='button'
      >
        {current ? stateLabel(current.state) : firstActionLabel(family)}
      </button>

      {current && (
        <button
          className='ml-2 px-2 py-1.5 text-sm font-semibold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300'
          onClick={() => setExpanded(value => !value)}
          type='button'
        >
          {expanded
            ? <FormattedMessage id='world_object_state.close' defaultMessage='Close' />
            : <FormattedMessage id='world_object_state.update' defaultMessage='Update' />}
        </button>
      )}

      {expanded && (
        <div className='mt-2 border-l-2 border-primary-500 px-3 py-2 text-sm'>
          <div className='flex flex-wrap gap-2'>
            <label className='min-w-40 flex-1 font-semibold text-gray-900 black:text-white dark:text-gray-100'>
              <FormattedMessage id='world_object_state.state' defaultMessage='State' />
              <select
                className='mt-1 block w-full rounded-md border border-primary-300 bg-transparent px-2 py-1.5 text-gray-950 black:border-primary-700 black:text-white dark:border-primary-700 dark:text-white'
                onInput={event => setState(event.currentTarget.value)}
                value={state}
              >
                {allowedStates.map(option => <option className='bg-primary-950 text-white' key={option} value={option}>{stateLabel(option)}</option>)}
              </select>
            </label>

            {progressFamilies.has(family) && (
              <>
                <label className='min-w-24 flex-1 font-semibold text-gray-900 black:text-white dark:text-gray-100'>
                  <FormattedMessage id='world_object_state.progress' defaultMessage='Progress' />
                  <input className='mt-1 block w-full rounded-md border border-primary-300 bg-transparent px-2 py-1.5 black:border-primary-700 dark:border-primary-700' min='0' onChange={event => setProgress(event.target.value)} type='number' value={progress} />
                </label>
                <label className='min-w-24 flex-1 font-semibold text-gray-900 black:text-white dark:text-gray-100'>
                  <FormattedMessage id='world_object_state.total' defaultMessage='Total' />
                  <input className='mt-1 block w-full rounded-md border border-primary-300 bg-transparent px-2 py-1.5 black:border-primary-700 dark:border-primary-700' min='0' onChange={event => setProgressTotal(event.target.value)} type='number' value={progressTotal} />
                </label>
                <label className='min-w-32 flex-1 font-semibold text-gray-900 black:text-white dark:text-gray-100'>
                  <FormattedMessage id='world_object_state.unit' defaultMessage='Unit' />
                  <select className='mt-1 block w-full rounded-md border border-primary-300 bg-transparent px-2 py-1.5 black:border-primary-700 dark:border-primary-700' onInput={event => setProgressUnit(event.currentTarget.value)} value={progressUnit}>
                    {progressUnits.map(unit => <option className='bg-primary-950 text-white' key={unit} value={unit}>{stateLabel(unit)}</option>)}
                  </select>
                </label>
              </>
            )}
          </div>

          {ratingFamilies.has(family) && (
            <label className='mt-2 block font-semibold text-gray-900 black:text-white dark:text-gray-100'>
              <FormattedMessage id='world_object_state.rating' defaultMessage='Rating out of 10' />
              <input className='mt-1 block w-28 rounded-md border border-primary-300 bg-transparent px-2 py-1.5 black:border-primary-700 dark:border-primary-700' max='10' min='1' onChange={event => setRating(event.target.value)} type='number' value={rating} />
            </label>
          )}

          <label className='mt-2 block font-semibold text-gray-900 black:text-white dark:text-gray-100'>
            <FormattedMessage id='world_object_state.private_note' defaultMessage='Private note' />
            <textarea className='mt-1 block min-h-20 w-full rounded-md border border-primary-300 bg-transparent px-2 py-1.5 black:border-primary-700 dark:border-primary-700' maxLength={5000} onChange={event => setNote(event.target.value)} value={note} />
          </label>

          <label className='mt-2 flex items-center gap-2 text-gray-700 black:text-gray-200 dark:text-gray-200'>
            <input checked={isPublic} onChange={event => setIsPublic(event.target.checked)} type='checkbox' />
            <FormattedMessage id='world_object_state.public' defaultMessage='Show this participation on my public Worlds profile' />
          </label>

          {error && <p className='mt-2 font-semibold text-danger-600'>{error}</p>}

          <div className='mt-3 flex flex-wrap gap-2'>
            <button className='rounded-md bg-primary-600 px-3 py-1.5 font-bold text-white hover:bg-primary-500' disabled={busy} onClick={() => saveMutation.mutate(undefined)} type='button'><FormattedMessage id='world_object_state.save' defaultMessage='Save' /></button>
            <button className='rounded-md border border-danger-500 px-3 py-1.5 font-bold text-danger-600 hover:bg-danger-50 black:hover:bg-danger-950/30 dark:hover:bg-danger-950/30' disabled={busy} onClick={() => removeMutation.mutate()} type='button'><FormattedMessage id='world_object_state.remove' defaultMessage='Remove' /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldObjectStateControl;

/* end of src/components/world-object-state-control.tsx */
