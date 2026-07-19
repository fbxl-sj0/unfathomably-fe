/*
 * Project: Unfathomably FE
 *
 * File: native-federation/index.tsx
 *
 * Purpose:
 *   Provide a discoverable timeline for richer ActivityPub presentations
 *   received from software beyond conventional microblogging platforms.
 *
 * Responsibilities:
 *   - page through the public federated timeline without losing its cursor
 *   - select statuses that contain meaningful native presentation data
 *   - group those presentations into approachable discovery families
 *
 * This file intentionally does NOT contain:
 *   - platform-specific status rendering
 *   - ActivityPub normalization
 *   - federation transport logic
 */

import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { clearTimeline, expandNativeFederationTimeline } from '@/actions/timelines.ts';
import { useTargetSearch } from '@/api/hooks/index.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import { Column } from '@/components/ui/column.tsx';
import TargetSearchResults from '@/features/groups/components/discover/search/results.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import Timeline from '../ui/components/timeline.tsx';

import type { Status } from '@/types/entities.ts';
import NativeObjectComposer from './native-object-composer.tsx';

const TIMELINE_ID = 'native-federation';

type PresentationFamily = 'all' | 'books' | 'development' | 'models' | 'marketplace' | 'games' | 'routes' | 'culture' | 'coordination' | 'publishing';
type NativePresentation = Record<string, unknown>;

const messages = defineMessages({
  title: { id: 'column.native_federation', defaultMessage: 'Federated worlds' },
  all: { id: 'native_federation.family.all', defaultMessage: 'All' },
  books: { id: 'native_federation.family.books', defaultMessage: 'Books' },
  development: { id: 'native_federation.family.development', defaultMessage: 'Software' },
  models: { id: 'native_federation.family.models', defaultMessage: '3D models' },
  marketplace: { id: 'native_federation.family.marketplace', defaultMessage: 'Markets' },
  games: { id: 'native_federation.family.games', defaultMessage: 'Games' },
  routes: { id: 'native_federation.family.routes', defaultMessage: 'Routes' },
  culture: { id: 'native_federation.family.culture', defaultMessage: 'Culture' },
  coordination: { id: 'native_federation.family.coordination', defaultMessage: 'Coordination' },
  publishing: { id: 'native_federation.family.publishing', defaultMessage: 'Publishing' },
});

const presentationFamilies: Array<{
  id: PresentationFamily;
  message: typeof messages.all;
  pattern?: RegExp;
}> = [
  { id: 'all', message: messages.all },
  { id: 'books', message: messages.books, pattern: /bookwyrm|book|author|edition|review/ },
  { id: 'development', message: messages.development, pattern: /forgefed|forgejo|gitea|gitlab|repository|issue|merge request|pull request|commit/ },
  { id: 'models', message: messages.models, pattern: /manyfold|three.?d|3d|model|thing/ },
  { id: 'marketplace', message: messages.marketplace, pattern: /flohmarkt|marketplace|listing|offer|product/ },
  { id: 'games', message: messages.games, pattern: /castling|chess|game|move/ },
  { id: 'routes', message: messages.routes, pattern: /wanderer|route|trail|track|hike/ },
  { id: 'culture', message: messages.culture, pattern: /neodb|movie|film|album|music|podcast|performance/ },
  { id: 'coordination', message: messages.coordination, pattern: /valueflows|mutual aid|mutualaid|bonfire|intent|proposal|need|resource/ },
  { id: 'publishing', message: messages.publishing, pattern: /zenpub|commonspub|publication|document|chapter|journal|article/ },
];

const hasValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasValue);
  return value !== undefined && value !== null && value !== '' && value !== false;
};

const getPresentation = (status: Status): NativePresentation | undefined => {
  const presentation = status.pleroma?.native;
  return presentation && typeof presentation === 'object' ? presentation as NativePresentation : undefined;
};

