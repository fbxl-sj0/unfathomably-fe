/*
 * Unfathomably received video playlist discovery
 * ------------------------------------------------
 *
 * File: useVideoPlaylistDiscovery.ts
 *
 * Purpose:
 *   Load locally received public PeerTube-compatible playlist objects.
 *
 * Responsibilities:
 *   - request bounded local playlist browse and search pages
 *   - validate playlist, channel, artwork, count, and publication metadata
 *   - preserve local object resolution as the collection handoff
 *
 * This file intentionally does not fetch remote collection pages, enumerate
 * missing videos, contact PeerTube directly, or accept audio playlists.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface VideoPlaylistChannel {
  url: string;
  name?: string;
}

export interface VideoPlaylistDiscoveryItem {
  id: string;
  family: 'video';
  kind: 'video_playlist';
  title: string;
  description?: string;
  url: string;
  activitypub_url: string;
  thumbnail_url?: string;
  channel?: VideoPlaylistChannel;
  item_count?: number;
  known_item_count: number;
  channel_position: number;
  published_at?: string;
  updated_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface VideoPlaylistDiscoveryProvider {
  type: 'local_video_playlist';
  host: string;
  status: 'ready' | 'unavailable';
}

interface VideoPlaylistDiscoveryResponse {
  items: VideoPlaylistDiscoveryItem[];
  providers: VideoPlaylistDiscoveryProvider[];
  has_more: boolean;
  next_offset: number | null;
}

const emptyResponse: VideoPlaylistDiscoveryResponse = {
  items: [],
  providers: [],
  has_more: false,
  next_offset: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const boundedString = (value: unknown, maximum: number): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && text.length <= maximum ? text : undefined;
};
const secureUrl = (value: unknown): string | undefined => {
  const text = boundedString(value, 2000);
  if (!text) return undefined;

  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};
const previewUrl = (value: unknown): string | undefined => {
  const text = boundedString(value, 2000);
  if (!text) return undefined;
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  return secureUrl(text);
};
const nonnegativeInteger = (value: unknown, maximum = 10000000): number | undefined => (
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum ? value : undefined
);

const normalizeChannel = (value: unknown): VideoPlaylistChannel | undefined => {
  if (!isRecord(value)) return undefined;

  const url = secureUrl(value.url);
  if (!url) return undefined;

  return {
    url,
    name: boundedString(value.name, 300),
  };
};

const normalizeItem = (value: unknown): VideoPlaylistDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'video' || value.kind !== 'video_playlist' || value.local_action !== 'resolve') return null;

  const id = secureUrl(value.id);
  const title = boundedString(value.title, 500);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const sourceHost = boundedString(value.source_host, 253);
  const channelPosition = nonnegativeInteger(value.channel_position);

  if (!id || !title || !url || !activitypubUrl || !sourceHost || channelPosition === undefined) return null;

  return {
    id,
    family: 'video',
    kind: 'video_playlist',
    title,
    description: boundedString(value.description, 2000),
    url,
    activitypub_url: activitypubUrl,
    thumbnail_url: previewUrl(value.thumbnail_url),
    channel: normalizeChannel(value.channel),
    item_count: nonnegativeInteger(value.item_count),
    known_item_count: nonnegativeInteger(value.known_item_count) || 0,
    channel_position: channelPosition,
    published_at: boundedString(value.published_at, 100),
    updated_at: boundedString(value.updated_at, 100),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): VideoPlaylistDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid received video playlist discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is VideoPlaylistDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): VideoPlaylistDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = boundedString(provider.host, 253);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'local_video_playlist' && host && status
        ? [{ type: 'local_video_playlist', host, status }]
        : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: typeof value.next_offset === 'number' && value.next_offset >= 0 ? value.next_offset : null,
  };
};

export const useVideoPlaylistDiscovery = (query: string, offset: number, requested: boolean) => {
  const api = useApi();

  const result = useQuery<VideoPlaylistDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'received_playlist', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'received_playlist',
        q: query,
        limit: '16',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: requested,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useVideoPlaylistDiscovery.ts */
