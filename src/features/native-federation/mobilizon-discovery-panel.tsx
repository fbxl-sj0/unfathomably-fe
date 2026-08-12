/*
 * Unfathomably Mobilizon discovery panel
 * --------------------------------------
 *
 * File: mobilizon-discovery-panel.tsx
 *
 * Purpose:
 *   Make public Mobilizon events and organizer groups discoverable as distinct,
 *   useful ActivityPub objects.
 *
 * Responsibilities:
 *   - provide explicit event and organizer search modes
 *   - present venue, attendance, access, and organizer context
 *   - connect stable ActivityPub identifiers to the local resolver
 *
 * This file intentionally does not imply attendance, follow actors
 * automatically, or treat an organizer group as an ordinary user profile.
 */

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import {
  useMobilizonDiscovery,
  type MobilizonDiscoveryItem,
  type MobilizonDiscoveryMode,
  type MobilizonEventDiscoveryItem,
  type MobilizonOrganizerDiscoveryItem,
} from '@/api/hooks/discovery/useMobilizonDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface MobilizonDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const modes: Array<{ id: MobilizonDiscoveryMode; label: string }> = [
  { id: 'events', label: 'Events' },
  { id: 'organizers', label: 'Organizers' },
];

const eventTime = (item: MobilizonEventDiscoveryItem, locale: string): string | undefined => {
  if (!item.begins_at) return undefined;

  const beginsAt = new Date(item.begins_at);
  if (Number.isNaN(beginsAt.getTime())) return undefined;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(beginsAt);
};

const eventCapacity = (item: MobilizonEventDiscoveryItem): string | undefined => {
  if (item.capacity <= 0) {
    return item.participant_count > 0 ? `${item.participant_count} participating` : undefined;
  }

  const remaining = typeof item.remaining_capacity === 'number'
    ? `, ${item.remaining_capacity} remaining`
    : '';

  return `${item.participant_count} participating, capacity ${item.capacity}${remaining}`;
};

