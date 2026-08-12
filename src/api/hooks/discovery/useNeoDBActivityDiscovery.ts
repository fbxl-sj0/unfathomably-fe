/*
  Project: Unfathomably FE
  File: useNeoDBActivityDiscovery.ts
  Purpose: Load and validate locally cached NeoDB cultural activity.

  Responsibilities:
  - call the native discovery endpoint with the NeoDB activity family
  - reject incomplete or incorrectly shaped response records
  - expose stable query state to the cultural discovery panel

  This file intentionally does not contact NeoDB servers directly.
*/

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface NeoDBCatalogCredit {
  name: string;
  role: string | null;
  character_name: string | null;
  person_url: string | null;
}

export interface NeoDBActivityDiscoveryItem {
  id: string;
  family: 'culture';
  kind: 'neodb_activity' | 'neodb_collection';
  object_type: string | null;
  title: string;
  summary: string | null;
  url: string;
  activitypub_url: string;
  actor_url: string | null;
  actor_label: string | null;
  catalog_url: string | null;
  catalog_type: string | null;
  catalog_name: string | null;
  catalog_category: string | null;
  catalog_description: string | null;
  catalog_cover_url: string | null;
  catalog_average_rating: number | null;
  catalog_rating_count: number | null;
  catalog_tags: string[];
  catalog_credits: NeoDBCatalogCredit[];
  catalog_external_resources: string[];
  catalog_date: string | null;
  collection_url: string | null;
  collection_kind: 'collection' | 'shelf' | null;
  collection_first: string | null;
  collection_last: string | null;
  total_items: number | null;
  shelf_type: string | null;
  collection_query: string | null;
  review_url: string | null;
  rating: number | null;
  rating_best: number | null;
  status: string | null;
  related_types: string[];
  published_at: string | null;
  source_host: string | null;
  local_action: 'resolve';
}

interface NeoDBActivityDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface NeoDBActivityDiscoveryResponse {
  items: NeoDBActivityDiscoveryItem[];
  providers: NeoDBActivityDiscoveryProvider[];
  has_more: boolean;
  next_offset: number | null;
}

const emptyResponse: NeoDBActivityDiscoveryResponse = {
  items: [],
  providers: [],
  has_more: false,
  next_offset: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const numberValue = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const webUrl = (value: unknown): string | null => {
  const text = stringValue(value);
  if (!text || text.length > 2048) return null;

  try {
    const url = new URL(text);
    return (url.protocol === 'https:' || url.protocol === 'http:')
      && !url.username
      && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const normalizeCredit = (value: unknown): NeoDBCatalogCredit | null => {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name);
  if (!name || name.length > 200) return null;

  return {
    name,
    role: stringValue(value.role),
    character_name: stringValue(value.character_name),
    person_url: webUrl(value.person_url),
  };
};

const normalizeItem = (value: unknown): NeoDBActivityDiscoveryItem | null => {
  if (
    !isRecord(value)
    || value.family !== 'culture'
    || !['neodb_activity', 'neodb_collection'].includes(String(value.kind))
    || value.local_action !== 'resolve'
  ) {
    return null;
  }

  const kind = value.kind as NeoDBActivityDiscoveryItem['kind'];
  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const catalogUrl = webUrl(value.catalog_url);
  const catalogType = stringValue(value.catalog_type);
  const collectionUrl = webUrl(value.collection_url);
  const collectionKind = value.collection_kind === 'collection' || value.collection_kind === 'shelf'
    ? value.collection_kind
    : null;

  if (
    !id
    || !title
    || !url
    || !activitypubUrl
    || (kind === 'neodb_activity' && (!catalogUrl || !catalogType))
    || (kind === 'neodb_collection' && (!collectionUrl || !collectionKind))
  ) {
    return null;
  }

  return {
    id,
    family: 'culture',
    kind,
    object_type: stringValue(value.object_type),
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: webUrl(value.actor_url),
    actor_label: stringValue(value.actor_label),
    catalog_url: catalogUrl,
    catalog_type: catalogType,
    catalog_name: stringValue(value.catalog_name),
    catalog_category: stringValue(value.catalog_category),
    catalog_description: stringValue(value.catalog_description),
    catalog_cover_url: webUrl(value.catalog_cover_url),
    catalog_average_rating: numberValue(value.catalog_average_rating),
    catalog_rating_count: numberValue(value.catalog_rating_count),
    catalog_tags: Array.isArray(value.catalog_tags)
      ? value.catalog_tags.flatMap(tag => {
        const text = stringValue(tag);
        return text && text.length <= 80 ? [text] : [];
      }).slice(0, 12)
      : [],
    catalog_credits: Array.isArray(value.catalog_credits)
      ? value.catalog_credits.map(normalizeCredit).filter((credit): credit is NeoDBCatalogCredit => credit !== null).slice(0, 12)
      : [],
    catalog_external_resources: Array.isArray(value.catalog_external_resources)
      ? value.catalog_external_resources.flatMap(resource => webUrl(resource) || []).slice(0, 8)
      : [],
    catalog_date: stringValue(value.catalog_date),
    collection_url: collectionUrl,
    collection_kind: collectionKind,
    collection_first: webUrl(value.collection_first),
    collection_last: webUrl(value.collection_last),
    total_items: numberValue(value.total_items),
    shelf_type: stringValue(value.shelf_type),
    collection_query: stringValue(value.collection_query),
    review_url: webUrl(value.review_url),
    rating: numberValue(value.rating),
    rating_best: numberValue(value.rating_best),
    status: stringValue(value.status),
    related_types: Array.isArray(value.related_types)
      ? value.related_types.filter((type): type is string => typeof type === 'string')
      : [],
    published_at: stringValue(value.published_at),
    source_host: stringValue(value.source_host),
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): NeoDBActivityDiscoveryResponse => {
  if (!isRecord(value)) return emptyResponse;

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): NeoDBActivityDiscoveryProvider[] => {
      if (!isRecord(provider) || provider.type !== 'local_federation_cache' || provider.status !== 'ready') return [];

      const host = stringValue(provider.host);
      return host ? [{ type: 'local_federation_cache', host, status: 'ready' }] : [];
    })
    : [];

  return {
    items: Array.isArray(value.items)
      ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is NeoDBActivityDiscoveryItem => item !== null)
      : [],
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset),
  };
};

export const useNeoDBActivityDiscovery = (
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();

  const result = useQuery<NeoDBActivityDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'neodbActivity', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'neodb_activity',
        q: query.trim(),
        limit: '12',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: enabled && (query.trim().length === 0 || query.trim().length >= 2),
    staleTime: 2 * 60 * 1000,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useNeoDBActivityDiscovery.ts */
