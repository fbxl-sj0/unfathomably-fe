/*
 * Unfathomably 3D model discovery
 * -------------------------------
 *
 * File: useModelDiscovery.ts
 *
 * Purpose:
 *   Load public model actors from backend-approved Manyfold catalogues.
 *
 * Responsibilities:
 *   - browse the first public catalogue page before a search is entered
 *   - preserve bounded catalogue pagination
 *   - validate model, creator, collection, tag, and provider metadata
 *   - retain the model's native page and canonical Fediverse handle
 *
 * This file intentionally does not contact Manyfold directly, download model
 * files, register a FASP provider, or follow a model automatically.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface ModelDiscoveryActor {
  name: string;
  url: string;
}

export interface ModelDiscoveryItem {
  id: string;
  family: 'model';
  kind: '3DModel';
  title: string;
  summary?: string;
  url: string;
  activitypub_handle: string;
  thumbnail_url?: string;
  creator?: ModelDiscoveryActor;
  collection?: ModelDiscoveryActor;
  tags: string[];
  source_host: string;
  local_action: 'resolve';
}

interface ModelDiscoveryProvider {
  type: 'manyfold';
  host: string;
  status: 'ready' | 'unavailable';
}

interface ModelDiscoveryResponse {
  items: ModelDiscoveryItem[];
  providers: ModelDiscoveryProvider[];
  has_more: boolean;
}

const emptyResponse: ModelDiscoveryResponse = { items: [], providers: [], has_more: false };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const boundedString = (value: unknown, maximum: number): string | undefined => {
  const text = stringValue(value)?.trim();
  return text && text.length <= maximum ? text : undefined;
};
const httpsUrl = (value: unknown): string | undefined => {
  const text = boundedString(value, 2048);
  if (!text) return undefined;

  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizeActor = (value: unknown): ModelDiscoveryActor | undefined => {
  if (!isRecord(value)) return undefined;

  const name = boundedString(value.name, 300);
  const url = httpsUrl(value.url);
  return name && url ? { name, url } : undefined;
};

const normalizeItem = (value: unknown): ModelDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'model' || value.kind !== '3DModel') return null;

  const id = boundedString(value.id, 500);
  const title = boundedString(value.title, 300);
  const url = httpsUrl(value.url);
  const activitypubHandle = boundedString(value.activitypub_handle, 300);
  const sourceHost = boundedString(value.source_host, 253);

  if (!id || !title || !url || !activitypubHandle || !sourceHost || value.local_action !== 'resolve') return null;

  return {
    id,
    family: 'model',
    kind: '3DModel',
    title,
    summary: boundedString(value.summary, 1000),
    url,
    activitypub_handle: activitypubHandle,
    thumbnail_url: httpsUrl(value.thumbnail_url),
    creator: normalizeActor(value.creator),
    collection: normalizeActor(value.collection),
    tags: Array.isArray(value.tags)
      ? value.tags.flatMap(tag => boundedString(tag, 80) || []).slice(0, 8)
      : [],
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ModelDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid model discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ModelDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ModelDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = boundedString(provider.host, 253);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'manyfold' && host && status ? [{ type: 'manyfold', host, status }] : [];
    })
    : [];

  return { items, providers, has_more: value.has_more === true };
};

export const useModelDiscovery = (query: string, offset: number, enabled: boolean) => {
  const api = useApi();

  const result = useQuery<ModelDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'model', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'model', q: query, limit: '18', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useModelDiscovery.ts */
