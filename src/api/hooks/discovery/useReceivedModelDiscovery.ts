/*
 * Unfathomably received model discovery
 * --------------------------------------
 *
 * File: useReceivedModelDiscovery.ts
 *
 * Purpose:
 *   Search Manyfold-compatible actors already accepted through federation.
 *
 * Responsibilities:
 *   - validate model, creator, collection, licence, preview, and link metadata
 *   - preserve bounded local-cache pagination
 *   - preserve canonical actors for deliberate local resolution
 *   - keep source-only file access explicit
 *
 * This file intentionally does not fetch model binaries, contact remote
 * catalogues, render arbitrary 3D files, or follow an actor automatically.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

type ReceivedModelKind = 'model' | 'creator' | 'collection';

interface ReceivedModelLink {
  label: string;
  url: string;
}

interface ReceivedModelActor {
  name: string;
  url: string;
  activitypub_handle?: string;
  concrete_type: '3DModel' | 'Creator' | 'Collection';
}

export interface ReceivedModelDiscoveryItem {
  id: string;
  family: 'model';
  kind: ReceivedModelKind;
  concrete_type: '3DModel' | 'Creator' | 'Collection';
  title: string;
  summary?: string;
  description?: string;
  url: string;
  activitypub_url: string;
  activitypub_handle?: string;
  source_host: string;
  thumbnail_url?: string;
  sensitive: boolean;
  creator_url?: string;
  collection_urls: string[];
  creator?: ReceivedModelActor;
  collections: ReceivedModelActor[];
  license?: string;
  license_url?: string;
  commercial_license: boolean;
  tags: string[];
  links: ReceivedModelLink[];
  attribution_domains: string[];
  updated_at?: string;
  local_action: 'resolve';
}

interface ReceivedModelDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface ReceivedModelDiscoveryResponse {
  items: ReceivedModelDiscoveryItem[];
  providers: ReceivedModelDiscoveryProvider[];
}

const emptyResponse: ReceivedModelDiscoveryResponse = { items: [], providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const stringArray = (value: unknown, limit: number): string[] => Array.isArray(value)
  ? value.flatMap(item => stringValue(item) || []).slice(0, limit)
  : [];

const webUrl = (value: unknown): string | undefined => {
  const url = stringValue(value);
  if (!url || url.length > 2048) return undefined;

  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:')
      && !parsed.username
      && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const normalizeActor = (value: unknown): ReceivedModelActor | null => {
  if (!isRecord(value)) return null;

  const name = stringValue(value.name);
  const url = webUrl(value.url);
  const concreteType = value.concrete_type === '3DModel'
    || value.concrete_type === 'Creator'
    || value.concrete_type === 'Collection'
    ? value.concrete_type
    : null;

  if (!name || name.length > 300 || !url || !concreteType) return null;

  return {
    name,
    url,
    activitypub_handle: stringValue(value.activitypub_handle),
    concrete_type: concreteType,
  };
};

const normalizeLink = (value: unknown): ReceivedModelLink | null => {
  if (!isRecord(value)) return null;
  const label = stringValue(value.label);
  const url = webUrl(value.url);
  return label && url ? { label, url } : null;
};

const normalizeItem = (value: unknown): ReceivedModelDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'model' || value.local_action !== 'resolve') return null;

  const id = stringValue(value.id);
  const kind = value.kind === 'model' || value.kind === 'creator' || value.kind === 'collection' ? value.kind : null;
  const concreteType = value.concrete_type === '3DModel' || value.concrete_type === 'Creator' || value.concrete_type === 'Collection'
    ? value.concrete_type
    : null;
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);
  const creator = normalizeActor(value.creator);
  const collections = Array.isArray(value.collections)
    ? value.collections.map(normalizeActor).filter((actor): actor is ReceivedModelActor => actor !== null).slice(0, 20)
    : [];

  if (!id || !kind || !concreteType || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family: 'model',
    kind,
    concrete_type: concreteType,
    title,
    summary: stringValue(value.summary),
    description: stringValue(value.description),
    url,
    activitypub_url: activitypubUrl,
    activitypub_handle: stringValue(value.activitypub_handle),
    source_host: sourceHost,
    thumbnail_url: webUrl(value.thumbnail_url),
    sensitive: value.sensitive === true,
    creator_url: webUrl(value.creator_url),
    collection_urls: stringArray(value.collection_urls, 20).flatMap(url => webUrl(url) || []),
    creator: creator || undefined,
    collections,
    license: stringValue(value.license),
    license_url: webUrl(value.license_url),
    commercial_license: value.commercial_license === true,
    tags: stringArray(value.tags, 12),
    links: Array.isArray(value.links)
      ? value.links.map(normalizeLink).filter((link): link is ReceivedModelLink => link !== null).slice(0, 8)
      : [],
    attribution_domains: stringArray(value.attribution_domains, 8),
    updated_at: stringValue(value.updated_at),
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ReceivedModelDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid received model discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ReceivedModelDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ReceivedModelDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      return provider.type === 'local_federation_cache' && provider.status === 'ready' && host
        ? [{ type: 'local_federation_cache', host, status: 'ready' }]
        : [];
    })
    : [];

  return { items, providers };
};

export const useReceivedModelDiscovery = (enabled: boolean, query = '', offset = 0) => {
  const api = useApi();
  const result = useQuery<ReceivedModelDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedModel', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'received_model', limit: '18', offset: String(offset) });
      if (query.trim().length >= 2) params.set('q', query.trim());
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useReceivedModelDiscovery.ts */
