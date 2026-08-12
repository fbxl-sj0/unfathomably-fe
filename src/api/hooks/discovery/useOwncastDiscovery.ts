/*
 * Unfathomably Owncast discovery
 * ------------------------------
 *
 * File: useOwncastDiscovery.ts
 *
 * Purpose:
 *   Load live streams from backend-approved Owncast directories.
 *
 * Responsibilities:
 *   - request directory data only after explicit user action
 *   - validate native stream, logo, lifecycle, and provider metadata
 *   - retain a local resolution handoff without guessing actor usernames
 *
 * This file intentionally does not fetch HLS media, connect to chat, contact
 * stream servers directly, or auto-follow stream actors.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface OwncastDiscoveryItem {
  id: string;
  family: 'video';
  kind: 'live_stream';
  title: string;
  summary?: string;
  url: string;
  thumbnail_url?: string;
  tags: string[];
  sensitive: boolean;
  live: true;
  listed_live: true;
  source_host: string;
  activitypub_url: string;
  resolution_kind: 'source_origin';
  local_action: 'resolve';
}

interface OwncastDiscoveryProvider {
  type: 'owncast_directory';
  host: string;
  status: 'ready' | 'unavailable';
}

interface OwncastDiscoveryResponse {
  items: OwncastDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: OwncastDiscoveryProvider[];
}

const emptyResponse: OwncastDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;

const secureUrl = (value: unknown): string | undefined => {
  const url = stringValue(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const normalizeItem = (value: unknown): OwncastDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'video' || value.kind !== 'live_stream' || value.live !== true || value.listed_live !== true) return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const sourceHost = stringValue(value.source_host);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);

  if (!id || !title || !sourceHost || !url || !activitypubUrl || value.local_action !== 'resolve') return null;

  return {
    id,
    family: 'video',
    kind: 'live_stream',
    title,
    summary: stringValue(value.summary),
    url,
    thumbnail_url: secureUrl(value.thumbnail_url),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 12)
      : [],
    sensitive: value.sensitive === true,
    live: true,
    listed_live: true,
    source_host: sourceHost,
    activitypub_url: activitypubUrl,
    resolution_kind: 'source_origin',
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): OwncastDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid Owncast discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is OwncastDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): OwncastDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'owncast_directory' && host && status
        ? [{ type: 'owncast_directory', host, status }]
        : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: typeof value.next_offset === 'number' && Number.isInteger(value.next_offset) && value.next_offset >= 0
      ? value.next_offset
      : null,
  };
};

export const useOwncastDiscovery = (query: string, offset: number, requested: boolean) => {
  const api = useApi();

  const result = useQuery<OwncastDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'livestream', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'livestream', q: query, limit: '24', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: requested,
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useOwncastDiscovery.ts */
