/*
 * Unfathomably source-only native object card
 * -------------------------------------------
 *
 * File: native-resolved-object-card.tsx
 *
 * Purpose:
 *   Present a validated native resource that has no social Create activity.
 *
 * Responsibilities:
 *   - explain why the object has no reply or reaction controls
 *   - show a bounded set of useful family-specific facts
 *   - preserve a deliberate route to the canonical source document
 *
 * This file intentionally does not invent social interactions, render remote
 * HTML, download attachments, or infer metadata from the source hostname.
 */

import { FormattedMessage } from 'react-intl';

import type { NativeResolvedResource } from '@/api/hooks/discovery/useNativeObjectResolve.ts';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';

interface NativeResolvedObjectCardProps {
  resource: NativeResolvedResource;
}

const familyLabels: Record<string, string> = {
  audio: 'Audio',
  books: 'Books',
  bookmarks: 'Bookmarks',
  coordination: 'Coordination',
  culture: 'Culture',
  development: 'Software',
  events: 'Events',
  games: 'Games',
  groups: 'Communities',
  longform: 'Articles',
  marketplace: 'Markets',
  models: '3D models',
  photo: 'Photography',
  publishing: 'Publishing',
  routes: 'Routes',
  video: 'Video',
};

const factLabels: Record<string, string> = {
  action: 'Action',
  album: 'Album',
  artist: 'Artist',
  author: 'Author',
  availability: 'Availability',
  category: 'Category',
  condition: 'Condition',
  creator: 'Creator',
  distance: 'Distance',
  elevation_gain: 'Elevation gain',
  elevation_loss: 'Elevation loss',
  duration: 'Duration',
  file_format: 'Format',
  file_name: 'File',
  isbn: 'ISBN',
  license: 'License',
  listing_location: 'Location',
  location: 'Location',
  model_name: 'Model',
  price: 'Price',
  publication_year: 'Published',
  purpose: 'Purpose',
  quantity: 'Quantity',
  rating: 'Rating',
  repository: 'Repository',
  state: 'State',
  version: 'Version',
};

const factValue = (value: string | number | boolean | Array<string | number | boolean>): string => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const safeHttpUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password
      ? value
      : null;
  } catch {
    return null;
  }
};

const numberField = (resource: NativeResolvedResource, key: string): number | null => {
  const value = resource.fields[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const routeFactValue = (
  key: string,
  value: string | number | boolean | Array<string | number | boolean>,
): string => {
  if (typeof value !== 'number') return factValue(value);

  if (key === 'distance') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
  }

  if (key === 'duration') {
    const minutes = Math.round(value / 60);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
  }

  if (key === 'elevation_gain') return `+${Math.round(value)} m`;
  if (key === 'elevation_loss') return `-${Math.round(value)} m`;

  return factValue(value);
};

const sourceActionLabel = (resource: NativeResolvedResource): string => {
  switch (resource.family) {
    case 'routes':
      return 'Open full trail';
    case 'marketplace':
      return 'Open original listing';
    case 'coordination':
      return 'Open coordination record';
    default:
      return 'Open original source';
  }
};

const SourceOnlyHint: React.FC<NativeResolvedObjectCardProps> = ({ resource }) => {
  switch (resource.family) {
    case 'routes':
      return (
        <FormattedMessage
          id='native_resolver.source_only_hint.routes'
          defaultMessage='Use the map or GPX track here. Comments and edits remain with the trail publisher.'
        />
      );
    case 'marketplace':
      return (
        <FormattedMessage
          id='native_resolver.source_only_hint.marketplace'
          defaultMessage='Confirm availability, payment, delivery, and seller contact with the original marketplace.'
        />
      );
    case 'coordination':
      return (
        <FormattedMessage
          id='native_resolver.source_only_hint.coordination'
          defaultMessage='Confirm current terms and participation with the record publisher.'
        />
      );
    default:
      return (
        <FormattedMessage
          id='native_resolver.source_only_hint.generic'
          defaultMessage='This standalone item did not include social reply or reaction controls.'
        />
      );
  }
};

const NativeResolvedObjectCard: React.FC<NativeResolvedObjectCardProps> = ({ resource }) => {
  const facts = Object.entries(factLabels)
    .flatMap(([key, label]) => resource.fields[key] === undefined
      ? []
      : [{ key, label, value: routeFactValue(key, resource.fields[key]) }])
    .slice(0, 8);
  const gpxUrl = resource.family === 'routes' ? safeHttpUrl(resource.fields.gpx_url) : null;
  const latitude = resource.family === 'routes' ? numberField(resource, 'latitude') : null;
  const longitude = resource.family === 'routes' ? numberField(resource, 'longitude') : null;
  const mapUrl = latitude !== null
    && longitude !== null
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}`
    : null;

  return (
    <article className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-3 dark:border-gray-700'>
        <div className='flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide'>
          <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
            {familyLabels[resource.family] || resource.family}
          </span>
          {resource.kind && (
            <span className='text-gray-500 black:text-gray-400 dark:text-gray-400'>{resource.kind.replaceAll('_', ' ')}</span>
          )}
          <span className='text-gray-500 black:text-gray-400 dark:text-gray-400'>
            <FormattedMessage id='native_resolver.source_only' defaultMessage='Standalone item' />
          </span>
        </div>
        <h3 className='mt-2 text-xl font-black leading-tight text-gray-950 black:text-white dark:text-white'>{resource.title}</h3>
        <p className='mt-1 text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{resource.source_host}</p>
      </div>

      <div className='pt-4'>
        {resource.summary && <p className='whitespace-pre-line text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{resource.summary}</p>}

        {facts.length > 0 && (
          <dl className='mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2'>
            {facts.map(fact => (
              <div key={fact.key}>
                <dt className='text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>{fact.label}</dt>
                <dd className='mt-1 break-words text-sm font-semibold text-gray-950 black:text-white dark:text-white'>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className='mt-4 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <SourceOnlyHint resource={resource} />
        </p>

        <WorldObjectStateControl
          family={resource.family}
          objectUri={resource.source_url}
          presentation={{ ...resource.fields, source_host: resource.source_host, title: resource.title }}
        />

        <div className='mt-4 flex flex-wrap gap-2'>
          <a href={resource.source_url} target='_blank' rel='noopener noreferrer' className='inline-flex rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
            {sourceActionLabel(resource)}
          </a>
          {mapUrl && (
            <a href={mapUrl} target='_blank' rel='noopener noreferrer' className='inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-black text-gray-900 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-white black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
              <FormattedMessage id='native_resolver.route_map' defaultMessage='View route start' />
            </a>
          )}
          {gpxUrl && (
            <a href={gpxUrl} target='_blank' rel='noopener noreferrer' className='inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-black text-gray-900 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-white black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
              <FormattedMessage id='native_resolver.route_gpx' defaultMessage='Download GPX' />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default NativeResolvedObjectCard;

/* end of native-resolved-object-card.tsx */