const EventCard: React.FC<{ item: MobilizonEventDiscoveryItem; locale: string }> = ({ item, locale }) => {
  const time = eventTime(item, locale);
  const capacity = eventCapacity(item);

  return (
    <NativeDiscoveryArticle item={item} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
      {item.image_url && <img src={item.image_url} alt='' loading='lazy' className='h-36 w-full bg-black object-cover' />}
      <div className='pt-4'>
        <div className='flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>
          {item.category && <span>{item.category.toLowerCase()}</span>}
          {item.is_online && <span>online</span>}
          {item.language && <span>{item.language}</span>}
        </div>
        <h3 className='mt-1 text-lg font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
        {time && <p className='mt-2 text-sm font-bold text-gray-800 black:text-gray-200 dark:text-gray-100'>{time}</p>}
        {(item.venue_name || item.venue_address) && (
          <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
            {[item.venue_name, item.venue_address].filter(Boolean).join(' / ')}
          </p>
        )}
        {item.organizer_name && (
          <p className='mt-2 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>
            <span className='font-bold'>Organizer:</span> {item.organizer_name}
          </p>
        )}
        {capacity && <p className='mt-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>{capacity}</p>}
        {item.tags.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-1.5'>
            {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
          </div>
        )}
        <p className='mt-3 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <Link to={nativeResolvePath('events', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
            <FormattedMessage id='native_discovery.events.resolve' defaultMessage='Open, RSVP, and discuss' />
          </Link>
          <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
            <FormattedMessage id='native_discovery.events.view' defaultMessage='Open original' />
          </a>
          {item.organizer_url && (
            <Link to={nativeResolvePath('events', item.organizer_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
              <FormattedMessage id='native_discovery.events.organizer' defaultMessage='Open organizer' />
            </Link>
          )}
        </div>
      </div>
    </NativeDiscoveryArticle>
  );
};

const OrganizerCard: React.FC<{ item: MobilizonOrganizerDiscoveryItem }> = ({ item }) => (
  <NativeDiscoveryArticle item={item} className='flex gap-3 bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
    {item.image_url ? (
      <img src={item.image_url} alt='' loading='lazy' className='h-16 w-16 shrink-0 rounded-xl bg-black object-cover' />
    ) : (
      <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-100 black:bg-primary-900 text-xl font-black text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
        {item.title.slice(0, 1).toUpperCase()}
      </div>
    )}
    <div className='min-w-0 flex-1'>
      <h3 className='text-lg font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
      {item.handle && <p className='truncate text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.handle}</p>}
      {item.summary && <p className='mt-2 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
      <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
        {item.member_count > 0 && <span>{item.member_count} members</span>}
        {item.openness && <span>{item.openness.replaceAll('_', ' ')}</span>}
        {item.manually_approves_followers && <span>follow approval required</span>}
        {item.language && <span>{item.language}</span>}
      </div>
      <p className='mt-2 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
      <div className='mt-3 flex flex-wrap gap-2'>
        <Link to={nativeResolvePath('events', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
          <FormattedMessage id='native_discovery.events.resolve_organizer' defaultMessage='Open and follow here' />
        </Link>
        <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
          <FormattedMessage id='native_discovery.events.view_organizer' defaultMessage='Open original' />
        </a>
      </div>
    </div>
  </NativeDiscoveryArticle>
);

const ResultCard: React.FC<{ item: MobilizonDiscoveryItem; locale: string }> = ({ item, locale }) =>
  item.kind === 'event'
    ? <EventCard item={item} locale={locale} />
    : <OrganizerCard item={item} />;

const MobilizonDiscoveryPanel: React.FC<MobilizonDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [mode, setMode] = useState<MobilizonDiscoveryMode>('events');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [submittedMode, setSubmittedMode] = useState<MobilizonDiscoveryMode | null>(null);
  const [offset, setOffset] = useState(0);
  const visible = enabled && family === 'events';
  const hasCurrentSearch = submittedQuery.length >= 2 && submittedMode === mode;
  const result = useMobilizonDiscovery(mode, submittedQuery, offset, visible && hasCurrentSearch);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().slice(0, 200);
    if (normalized.length < 2) return;

    setOffset(0);
    setSubmittedQuery(normalized);
    setSubmittedMode(mode);
  };

  const selectMode = (nextMode: MobilizonDiscoveryMode) => {
    setMode(nextMode);
    setOffset(0);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
              <FormattedMessage id='native_discovery.mobilizon.title' defaultMessage='Events and organizers across Mobilizon' />
            </h2>
            <p className='mt-1 max-w-3xl text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
              <FormattedMessage id='native_discovery.mobilizon.description' defaultMessage='Find events and organizers. Open a result to see its date, place, discussion, and attendance options.' />
            </p>
          </div>

        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {modes.map(item => (
            <button
              key={item.id}
              type='button'
              aria-pressed={mode === item.id}
              className={mode === item.id ? 'rounded-full bg-primary-600 px-3 py-1.5 text-sm font-black text-white' : 'rounded-full border border-gray-300 black:border-gray-700 px-3 py-1.5 text-sm font-bold text-gray-700 black:text-gray-200 hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-gray-200 dark:hover:text-primary-300'}
              onClick={() => selectMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <NativeDiscoverySearchForm
          disabled={query.trim().length < 2}
          id='native-mobilizon-discovery-search'
          label={<FormattedMessage id='native_discovery.mobilizon.search_label' defaultMessage='Search events or organizers' />}
          value={query}
          placeholder={mode === 'events' ? 'Search event names, categories, or tags' : 'Search organizer names and descriptions'}
          submitLabel={<FormattedMessage id='native_discovery.mobilizon.search' defaultMessage='Search Mobilizon' />}
          onChange={setQuery}
          onSubmit={submit}
        />
      </div>

      {!hasCurrentSearch ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.mobilizon.start' defaultMessage='Enter a search when you are ready. No background crawl is performed, and search results are not followed automatically.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(item => item.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.mobilizon.error' defaultMessage='Mobilizon search is temporarily unavailable. Events already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.mobilizon.empty' defaultMessage='No public Mobilizon records matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => <ResultCard key={item.id} item={item} locale={intl.locale} />)}
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

export default MobilizonDiscoveryPanel;

/* end of mobilizon-discovery-panel.tsx */
