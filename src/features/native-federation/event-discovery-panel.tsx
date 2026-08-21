/*
 * Unfathomably federated event discovery panel
 * ---------------------------------------------
 *
 * File: event-discovery-panel.tsx
 *
 * Purpose:
 *   Present outside event discovery as an understandable event workflow.
 *
 * Responsibilities:
 *   - browse and search upcoming federated events
 *   - show time, venue, organizer, capacity, and origin at a glance
 *   - lead into verified local RSVP, discussion, and organizer workflows
 *
 * This file intentionally does not claim an RSVP until the originating event
 * platform confirms one. External registration remains at the source when it
 * is advertised explicitly by the event.
 */

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useEventDiscovery } from '@/api/hooks/discovery/useEventDiscovery.ts';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';

import type { EventDiscoveryItem } from '@/api/hooks/discovery/useEventDiscovery.ts';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface EventDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const eventPlace = (event: EventDiscoveryItem): string => {
  const physical = [
    event.location.name,
    event.location.street_address,
    event.location.locality,
    event.location.region,
    event.location.country,
  ]
    .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
    .join(', ');

  if (event.online && physical) return `Hybrid / ${physical}`;
  if (event.online) return 'Online';
  return physical || 'Location not provided';
};

const lifecycleLabel = (event: EventDiscoveryItem): string => {
  switch (event.lifecycle) {
    case 'ongoing': return 'Happening now';
    case 'tentative': return 'Date not confirmed';
    case 'postponed': return 'Postponed';
    case 'rescheduled': return 'Rescheduled';
    case 'cancelled': return 'Cancelled';
    case 'past': return 'Ended';
    case 'unknown': return event.status || 'Schedule available';
    default: return 'Upcoming';
  }
};

const accessLabel = (event: EventDiscoveryItem): string | null => {
  switch (event.join_mode) {
    case 'free': return 'Attendance open at source';
    case 'restricted': return 'Attendance requires approval';
    case 'invite': return 'Invitation only';
    default: return null;
  }
};

const localAttendanceActionLabel = (event: EventDiscoveryItem): string => {
  if (event.lifecycle === 'cancelled') return 'View cancellation details';
  if (event.remaining_capacity === 0 && typeof event.capacity === 'number' && event.capacity > 0) return 'View full event';

  switch (event.join_mode) {
    case 'free': return 'Open and RSVP here';
    case 'restricted': return 'Request attendance here';
    case 'invite': return 'Open invitation here';
    default: return 'Open event here';
  }
};

const repliesModerationLabel = (event: EventDiscoveryItem): string | null => {
  if (event.comments_enabled === false) return 'Comments closed';

  switch (event.replies_moderation) {
    case 'moderated': return 'Comments are moderated';
    case 'closed': return 'Comments closed';
    case 'allow_all': return null;
    default: return event.replies_moderation
      ? `Comments: ${event.replies_moderation.replace(/[_-]+/g, ' ')}`
      : null;
  }
};

const calendarEscape = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const calendarTimestamp = (value: string): string => new Date(value)
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d{3}Z$/, 'Z');

