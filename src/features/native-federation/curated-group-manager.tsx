/*
 * Project: Unfathomably FE
 *
 * File: curated-group-manager.tsx
 *
 * Purpose:
 *   Let administrators feature useful remote communities in Worlds discovery.
 *
 * Responsibilities:
 *   - accept a remote Group handle or actor URL
 *   - make remote ownership and enabled state unambiguous
 *   - provide confirmation before permanent removal
 *   - provide compact ordering controls without a separate admin application
 *
 * This file intentionally does not follow Groups or infer actor types.
 */

import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useFederatedTargetCurations } from '@/api/hooks/admin/useFederatedTargetCurations.ts';

const CuratedGroupManager: React.FC = () => {
  const intl = useIntl();
  const [identifier, setIdentifier] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    data = [],
    isError,
    isFetching,
    addCuration,
    isCreating,
    updateCuration,
    isUpdating,
    removeCuration,
    isRemoving,
  } = useFederatedTargetCurations();
  const busy = isCreating || isUpdating || isRemoving;
  const curations = useMemo(
    () => [...data].sort((left, right) => left.position - right.position || left.id.localeCompare(right.id)),
    [data],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!value || busy) return;

    setActionError(null);

    try {
      await addCuration(value);
      setIdentifier('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : intl.formatMessage({ id: 'worlds.groups.curated.add_error', defaultMessage: 'That remote Group could not be featured.' }));
    }
  };

  const changeState = async (id: string, enabled: boolean) => {
    setActionError(null);

    try {
      await updateCuration({ id, enabled });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : intl.formatMessage({ id: 'worlds.groups.curated.update_error', defaultMessage: 'The featured Group could not be updated.' }));
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= curations.length || busy) return;

    const current = curations[index];
    const adjacent = curations[destination];
    const currentPosition = current.position === adjacent.position ? index * 10 : current.position;
    const adjacentPosition = current.position === adjacent.position ? destination * 10 : adjacent.position;
    setActionError(null);

    try {
      await Promise.all([
        updateCuration({ id: current.id, position: adjacentPosition }),
        updateCuration({ id: adjacent.id, position: currentPosition }),
      ]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : intl.formatMessage({ id: 'worlds.groups.curated.reorder_error', defaultMessage: 'The featured Groups could not be reordered.' }));
    }
  };

  const remove = async (id: string, name: string) => {
    const confirmed = window.confirm(intl.formatMessage(
      { id: 'worlds.groups.curated.remove_confirm', defaultMessage: 'Stop featuring {name}? This does not unfollow or delete the remote Group.' },
      { name },
    ));

    if (!confirmed || busy) return;
    setActionError(null);

    try {
      await removeCuration(id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : intl.formatMessage({ id: 'worlds.groups.curated.remove_error', defaultMessage: 'The featured Group could not be removed.' }));
    }
  };

  return (
    <details className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <summary className='cursor-pointer px-4 py-4 text-sm font-black text-gray-950 hover:text-primary-700 black:text-white black:hover:text-primary-300 dark:text-white dark:hover:text-primary-300 sm:px-5'>
        <FormattedMessage id='worlds.groups.curated.heading' defaultMessage='Feature remote communities' />
      </summary>

      <div className='border-t border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
        <p className='max-w-2xl text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage id='worlds.groups.curated.description' defaultMessage='Featured communities appear first when people browse known Groups. Featuring does not follow a community or make it local.' />
        </p>

        <form className='mt-4 flex flex-col gap-2 sm:flex-row' onSubmit={submit}>
          <label className='sr-only' htmlFor='curated-group-identifier'>
            <FormattedMessage id='worlds.groups.curated.identifier' defaultMessage='Remote Group handle or actor URL' />
          </label>
          <input
            id='curated-group-identifier'
            type='text'
            maxLength={2048}
            className='min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-950 outline-none ring-primary-500 placeholder:text-gray-500 focus:ring-2 black:border-gray-700 black:bg-black black:text-white black:placeholder:text-gray-400 dark:border-gray-700 dark:bg-primary-800 dark:text-white'
            value={identifier}
            placeholder='@community@example.org or https://example.org/c/community'
            onChange={event => setIdentifier(event.target.value)}
          />
          <button
            type='submit'
            disabled={!identifier.trim() || busy}
            className='rounded-lg bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FormattedMessage id='worlds.groups.curated.add' defaultMessage='Feature' />
          </button>
        </form>

        {(isError || actionError) && (
          <p role='alert' className='mt-3 text-sm font-semibold text-danger-600 black:text-danger-400 dark:text-danger-400'>
            {actionError || <FormattedMessage id='worlds.groups.curated.load_error' defaultMessage='Featured Groups could not be loaded.' />}
          </p>
        )}

        {!isFetching && curations.length === 0 && !isError && (
          <p className='mt-4 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
            <FormattedMessage id='worlds.groups.curated.empty' defaultMessage='No remote communities are featured yet.' />
          </p>
        )}

        {curations.length > 0 && (
          <ul className='mt-4 divide-y divide-gray-200 border-y border-gray-200 black:divide-gray-800 black:border-gray-800 dark:divide-gray-800 dark:border-gray-800'>
            {curations.map((curation, index) => {
              const name = curation.target.display_name || curation.target.domain || curation.target.ap_id;

              return (
                <li key={curation.id} className='flex flex-col gap-3 py-3 sm:flex-row sm:items-center'>
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    <img className='size-10 shrink-0 rounded-full object-cover' src={curation.target.avatar} alt='' />
                    <div className='min-w-0'>
                      <p className='truncate font-bold text-gray-950 black:text-white dark:text-white'>{name}</p>
                      <p className='truncate text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
                        <FormattedMessage id='worlds.groups.curated.remote_on' defaultMessage='Remote community on {domain}' values={{ domain: curation.target.domain || curation.target.ap_id }} />
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold'>
                    <button type='button' disabled={busy || index === 0} className='text-primary-700 hover:underline disabled:opacity-40 black:text-primary-300 dark:text-primary-300' onClick={() => void move(index, -1)}>
                      <FormattedMessage id='worlds.groups.curated.up' defaultMessage='Up' />
                    </button>
                    <button type='button' disabled={busy || index === curations.length - 1} className='text-primary-700 hover:underline disabled:opacity-40 black:text-primary-300 dark:text-primary-300' onClick={() => void move(index, 1)}>
                      <FormattedMessage id='worlds.groups.curated.down' defaultMessage='Down' />
                    </button>
                    <button type='button' disabled={busy} className='text-primary-700 hover:underline disabled:opacity-40 black:text-primary-300 dark:text-primary-300' onClick={() => void changeState(curation.id, !curation.enabled)}>
                      {curation.enabled
                        ? <FormattedMessage id='worlds.groups.curated.hide' defaultMessage='Hide' />
                        : <FormattedMessage id='worlds.groups.curated.show' defaultMessage='Show' />}
                    </button>
                    <button type='button' disabled={busy} className='text-danger-600 hover:underline disabled:opacity-40 black:text-danger-400 dark:text-danger-400' onClick={() => void remove(curation.id, name)}>
                      <FormattedMessage id='worlds.groups.curated.remove' defaultMessage='Remove' />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
};

export default CuratedGroupManager;

/* end of curated-group-manager.tsx */