const hasMeaningfulPresentation = (status: Status): boolean => {
  const presentation = getPresentation(status);
  if (!presentation) return false;

  const presentationClass = typeof presentation.class === 'string' ? presentation.class.toLowerCase() : '';
  if (presentationClass && presentationClass !== 'status') return false;

  const platform = typeof presentation.platform === 'string' ? presentation.platform.trim() : '';
  const metadata = presentation.metadata;
  const extraDetails = Object.entries(presentation)
    .filter(([key]) => !['class', 'type', 'platform', 'metadata'].includes(key))
    .some(([, value]) => hasValue(value));

  return platform.length > 0 || hasValue(metadata) || extraDetails;
};

const presentationMatchesFamily = (status: Status, family: PresentationFamily): boolean => {
  if (!hasMeaningfulPresentation(status)) return false;
  if (family === 'all') return true;

  const presentation = getPresentation(status);
  const familyPattern = presentationFamilies.find(item => item.id === family)?.pattern;

  if (!presentation || !familyPattern) return false;

  return familyPattern.test(JSON.stringify(presentation).toLowerCase());
};

const NativeFederationTimeline = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { account } = useOwnAccount();
  const selectedFamily = (new URLSearchParams(window.location.search).get('family') || 'all') as PresentationFamily;
  const family = presentationFamilies.some(item => item.id === selectedFamily) ? selectedFamily : 'all';
  const [targetQuery, setTargetQuery] = useState('');
  const [submittedTargetQuery, setSubmittedTargetQuery] = useState('');
  const targetSearchResult = useTargetSearch(account ? submittedTargetQuery : '');

  const next = useAppSelector(state => state.timelines.get(TIMELINE_ID)?.next);
  const isLoading = useAppSelector(state => state.timelines.get(TIMELINE_ID)?.isLoading === true);
  const hasMore = useAppSelector(state => state.timelines.get(TIMELINE_ID)?.hasMore !== false);

  const statusFilter = useCallback(
    (status: Status) => presentationMatchesFamily(status, family),
    [family],
  );

  const matchingCount = useAppSelector(state => {
    const statusIds = state.timelines.get(TIMELINE_ID)?.items;
    if (!statusIds) return 0;

    return statusIds.count(id => {
      const status = state.statuses.get(id);
      return status ? statusFilter(status) : false;
    });
  });

  const selectFamily = (nextFamily: PresentationFamily) => {
    const url = new URL(window.location.href);

    if (nextFamily === 'all') {
      url.searchParams.delete('family');
    } else {
      url.searchParams.set('family', nextFamily);
    }

    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLoadMore = (maxId: string) => {
    dispatch(expandNativeFederationTimeline({ url: next, maxId }));
  };

  const handleRefresh = () => dispatch(expandNativeFederationTimeline());

  const scanOlder = () => {
    if (next) dispatch(expandNativeFederationTimeline({ url: next }));
  };

  const submitTargetSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = targetQuery.trim();
    if (query) setSubmittedTargetQuery(query);
  };

  useEffect(() => {
    dispatch(clearTimeline(TIMELINE_ID));
    dispatch(expandNativeFederationTimeline());
  }, []);

  return (
    <Column withHeader={false} label={intl.formatMessage(messages.title)} slim>
      <section className='relative overflow-hidden border-b border-teal-200 bg-gradient-to-br from-teal-50 via-white to-amber-50 px-5 py-7 dark:border-teal-900 dark:from-teal-950 dark:via-primary-900 dark:to-amber-950 sm:px-7 sm:py-9'>
        <div className='pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-teal-200/40 dark:border-teal-700/20' />
        <div className='pointer-events-none absolute -bottom-16 right-24 h-36 w-36 rounded-full bg-amber-300/20 blur-2xl dark:bg-amber-600/10' />

        <div className='relative max-w-xl'>
          <p className='mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>
            <FormattedMessage id='native_federation.eyebrow' defaultMessage='Native federation' />
          </p>
          <h1 className='text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl'>
            <FormattedMessage id='native_federation.heading' defaultMessage='The fediverse is more than posts' />
          </h1>
          <p className='mt-3 max-w-lg text-base leading-7 text-gray-700 dark:text-gray-200'>
            <FormattedMessage
              id='native_federation.description'
              defaultMessage='Explore books, code, models, markets, games, routes, culture, and collaborative work as their native software describes them.'
            />
          </p>
        </div>
      </section>

      <section className='border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
        <div className='hide-scrollbar flex gap-2 overflow-x-auto pb-1'>
          {presentationFamilies.map(item => (
            <button
              key={item.id}
              type='button'
              aria-pressed={family === item.id}
              className={clsx(
                'shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors',
                family === item.id
                  ? 'border-teal-700 bg-teal-700 text-white shadow-sm dark:border-teal-400 dark:bg-teal-400 dark:text-gray-950'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-teal-500 hover:text-teal-700 dark:border-gray-700 dark:bg-primary-900 dark:text-gray-200 dark:hover:border-teal-500 dark:hover:text-teal-300',
              )}
              onClick={() => selectFamily(item.id)}
            >
              {intl.formatMessage(item.message)}
            </button>
          ))}
        </div>

        <div className='mt-3 flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300'>
          <span>
            <FormattedMessage
              id='native_federation.loaded_count'
              defaultMessage='{count, plural, one {# presentation loaded} other {# presentations loaded}}'
              values={{ count: matchingCount }}
            />
          </span>

          {!isLoading && matchingCount === 0 && hasMore && next && (
            <button type='button' className='font-bold text-teal-700 hover:underline dark:text-teal-300' onClick={scanOlder}>
              <FormattedMessage id='native_federation.scan_older' defaultMessage='Search older activity' />
            </button>
          )}
        </div>
      </section>

      <div className='px-4 pb-4 sm:px-5 sm:pb-5'>
        <NativeObjectComposer />
      </div>

      {matchingCount > 0 ? (
        <PullToRefresh onRefresh={handleRefresh}>
          <Timeline
            className='black:p-4 black:sm:p-5'
            scrollKey={`${TIMELINE_ID}:${family}`}
            timelineId={TIMELINE_ID}
            statusFilter={statusFilter}
            onLoadMore={handleLoadMore}
            emptyMessage={(
              <FormattedMessage
                id='native_federation.empty'
                defaultMessage='No matching native presentations are loaded yet.'
              />
            )}
          />
        </PullToRefresh>
      ) : (
        <section className='m-4 rounded-2xl border border-dashed border-teal-300 bg-teal-50/70 px-5 py-7 text-center dark:border-teal-800 dark:bg-teal-950/30 sm:m-5 sm:px-8'>
          {isLoading ? (
            <>
              <h2 className='text-lg font-bold text-gray-950 dark:text-white'>
                <FormattedMessage id='native_federation.loading_local' defaultMessage='Checking recent local activity' />
              </h2>
              <p className='mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300'>
                <FormattedMessage id='native_federation.loading_local_hint' defaultMessage='This reads the local timeline cache and does not contact remote servers.' />
              </p>
            </>
          ) : (
            <>
              <h2 className='text-xl font-black text-gray-950 dark:text-white'>
                <FormattedMessage id='native_federation.no_cached_items' defaultMessage='No native presentations are cached yet' />
              </h2>
              <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-300'>
                <FormattedMessage
                  id='native_federation.no_cached_items_hint'
                  defaultMessage='Worlds only displays activity this server has already received. Join a group or follow a source below, and compatible new activity will appear here naturally.'
                />
              </p>

              {hasMore && next && (
                <button type='button' className='mt-5 rounded-full border border-teal-700 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950' onClick={scanOlder}>
                  <FormattedMessage id='native_federation.scan_older' defaultMessage='Check older local activity' />
                </button>
              )}
            </>
          )}
        </section>
      )}

      <section className='m-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-primary-900 sm:m-5 sm:p-6'>
        <p className='text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300'>
          <FormattedMessage id='native_federation.connect.eyebrow' defaultMessage='Connect deliberately' />
        </p>
        <h2 className='mt-2 text-2xl font-black tracking-tight text-gray-950 dark:text-white'>
          <FormattedMessage id='native_federation.connect.heading' defaultMessage='Find a community or source' />
        </h2>
        <p className='mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300'>
          <FormattedMessage
            id='native_federation.connect.description'
            defaultMessage='Text searches use actors already known here. A remote lookup happens only after you explicitly submit a complete handle or HTTP(S) URL.'
          />
        </p>

        {account ? (
          <>
            <form className='mt-5 flex flex-col gap-2 sm:flex-row' onSubmit={submitTargetSearch}>
              <label className='sr-only' htmlFor='native-federation-target-search'>
                <FormattedMessage id='native_federation.connect.label' defaultMessage='Community, actor, or feed' />
              </label>
              <input
                id='native-federation-target-search'
                type='search'
                className='min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-950 outline-none ring-teal-500 placeholder:text-gray-500 focus:ring-2 dark:border-gray-700 dark:bg-primary-800 dark:text-white'
                value={targetQuery}
                placeholder='community@example.org or https://example.org/feed'
                onChange={(event) => setTargetQuery(event.target.value)}
              />
              <button
                type='submit'
                className='rounded-xl bg-amber-500 px-5 py-3 font-black text-gray-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={!targetQuery.trim() || targetSearchResult.isFetching}
              >
                <FormattedMessage id='native_federation.connect.search' defaultMessage='Find target' />
              </button>
            </form>

            {targetSearchResult.isLoading && (
              <p className='mt-5 text-sm text-gray-600 dark:text-gray-300'>
                <FormattedMessage id='native_federation.connect.searching' defaultMessage='Searching the local catalog and the submitted target...' />
              </p>
            )}

            {targetSearchResult.isError && (
              <p className='mt-5 text-sm font-semibold text-danger-600 dark:text-danger-400'>
                <FormattedMessage id='native_federation.connect.error' defaultMessage='That target could not be resolved. Nothing was followed automatically.' />
              </p>
            )}

            {submittedTargetQuery && targetSearchResult.isFetched && !targetSearchResult.isError && targetSearchResult.targets.length === 0 && (
              <p className='mt-5 text-sm text-gray-600 dark:text-gray-300'>
                <FormattedMessage id='native_federation.connect.no_results' defaultMessage='No matching group or source was found.' />
              </p>
            )}

            {targetSearchResult.targets.length > 0 && (
              <div className='mt-6 border-t border-gray-200 pt-5 dark:border-gray-800'>
                <TargetSearchResults targetSearchResult={targetSearchResult} />
              </div>
            )}
          </>
        ) : (
          <Link className='mt-5 inline-flex rounded-xl bg-amber-500 px-5 py-3 font-black text-gray-950 hover:bg-amber-400' to='/login'>
            <FormattedMessage id='native_federation.connect.sign_in' defaultMessage='Sign in to connect' />
          </Link>
        )}

        <div className='mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-5 text-sm font-bold dark:border-gray-800'>
          <Link className='text-teal-700 hover:underline dark:text-teal-300' to='/groups/discover'>
            <FormattedMessage id='native_federation.connect.browse_groups' defaultMessage='Browse known groups' />
          </Link>
          <Link className='text-teal-700 hover:underline dark:text-teal-300' to='/feeds/my'>
            <FormattedMessage id='native_federation.connect.manage_sources' defaultMessage='Manage feeds and sources' />
          </Link>
        </div>
      </section>
    </Column>
  );
};

export default NativeFederationTimeline;

/* end of native-federation/index.tsx */
