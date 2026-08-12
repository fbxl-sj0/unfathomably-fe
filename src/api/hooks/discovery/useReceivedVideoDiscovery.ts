/*
 * Unfathomably received video discovery
 * --------------------------------------
 *
 * File: useReceivedVideoDiscovery.ts
 *
 * Purpose:
 *   Load public PeerTube-compatible Video objects already known locally.
 *
 * Responsibilities:
 *   - request bounded local browse and search pages
 *   - validate video, channel, thumbnail, policy, and publication metadata
 *   - preserve local object resolution as the interaction handoff
 *
 * This file intentionally does not contact PeerTube directly, fetch video
 * files, autoplay media, or claim that a live-broadcast object is live now.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface ReceivedVideoChannel {
  url: string;
  name?: string;
  owner_url?: string;
  owner_name?: string;
}

export interface ReceivedVideoDiscoveryItem {
  id: string;
  family: 'video';
  kind: 'received_video';
  title: string;
  description?: string;
  content_warning?: string;
  url: string;
  activitypub_url: string;
  embed_url?: string;
  thumbnail_url?: string;
  sensitive: boolean;
  duration_seconds?: number;
  channel?: ReceivedVideoChannel;
  category?: string;
  language?: string;
  licence?: string;
  tags: string[];
  views?: number;
  downloads?: number;
  is_live_broadcast?: boolean;
  scheduled_at?: string;
  wait_transcoding?: boolean;
  download_enabled?: boolean;
  comments_enabled?: boolean;
  published_at?: string;
  updated_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface ReceivedVideoDiscoveryProvider {
  type: 'local_video';
  host: string;
  status: 'ready' | 'unavailable';
}

interface ReceivedVideoDiscoveryResponse {
  items: ReceivedVideoDiscoveryItem[];
  providers: ReceivedVideoDiscoveryProvider[];
  has_more: boolean;
  next_offset: number | null;
}

const emptyResponse: ReceivedVideoDiscoveryResponse = {
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
const nonnegativeInteger = (value: unknown, maximum = 10000000000): number | undefined => (
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum ? value : undefined
);
const optionalBoolean = (value: unknown): boolean | undefined => typeof value === 'boolean' ? value : undefined;

const normalizeChannel = (value: unknown): ReceivedVideoChannel | undefined => {
  if (!isRecord(value)) return undefined;

  const url = secureUrl(value.url);
  if (!url) return undefined;

  return {
    url,
    name: boundedString(value.name, 300),
    owner_url: secureUrl(value.owner_url),
    owner_name: boundedString(value.owner_name, 300),
  };
};

const normalizeItem = (value: unknown): ReceivedVideoDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'video' || value.kind !== 'received_video' || value.local_action !== 'resolve') return null;

  const id = secureUrl(value.id);
  const title = boundedString(value.title, 500);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const sourceHost = boundedString(value.source_host, 253);

  if (!id || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family: 'video',
    kind: 'received_video',
    title,
    description: boundedString(value.description, 2000),
    content_warning: boundedString(value.content_warning, 500),
    url,
    activitypub_url: activitypubUrl,
    embed_url: secureUrl(value.embed_url),
    thumbnail_url: value.sensitive === true ? undefined : previewUrl(value.thumbnail_url),
    sensitive: value.sensitive === true,
    duration_seconds: nonnegativeInteger(value.duration_seconds, 100000000),
    channel: normalizeChannel(value.channel),
    category: boundedString(value.category, 200),
    language: boundedString(value.language, 200),
    licence: boundedString(value.licence, 200),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8)
      : [],
    views: nonnegativeInteger(value.views),
    downloads: nonnegativeInteger(value.downloads),
    is_live_broadcast: optionalBoolean(value.is_live_broadcast),
    scheduled_at: boundedString(value.scheduled_at, 100),
    wait_transcoding: optionalBoolean(value.wait_transcoding),
    download_enabled: optionalBoolean(value.download_enabled),
    comments_enabled: optionalBoolean(value.comments_enabled),
    published_at: boundedString(value.published_at, 100),
    updated_at: boundedString(value.updated_at, 100),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ReceivedVideoDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid received video discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ReceivedVideoDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ReceivedVideoDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = boundedString(provider.host, 253);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'local_video' && host && status
        ? [{ type: 'local_video', host, status }]
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

export const useReceivedVideoDiscovery = (query: string, offset: number, requested: boolean) => {
  const api = useApi();

  const result = useQuery<ReceivedVideoDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'received_video', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'received_video',
        q: query,
        limit: '16',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: requested,
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useReceivedVideoDiscovery.ts */
