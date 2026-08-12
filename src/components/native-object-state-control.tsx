/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/native-object-state-control.tsx

  Purpose:

    Let authors advance supported native objects through meaningful states.

  Responsibilities:

    * derive the bounded state vocabulary from native object shape
    * keep remote and non-owned objects read-only
    * send state changes through the dedicated backend lifecycle endpoint
    * present current state in plain language using the configured theme

  This file intentionally does NOT edit arbitrary ActivityPub properties or
  invent lifecycle actions for object families without a safe backend model.
*/

import { useMutation } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

interface NativePresentation {
  fields?: Record<string, unknown> | null;
  type?: string | null;
}

interface INativeObjectStateControl {
  authorAccountId?: string;
  native: NativePresentation;
  statusId?: string;
}

const STATE_OPTIONS: Record<string, Array<[string, string]>> = {
  coordination: [
    ['open', 'Open'],
    ['in_progress', 'In progress'],
    ['fulfilled', 'Fulfilled'],
    ['closed', 'Closed'],
  ],
  games: [
    ['planned', 'Planned'],
    ['active', 'Active'],
    ['complete', 'Complete'],
    ['abandoned', 'Abandoned'],
  ],
  markets: [
    ['available', 'Available'],
    ['reserved', 'Reserved'],
    ['sold', 'Sold'],
    ['withdrawn', 'Withdrawn'],
  ],
  software: [
    ['open', 'Open'],
    ['in_progress', 'In progress'],
    ['resolved', 'Resolved'],
    ['closed', 'Closed'],
  ],
  software_project: [
    ['active', 'Active'],
    ['maintenance', 'Maintenance'],
    ['archived', 'Archived'],
  ],
};

const familyFromShape = (native: NativePresentation): string | null => {
  const fields = native.fields || {};
  const family = String(fields.family || '').toLowerCase();
  const kind = String(fields.kind || '').toLowerCase();
  const platform = String(fields.platform || '').toLowerCase();
  const type = String(native.type || '').toLowerCase();

  if (family === 'software' && kind === 'software_project') return 'software_project';
  if (STATE_OPTIONS[family]) return family;
  if (platform === 'flohmarkt' || fields.price !== undefined || fields.listing_name !== undefined) return 'markets';
  if (['ticket', 'issue', 'repository'].some((value) => type.includes(value))) return 'software';
  if (fields.action !== undefined || ['intent', 'proposal', 'economic'].some((value) => type.includes(value))) return 'coordination';

  return null;
};

const labelFor = (options: Array<[string, string]>, state: string) =>
  options.find(([value]) => value === state)?.[1] || state.replaceAll('_', ' ');

interface INativeObjectStateEditor {
  authorAccountId: string;
  options: Array<[string, string]>;
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  setState: React.Dispatch<React.SetStateAction<string>>;
  state: string;
  statusId: string;
}

const NativeObjectStateEditor: React.FC<INativeObjectStateEditor> = ({
  authorAccountId,
  options,
  selected,
  setSelected,
  setState,
  state,
  statusId,
}) => {
  const api = useApi();
  const { account } = useOwnAccount();

  const transition = useMutation({
    mutationFn: async (nextState: string) => {
      const response = await api.patch(`/api/v1/discovery/native-objects/${statusId}/state`, {
        json: { state: nextState },
      });

      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'The state could not be changed');
      }

      return nextState;
    },
    mutationKey: ['native-object-state', statusId],
    scope: { id: `native-object-state:${statusId}` },
    onMutate: (nextState) => {
      const previousState = state;
      setState(nextState);
      setSelected(nextState);
      return { previousState };
    },
    onError: (_error, _nextState, context) => {
      if (context) {
        setState(context.previousState);
        setSelected(context.previousState);
      }
    },
  });

  if (account?.id !== authorAccountId) return null;

  return (
    <>
      <label className='sr-only' htmlFor={`native-state-${statusId}`}>Change state</label>
      <select
        className='min-w-32 rounded-md border-gray-300 bg-white py-1 text-sm text-gray-900 black:border-gray-700 black:bg-black black:text-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
        id={`native-state-${statusId}`}
        onChange={(event) => setSelected(event.target.value)}
        value={selected}
      >
        {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button
        className='rounded-md bg-primary-600 px-3 py-1 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
        disabled={transition.isPending || selected === state}
        onClick={() => transition.mutate(selected)}
        type='button'
      >
        {transition.isPending ? 'Saving...' : 'Update state'}
      </button>
      {transition.error ? <span className='text-danger-600'>{transition.error.message}</span> : null}
    </>
  );
};

const NativeObjectStateControl: React.FC<INativeObjectStateControl> = ({ authorAccountId, native, statusId }) => {
  const family = useMemo(() => familyFromShape(native), [native]);
  const options = family ? STATE_OPTIONS[family] : undefined;
  const initialState = String(
    (family === 'software_project' ? native.fields?.project_status : native.fields?.state)
    || options?.[0]?.[0]
    || '',
  );
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState(initialState);

  if (!options) return null;

  return (
    <div className='mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/40 px-3 py-2 text-sm dark:border-primary-800 dark:bg-primary-900/20'>
      <span className='font-medium text-gray-700 black:text-gray-200 dark:text-gray-200'>State</span>
      <span className='rounded-full bg-primary-100 px-2 py-0.5 font-semibold text-primary-700 dark:bg-primary-800 dark:text-primary-100'>
        {labelFor(options, state)}
      </span>
      {statusId && authorAccountId ? (
        <NativeObjectStateEditor
          authorAccountId={authorAccountId}
          options={options}
          selected={selected}
          setSelected={setSelected}
          setState={setState}
          state={state}
          statusId={statusId}
        />
      ) : null}
    </div>
  );
};

export default NativeObjectStateControl;

/* end of src/components/native-object-state-control.tsx */
