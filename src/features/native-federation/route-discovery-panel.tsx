/*
 * Unfathomably route discovery panel
 * ----------------------------------
 *
 * File: route-discovery-panel.tsx
 *
 * Purpose:
 *   Present received public Wanderer trails as useful route cards.
 *
 * Responsibilities:
 *   - search locally cached trails by route, author, place, and metadata
 *   - show preview, distance, difficulty, elevation, map, and GPX actions
 *   - keep source, author, and local route resolution clearly separate
 *
 * This file intentionally does not imply that a trail can be modified here,
 * fetch GPX data implicitly, or follow the route author automatically.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useRouteDiscovery } from '@/api/hooks/discovery/useRouteDiscovery.ts';

import NativeObjectUrlForm from './native-object-url-form.tsx';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface RouteDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const distanceLabel = (distance?: number): string | null => {
  if (distance === undefined) return null;
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
};

const durationLabel = (duration?: number): string | null => {
  if (duration === undefined) return null;
  const minutes = Math.round(duration / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
};

const dateLabel = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const RouteDiscoveryPanel: React.FC<RouteDiscoveryPanelProps> = ({ enabled, family }) => {
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && (family === 'all' || family === 'routes');
  const result = useRouteDiscovery(visible, query, offset);
  if (!visible) return null;

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
              <FormattedMessage id='native_discovery.routes.title' defaultMessage='Received trails' />
            </h2>
            <p className='mt-1 max-w-3xl text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
              <FormattedMessage
                id='native_discovery.routes.description'
                defaultMessage='Find trails already shared with this server. Open one for its map, GPX track, author, comments, and logs.'
              />
            </p>
            <p className='mt-2 max-w-3xl text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
              <FormattedMessage
                id='native_discovery.routes.source_details'
                defaultMessage="The map starts at the route's first point. Open the trail for full waypoints, comments, and logs."
              />
            </p>
          </div>
        </div>
        <NativeDiscoverySearchForm
          disabled={draftQuery.trim().length === 1}
          id='native-route-discovery-search'
          label={<FormattedMessage id='native_discovery.routes.search_label' defaultMessage='Search received trails' />}
          value={draftQuery}
          placeholder='Trail, place, author, category, or tag'
          secondaryLabel={query
            ? <FormattedMessage id='native_discovery.clear' defaultMessage='Clear' />
            : undefined}
          submitLabel={<FormattedMessage id='native_discovery.routes.search' defaultMessage='Search trails' />}
          onChange={setDraftQuery}
          onSecondary={() => {
            setDraftQuery('');
            setQuery('');
            setOffset(0);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            const nextQuery = draftQuery.trim();
            if (nextQuery.length === 0 || nextQuery.length >= 2) {
              setQuery(nextQuery);
              setOffset(0);
            }
          }}
        />
        {draftQuery.trim().length === 1 && (
          <p className='mt-2 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
            <FormattedMessage id='native_discovery.routes.minimum_query' defaultMessage='Enter at least two characters to search.' />
          </p>
        )}
      </div>

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.routes.error' defaultMessage='Trails could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.providers.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.local_unavailable' defaultMessage='Trail search is not available here yet.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<NativeObjectUrlForm
            family='routes'
            title={<FormattedMessage id='native_discovery.routes.shared_title' defaultMessage='Have a Wanderer trail link?' />}
            hint={<FormattedMessage id='native_discovery.routes.shared_hint' defaultMessage='Paste the trail link to view its route details, map start, and GPX track here.' />}
            placeholder='https://wanderer.example/trails/...'
            action={<FormattedMessage id='native_discovery.routes.shared_action' defaultMessage='View trail' />}
          />}
        >
          {query ? (
            <FormattedMessage id='native_discovery.routes.empty_search' defaultMessage='No trails matched this search.' />
          ) : (
            <FormattedMessage id='native_discovery.routes.empty' defaultMessage='No trails have reached your server yet. Open a shared trail link below to view it here.' />
          )}
        </NativeDiscoveryState>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {result.data.items.map(item => {
            const hasHumanTrailUrl = item.activitypub_url && item.url !== item.activitypub_url;
            const facts = [
              distanceLabel(item.distance),
              durationLabel(item.duration),
              item.elevation_gain === undefined ? null : `+${Math.round(item.elevation_gain)} m`,
              item.elevation_loss === undefined ? null : `-${Math.round(item.elevation_loss)} m`,
              item.location,
              item.category,
              item.difficulty,
              dateLabel(item.start_time),
            ].filter((fact): fact is string => Boolean(fact));
            const hasCoordinates = item.latitude !== undefined && item.longitude !== undefined;
            const mapUrl = hasCoordinates
              ? `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=13/${item.latitude}/${item.longitude}`
              : null;

            return (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                {item.image_url && <img src={item.image_url} alt='' loading='lazy' className='h-44 w-full object-cover' />}
                <div className='pt-4'>
                  <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  <p className='mt-1 truncate text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.source_host}</p>
                  {(item.author || item.author_handle) && (
                    <p className='mt-2 text-sm font-semibold text-gray-700 black:text-gray-200 dark:text-gray-200'>
                      {item.author}
                      {item.author_handle && item.author_handle !== item.author && <span className='ml-1 font-normal text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.author_handle}</span>}
                    </p>
                  )}
                  {item.summary && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  {facts.length > 0 && <p className='mt-3 text-xs leading-5 text-gray-600 black:text-gray-300 dark:text-gray-300'>{facts.join(' | ')}</p>}
                  {item.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-950 dark:text-primary-200'>#{tag}</span>)}
                    </div>
                  )}
                  <WorldObjectStateControl
                    family='routes'
                    objectUri={item.activitypub_url || item.source_url}
                    presentation={{
                      source_host: item.source_host,
                      title: item.title,
                      url: item.url,
                    }}
                  />
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {item.activitypub_url && (
                      <Link to={nativeResolvePath('routes', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                        <FormattedMessage id='native_discovery.resolve' defaultMessage='Open here' />
                      </Link>
                    )}
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      {hasHumanTrailUrl ? <FormattedMessage id='native_discovery.routes.open_trail' defaultMessage='Open trail' /> : <FormattedMessage id='native_discovery.routes.open_record' defaultMessage='Open source record' />}
                    </a>
                    {item.author_url && <Link to={nativeResolvePath('routes', item.author_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.routes.open_author' defaultMessage='Open author here' />
                    </Link>}
                    {mapUrl && <a href={mapUrl} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.routes.open_map' defaultMessage='Open route start' />
                    </a>}
                    {item.gpx_url && <a href={item.gpx_url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      {item.gpx_host ? (
                        <FormattedMessage
                          id='native_discovery.routes.download_gpx_from_host'
                          defaultMessage='Download GPX from {host}'
                          values={{ host: item.gpx_host }}
                        />
                      ) : (
                        <FormattedMessage
                          id='native_discovery.routes.download_gpx'
                          defaultMessage='Download GPX'
                        />
                      )}
                    </a>}
                  </div>
                </div>
              </NativeDiscoveryArticle>
            );
          })}
          <NativeDiscoveryPagination
            className='col-span-full border-t border-gray-200 pt-4 black:border-gray-800 dark:border-gray-700'
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            inset
            label={<FormattedMessage id='native_discovery.routes.page' defaultMessage='Trails {start}-{end}' values={{ start: offset + 1, end: offset + result.data.items.length }} />}
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - 12))}
            onNext={() => setOffset(result.data.next_offset ?? offset + 12)}
          />
        </div>
      )}
    </section>
  );
};

export default RouteDiscoveryPanel;

/* end of route-discovery-panel.tsx */
