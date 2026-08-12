/*
 * Unfathomably route discovery
 * ----------------------------
 *
 * File: useRouteDiscovery.ts
 *
 * Purpose:
 *   Search public Wanderer trails already accepted through federation.
 *
 * Responsibilities:
 *   - request one bounded, normalized route-discovery response
 *   - validate route, author, map, preview, and GPX metadata
 *   - distinguish a healthy empty local cache from a failed request
 *
 * This file intentionally does not follow route authors, upload GPX data, or
 * contact Wanderer instances.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface RouteDiscoveryItem {
  id: string;
  family: 'route';
  kind: 'trail';
  title: string;
  summary?: string;
  url: string;
  activitypub_url?: string;
  source_url: string;
  source_host: string;
  image_url?: string;
  gpx_url?: string;
  gpx_host?: string;
  author?: string;
  author_url?: string;
  author_handle?: string;
  category?: string;
  difficulty?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  route_point_kind?: 'start';
  distance?: number;
  duration?: number;
  duration_unit?: 'seconds';
  elevation_gain?: number;
  elevation_loss?: number;
  start_time?: string;
  published_at?: string;
  tags: string[];
}

export interface RouteDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface RouteDiscoveryResponse {
  items: RouteDiscoveryItem[];
  providers: RouteDiscoveryProvider[];
  has_more: boolean;
  next_offset?: number;
}

const emptyResponse: RouteDiscoveryResponse = { items: [], providers: [], has_more: false };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const webUrl = (value: unknown): string | undefined => {
  const candidate = stringValue(value)?.trim();
  if (!candidate || candidate.length > 2048) return undefined;

  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
      ? candidate
      : undefined;
  } catch {
    return undefined;
  }
};
const numberValue = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const nonNegativeNumberValue = (value: unknown): number | undefined => {
  const number = numberValue(value);
  return number !== undefined && number >= 0 ? number : undefined;
};
const coordinateValue = (value: unknown, minimum: number, maximum: number): number | undefined => {
  const number = numberValue(value);
  return number !== undefined && number >= minimum && number <= maximum ? number : undefined;
};
const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.flatMap(item => stringValue(item) || []).slice(0, 12)
  : [];

const normalizeItem = (value: unknown): RouteDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'route' || value.kind !== 'trail') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const sourceUrl = webUrl(value.source_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !title || !url || !activitypubUrl || !sourceUrl || !sourceHost) return null;

  return {
    id,
    family: 'route',
    kind: 'trail',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    source_url: sourceUrl,
    source_host: sourceHost,
    image_url: webUrl(value.image_url),
    gpx_url: webUrl(value.gpx_url),
    gpx_host: stringValue(value.gpx_host),
    author: stringValue(value.author),
    author_url: webUrl(value.author_url),
    author_handle: stringValue(value.author_handle),
    category: stringValue(value.category),
    difficulty: stringValue(value.difficulty),
    location: stringValue(value.location),
    latitude: coordinateValue(value.latitude, -90, 90),
    longitude: coordinateValue(value.longitude, -180, 180),
    route_point_kind: value.route_point_kind === 'start' ? 'start' : undefined,
    distance: nonNegativeNumberValue(value.distance),
    duration: nonNegativeNumberValue(value.duration),
    duration_unit: value.duration_unit === 'seconds' ? 'seconds' : undefined,
    elevation_gain: nonNegativeNumberValue(value.elevation_gain),
    elevation_loss: nonNegativeNumberValue(value.elevation_loss),
    start_time: stringValue(value.start_time),
    published_at: stringValue(value.published_at),
    tags: stringArray(value.tags),
  };
};

const normalizeResponse = (value: unknown): RouteDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid route discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is RouteDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): RouteDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      return provider.type === 'local_federation_cache' && host && provider.status === 'ready'
        ? [{ type: 'local_federation_cache', host, status: 'ready' }]
        : [];
    })
    : [];

  const nextOffset = numberValue(value.next_offset);

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: nextOffset !== undefined && Number.isInteger(nextOffset) && nextOffset >= 0 ? nextOffset : undefined,
  };
};

export const useRouteDiscovery = (enabled: boolean, query = '', offset = 0) => {
  const api = useApi();
  const result = useQuery<RouteDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedRoute', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'received_route', limit: '12', offset: String(offset) });
      if (query.trim().length >= 2) params.set('q', query.trim());
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useRouteDiscovery.ts */
