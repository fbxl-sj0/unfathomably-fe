/*
 * Unfathomably native federation discovery
 * -----------------------------------------
 *
 * File: useNativeDiscovery.ts
 *
 * Purpose:
 *   Load specialized public objects from backend-approved ecosystem indexes.
 *
 * Responsibilities:
 *   - call the bounded native discovery endpoint
 *   - validate its envelope before exposing results to Worlds
 *   - keep provider failures distinct from a valid empty result
 *
 * This file intentionally does not contact remote indexes directly or import
 * discovered objects into the local server.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface NativeDiscoveryChannel {
  name?: string;
  handle?: string;
  url?: string;
  host?: string;
}

export interface NativeDiscoveryItem {
  id: string;
  family: 'video';
  kind: string;
  title: string;
  summary?: string;
  url: string;
  thumbnail_url?: string;
  preview_url?: string;
  embed_url?: string;
  published_at?: string;
  duration: number;
  language?: string;
  category?: string;
  licence?: string;
  live: boolean;
  source_host: string;
  channel: NativeDiscoveryChannel;
}

export interface NativeDiscoveryProvider {
  type: string;
  host: string;
  status: 'ready' | 'unavailable';
  accepted_peer_count: number;
}

export interface NativeDiscoveryCommunity {
  id: string;
  family: 'video';
  kind: 'video_community';
  title: string;
  summary?: string;
  url: string;
  local_url?: string;
  source_host: string;
  federation_directions?: Array<'follower' | 'following'>;
  channel: NativeDiscoveryChannel;
}

export interface NativeDiscoveryResponse {
  items: NativeDiscoveryItem[];
  total: number;
  has_more: boolean;
  next_offset: number | null;
  providers: NativeDiscoveryProvider[];
  communities: NativeDiscoveryCommunity[];
}

export type NativeDiscoveryMode = 'search' | 'communities';

const emptyResponse: NativeDiscoveryResponse = {
  items: [],
  total: 0,
  has_more: false,
  next_offset: null,
  providers: [],
  communities: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const optionalString = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;

const normalizeItem = (value: unknown): NativeDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'video') return null;

  const id = optionalString(value.id);
  const title = optionalString(value.title);
  const url = optionalString(value.url);
  const sourceHost = optionalString(value.source_host);

  if (!id || !title || !url || !sourceHost) return null;

  const channel = isRecord(value.channel) ? value.channel : {};
  return {
    id,
    family: 'video',
    kind: optionalString(value.kind) || 'video',
    title,
    summary: optionalString(value.summary),
    url,
    thumbnail_url: optionalString(value.thumbnail_url),
    preview_url: optionalString(value.preview_url),
    embed_url: optionalString(value.embed_url),
    published_at: optionalString(value.published_at),
    duration: typeof value.duration === 'number' && value.duration >= 0 ? value.duration : 0,
    language: optionalString(value.language),
    category: optionalString(value.category),
    licence: optionalString(value.licence),
    live: value.live === true,
    source_host: sourceHost,
    channel: {
      name: optionalString(channel.name),
      handle: optionalString(channel.handle),
      url: optionalString(channel.url),
      host: optionalString(channel.host),
    },
  };
};

const normalizeProvider = (value: unknown): NativeDiscoveryProvider | null => {
  if (!isRecord(value)) return null;

  const type = optionalString(value.type);
  const host = optionalString(value.host);
  const status = value.status === 'ready' || value.status === 'unavailable' ? value.status : null;

  if (!type || !host || !status) return null;

  return {
    type,
    host,
    status,
    accepted_peer_count: typeof value.accepted_peer_count === 'number' && value.accepted_peer_count >= 0
      ? value.accepted_peer_count
      : 0,
  };
};

const normalizeCommunity = (value: unknown): NativeDiscoveryCommunity | null => {
  if (!isRecord(value) || value.family !== 'video' || value.kind !== 'video_community') return null;

  const id = optionalString(value.id);
  const title = optionalString(value.title);
  const url = optionalString(value.url);
  const sourceHost = optionalString(value.source_host);

  if (!id || !title || !url || !sourceHost) return null;

  const channel = isRecord(value.channel) ? value.channel : {};
  const federationDirections = Array.isArray(value.federation_directions)
    ? value.federation_directions.filter((direction): direction is 'follower' | 'following' => direction === 'follower' || direction === 'following')
    : [];

  return {
    id,
    family: 'video',
    kind: 'video_community',
    title,
    summary: optionalString(value.summary),
    url,
    local_url: optionalString(value.local_url),
    source_host: sourceHost,
    federation_directions: Array.from(new Set(federationDirections)),
    channel: {
      name: optionalString(channel.name),
      handle: optionalString(channel.handle),
      url: optionalString(channel.url),
      host: optionalString(channel.host),
    },
  };
};

const normalizeResponse = (value: unknown): NativeDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid native discovery response');

  const items = Array.isArray(value.items) ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is NativeDiscoveryItem => item !== null) : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.map(normalizeProvider).filter((provider): provider is NativeDiscoveryProvider => provider !== null)
    : [];
  const communities = Array.isArray(value.communities)
    ? value.communities.map(normalizeCommunity).filter((community): community is NativeDiscoveryCommunity => community !== null)
    : [];

  return {
    items,
    providers,
    communities,
    total: typeof value.total === 'number' && value.total >= 0 ? value.total : items.length,
    has_more: value.has_more === true,
    next_offset: typeof value.next_offset === 'number' && value.next_offset >= 0 ? value.next_offset : null,
  };
};

export const useNativeDiscovery = (query: string, offset: number, enabled: boolean, mode: NativeDiscoveryMode) => {
  const api = useApi();

  const result = useQuery<NativeDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'video', mode, query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'video',
        q: query,
        limit: '12',
        mode,
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useNativeDiscovery.ts */