const downloadCalendarEvent = (event: EventDiscoveryItem) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unfathomably//Federated Event//EN',
    'BEGIN:VEVENT',
    `UID:${calendarEscape(event.activitypub_url)}`,
    `DTSTAMP:${calendarTimestamp(new Date().toISOString())}`,
    `DTSTART:${calendarTimestamp(event.begins_at)}`,
    event.ends_at ? `DTEND:${calendarTimestamp(event.ends_at)}` : null,
    `SUMMARY:${calendarEscape(event.title)}`,
    `LOCATION:${calendarEscape(eventPlace(event))}`,
    `DESCRIPTION:${calendarEscape([event.summary, event.url].filter(Boolean).join('\n\n'))}`,
    `URL:${calendarEscape(event.url)}`,
    event.lifecycle === 'cancelled' ? 'STATUS:CANCELLED' : null,
    event.lifecycle === 'tentative' ? 'STATUS:TENTATIVE' : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line));
  const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = `${event.title.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'event'}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const EventDiscoveryPanel: React.FC<EventDiscoveryPanelProps> = ({ enabled, family }) => {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [showAgenda, setShowAgenda] = useState(false);
  const visible = enabled && (family === 'all' || family === 'events');
  const result = useEventDiscovery(submittedQuery, offset, visible);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSubmittedQuery(query.trim());
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.event.title' defaultMessage='Upcoming events connected to this server' />}
        description={<FormattedMessage id='native_discovery.event.description' defaultMessage='Browse public events received from Mobilizon, Gancio, and compatible communities. Open one here to RSVP, discuss it, follow its organizer, or add it to your calendar.' />}
        id='native-event-discovery-search'
        label={<FormattedMessage id='native_discovery.event.search_label' defaultMessage='Search upcoming events' />}
        value={query}
        maxLength={200}
        placeholder='Search event titles and descriptions'
        submitLabel={<FormattedMessage id='native_discovery.event.search' defaultMessage='Search events' />}
        secondaryLabel={submittedQuery
          ? <FormattedMessage id='native_discovery.event.clear' defaultMessage='Show all' />
          : undefined}
        onChange={setQuery}
        onSecondary={() => {
          setQuery('');
          setSubmittedQuery('');
          setOffset(0);
        }}
        onSubmit={submit}
      />

      <div className='flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-2 black:border-gray-800 dark:border-gray-800 sm:px-5'>
        <button
          className={!showAgenda
            ? 'rounded-full bg-primary-600 px-3 py-1 text-xs font-black text-white'
            : 'rounded-full border border-primary-300 px-3 py-1 text-xs font-black text-primary-700 black:border-primary-700 black:text-primary-300 dark:border-primary-700 dark:text-primary-300'}
          onClick={() => setShowAgenda(false)}
          type='button'
        >
          Cards
        </button>
        <button
          className={showAgenda
            ? 'rounded-full bg-primary-600 px-3 py-1 text-xs font-black text-white'
            : 'rounded-full border border-primary-300 px-3 py-1 text-xs font-black text-primary-700 black:border-primary-700 black:text-primary-300 dark:border-primary-700 dark:text-primary-300'}
          onClick={() => setShowAgenda(true)}
          type='button'
        >
          Agenda
        </button>
      </div>

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(item => item.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.event.error' defaultMessage='Event search is temporarily unavailable.' />
        </NativeDiscoveryState>
      ) : result.data.providers.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.events.not_configured' defaultMessage='Event search is not available here yet.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          {submittedQuery
            ? <FormattedMessage id='native_discovery.event.empty' defaultMessage='No upcoming events matched this search.' />
            : <FormattedMessage id='native_discovery.event.empty_browse' defaultMessage='No upcoming events have reached your server yet. Follow an organizer or open an event link to bring future events into this feed.' />}
        </NativeDiscoveryState>
      ) : (
        <>
          {showAgenda && (
            <ol className='divide-y divide-solid divide-gray-200 border-b border-gray-200 black:divide-gray-800 black:border-gray-800 dark:divide-gray-800 dark:border-gray-800'>
              {[...result.data.items]
                .sort((left, right) => Date.parse(left.begins_at) - Date.parse(right.begins_at))
                .map(event => (
                  <li className='flex items-start gap-4 px-4 py-3 sm:px-5' key={`agenda:${event.id}`}>
                    <time className='w-24 shrink-0 text-sm font-black text-primary-700 black:text-primary-300 dark:text-primary-300' dateTime={event.begins_at}>
                      {intl.formatDate(new Date(event.begins_at), { month: 'short', day: 'numeric' })}
                      <span className='block text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>{intl.formatTime(new Date(event.begins_at), { hour: 'numeric', minute: '2-digit' })}</span>
                    </time>
                    <div className='min-w-0 flex-1'>
                      <Link className='block truncate font-black text-gray-950 hover:underline black:text-white dark:text-white' to={nativeResolvePath('events', event.activitypub_url)}>{event.title}</Link>
                      <p className='truncate text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>{eventPlace(event)}</p>
                    </div>
                    <span className='shrink-0 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>{lifecycleLabel(event)}</span>
                  </li>
                ))}
            </ol>
          )}
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(event => (
              <NativeDiscoveryArticle item={event} key={event.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {event.image_url && <img src={event.image_url} alt='' loading='lazy' className='aspect-[2/1] w-full bg-black object-cover' />}
                <div className='pt-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-black text-primary-700 black:text-primary-300 dark:text-primary-300'>
                      {intl.formatDate(new Date(event.begins_at), { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' - '}
                      {intl.formatTime(new Date(event.begins_at), { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${
                      event.lifecycle === 'cancelled'
                        ? 'bg-red-100 text-red-800 black:bg-red-950 black:text-red-200 dark:bg-red-900/50 dark:text-red-200'
                        : event.lifecycle === 'tentative' || event.lifecycle === 'postponed'
                          ? 'bg-yellow-100 text-yellow-900 black:bg-yellow-950 black:text-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-100'
                          : 'bg-primary-100 black:bg-primary-900 text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'
                    }`}
                    >{lifecycleLabel(event)}</span>
                  </div>
                  {event.ends_at && (
                    <p className='mt-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
                      <FormattedMessage
                        id='native_discovery.event.ends'
                        defaultMessage='Ends {date} at {time}'
                        values={{
                          date: intl.formatDate(new Date(event.ends_at), { month: 'short', day: 'numeric' }),
                          time: intl.formatTime(new Date(event.ends_at), { hour: 'numeric', minute: '2-digit' }),
                        }}
                      />
                    </p>
                  )}
                  <h3 className='mt-1 line-clamp-2 text-lg font-black leading-snug text-gray-950 black:text-white dark:text-white'>{event.title}</h3>
                  <p className='mt-2 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>{eventPlace(event)}</p>
                  {event.timezone && <p className='mt-1 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>{event.timezone}</p>}
                  {(event.organizer.name || event.organizer.handle) && (
                    event.organizer.url ? (
                      <Link to={nativeResolvePath('events', event.organizer.url)} className='mt-1 block truncate text-sm font-bold text-primary-700 black:text-primary-300 hover:text-primary-500 dark:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.published_by' defaultMessage='Published by {name}' values={{ name: event.organizer.name || event.organizer.handle }} />
                      </Link>
                    ) : (
                      <p className='mt-1 truncate text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
                        <FormattedMessage id='native_discovery.event.published_by' defaultMessage='Published by {name}' values={{ name: event.organizer.name || event.organizer.handle }} />
                      </p>
                    )
                  )}
                  {event.contacts.length > 0 && (
                    <div className='mt-2 flex flex-wrap items-center gap-x-1 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      <FormattedMessage id='native_discovery.event.contacts' defaultMessage='Event contacts:' />
                      {event.contacts.map((contact, index) => (
                        <span key={contact.url || contact.id || index}>
                          {contact.url ? (
                            <Link to={nativeResolvePath('events', contact.url)} className='font-bold text-primary-700 black:text-primary-300 hover:text-primary-500 dark:text-primary-300'>
                              {contact.name || contact.handle || 'Contact'}
                            </Link>
                          ) : contact.name || contact.handle || 'Contact'}
                          {index < event.contacts.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {event.summary && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{event.summary}</p>}
                  {event.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {event.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                    </div>
                  )}
                  {typeof event.capacity === 'number' && event.capacity > 0 && event.remaining_capacity === 0 && (
                    <p className='mt-3 text-xs font-black text-red-700 dark:text-red-300'>
                      <FormattedMessage id='native_discovery.event.full' defaultMessage='Source reports that this event is full' />
                    </p>
                  )}
                  {typeof event.capacity === 'number' && event.capacity > 0 && typeof event.remaining_capacity === 'number' && event.remaining_capacity > 0 && (
                    <p className='mt-3 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      <FormattedMessage id='native_discovery.event.remaining' defaultMessage='{count, plural, one {# place remaining} other {# places remaining}}' values={{ count: event.remaining_capacity }} />
                    </p>
                  )}
                  {(typeof event.participant_count === 'number' || accessLabel(event) || event.category) && (
                    <p className='mt-2 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      {[
                        typeof event.participant_count === 'number' ? `${event.participant_count} participating` : null,
                        accessLabel(event),
                        event.category,
                      ].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  {(event.anonymous_participation || repliesModerationLabel(event) || event.phone_address || (event.language && event.language !== 'und')) && (
                    <p className='mt-2 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      {[
                        event.anonymous_participation ? 'Anonymous attendance available at source' : null,
                        repliesModerationLabel(event),
                        event.phone_address ? `Phone access: ${event.phone_address}` : null,
                        event.language && event.language !== 'und' ? `Language: ${event.language}` : null,
                      ].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <WorldObjectStateControl
                    family='events'
                    objectUri={event.activitypub_url}
                    presentation={{
                      image: event.image_url,
                      source_host: event.source_host,
                      subtitle: eventPlace(event),
                      title: event.title,
                    }}
                  />
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Link to={nativeResolvePath('events', event.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      {localAttendanceActionLabel(event)}
                    </Link>
                    {event.participation_url && (
                      <a href={event.participation_url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.external_registration' defaultMessage='External registration' />
                      </a>
                    )}
                    {event.url !== event.participation_url && (
                      <a href={event.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.details' defaultMessage='Open original' />
                      </a>
                    )}
                    {event.online_url && event.online_url !== event.url && (
                      <a href={event.online_url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.online' defaultMessage='Online location' />
                      </a>
                    )}
                    {event.comments_enabled !== false && (
                      <Link to={`/notice/${encodeURIComponent(event.id)}`} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.discussion' defaultMessage='Open discussion' />
                      </Link>
                    )}
                    {event.location.latitude !== undefined && event.location.longitude !== undefined && (
                      <a href={`https://www.openstreetmap.org/?mlat=${event.location.latitude}&mlon=${event.location.longitude}#map=15/${event.location.latitude}/${event.location.longitude}`} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.event.map' defaultMessage='Open venue map' />
                      </a>
                    )}
                    <button type='button' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300' onClick={() => downloadCalendarEvent(event)}>
                      <FormattedMessage id='native_discovery.event.calendar' defaultMessage='Add to calendar' />
                    </button>
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
            onPrevious={() => setOffset(Math.max(0, offset - 12))}
            onNext={() => setOffset(result.data.next_offset || offset + 12)}
          />
        </>
      )}
    </section>
  );
};

export default EventDiscoveryPanel;

/* end of event-discovery-panel.tsx */
