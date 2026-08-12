/*
  Project: Unfathomably FE native federation
  -------------------------------------------

  File: src/components/native-route-map.tsx

  Purpose:

      Show a bounded Wanderer-style route location using the configured map
      provider while keeping GPX retrieval under explicit user control.

  Responsibilities:

      * render finite geographic coordinates on a Leaflet map
      * use the instance-configured tile server and attribution
      * expose navigation and GPX links as deliberate user actions

  This file intentionally does NOT contain:

      * remote GPX fetching or parsing
      * route editing
      * assumptions based on the remote hostname
*/

import mapPinIcon from '@tabler/icons/outline/map-pin.svg';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import Icon from '@/components/ui/icon.tsx';
import Text from '@/components/ui/text.tsx';
import { useSoapboxConfig } from '@/hooks/useSoapboxConfig.ts';

import { parseRouteCoordinates } from './native-resource-workflows.ts';

import 'leaflet/dist/leaflet.css';

interface INativeRouteMap {
  gpxUrl?: unknown;
  label?: unknown;
  latitude: unknown;
  longitude: unknown;
}

const trackReference = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length > 2048) return null;

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
      ? value
      : null;
  } catch {
    return null;
  }
};

const NativeRouteMap: React.FC<INativeRouteMap> = ({ gpxUrl, label, latitude, longitude }) => {
  const { tileServer, tileServerAttribution } = useSoapboxConfig();
  const container = useRef<HTMLDivElement>(null);
  const coordinates = parseRouteCoordinates(latitude, longitude);
  const routeLabel = typeof label === 'string' && label.trim() ? label.trim() : 'Route start';
  const trackUrl = trackReference(gpxUrl);

  useEffect(() => {
    if (!container.current || !coordinates || !tileServer) return;

    const map = L.map(container.current, {
      scrollWheelZoom: false,
    }).setView(coordinates, 13);

    L.tileLayer(tileServer, { attribution: tileServerAttribution }).addTo(map);
    L.circleMarker(coordinates, {
      color: 'currentColor',
      fillOpacity: 0.85,
      radius: 7,
      weight: 3,
    }).bindTooltip(routeLabel).addTo(map);

    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [coordinates?.[0], coordinates?.[1], routeLabel, tileServer, tileServerAttribution]);

  if (!coordinates || !tileServer) return null;

  const osmUrl = `https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}#map=13/${coordinates[0]}/${coordinates[1]}`;

  return (
    <section className='border-b border-gray-200 p-3 black:border-gray-800 dark:border-gray-700' data-testid='native-route-map'>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Icon className='text-primary-600 dark:text-primary-300' src={mapPinIcon} />
          <Text weight='semibold'>
            <FormattedMessage id='status.native.route_map' defaultMessage='Route start map' />
          </Text>
        </div>
        <div className='flex flex-wrap gap-3 text-sm font-medium'>
          <a className='text-primary-700 hover:underline dark:text-primary-300' href={osmUrl} target='_blank' rel='noopener'>
            <FormattedMessage id='status.native.open_map' defaultMessage='Open route start' />
          </a>
          {trackUrl ? (
            <a className='text-primary-700 hover:underline dark:text-primary-300' href={trackUrl} target='_blank' rel='noopener'>
              <FormattedMessage id='status.native.download_gpx' defaultMessage='Download GPX' />
            </a>
          ) : null}
        </div>
      </div>
      <Text className='mb-2 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
        <FormattedMessage id='status.native.route_map_hint' defaultMessage='This pin is the federated start point. Open the source trail or GPX track for the full route.' />
      </Text>
      <div className='h-52 w-full overflow-hidden rounded-lg border border-solid border-gray-200 black:border-gray-800 dark:border-gray-700' ref={container} />
    </section>
  );
};

export default NativeRouteMap;

/* end of native-route-map.tsx */
