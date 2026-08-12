/*
 * Unfathomably PeerTube channel discovery
 * ----------------------------------------
 *
 * File: usePeerTubeChannelDiscovery.ts
 *
 * Purpose:
 *   Load public PeerTube channel actors known through an approved bridge.
 *
 * Responsibilities:
 *   - request one explicit bounded channel search
 *   - validate actor identity, ownership, and presentation metadata
 *   - preserve the actor URL for deliberate local resolution
 *
 * This file intentionally does not contact PeerTube directly, subscribe to a
 * channel, or mistake the owning account for the channel actor.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface PeerTubeChannelDiscoveryItem {
  id: string;
  family: 'video';
  kind: 'video_channel';
  title: string;
  summary?: string;
  support?: string;
  url: string;
  activitypub_url: string;
  avatar_url?: string;
  banner_url?: string;
  handle: string;
  source_host: string;
  owner_name?: string;
  owner_url?: string;
  followers_count: number;
  following_count: number;
  provider_host: string;
  local_action: 'resolve';
}

interface PeerTubeChannelProvider {
  type: 'peertube';
  host: string;
  status: 'ready' | 'unavailable';
  accepted_peer_count: number;
}

interface PeerTubeChannelDiscoveryResponse {
  items: PeerTubeChannelDiscoveryItem[];
  total: number;
  has_more: boolean;
  next_offset: number | null;
  providers: PeerTubeChannelProvider[];
}

const emptyResponse: PeerTubeChannelDiscoveryResponse = {
  items: [],
  total: 0,
  has_more: false,
  next_offset: null,
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const secureUrl = (value: unknown): string | undefined => {
  const text = stringValue(value);
  if (!text || text.length > 2000) return undefined;

  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const numberValue = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

const normalizeItem = (value: unknown): PeerTubeChannelDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'video' || value.kind !== 'video_channel') return null;

  const id = secureUrl(value.id);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const handle = stringValue(value.handle);
  const sourceHost = stringValue(value.source_host);
  const providerHost = stringValue(value.provider_host);

  if (
    !id
    || !title
    || !url
    || !activitypubUrl
    || !handle
    || !sourceHost
    || !providerHost
    || value.local_action !== 'resolve'
  ) return null;

  return {
    id,
    family: 'video',
    kind: 'video_channel',
    title,
    summary: stringValue(value.summary),
    support: stringValue(value.support),
    url,
    activitypub_url: activitypubUrl,
    avatar_url: secureUrl(value.avatar_url),
    banner_url: secureUrl(value.banner_url),
    handle,
    source_host: sourceHost,
    owner_name: stringValue(value.owner_name),
    owner_url: secureUrl(value.owner_url),
    followers_count: numberValue(value.followers_count) || 0,
    following_count: numberValue(value.following_count) || 0,
    provider_host: providerHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): PeerTubeChannelDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid PeerTube channel discovery response');

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): PeerTubeChannelProvider[] => {
      if (!isRecord(provider)) return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable'
        ? provider.status
        : null;

      return provider.type === 'peertube' && host && status
        ? [{
          type: 'peertube',
          host,
          status,
          accepted_peer_count: numberValue(provider.accepted_peer_count) || 0,
        }]
        : [];
    })
    : [];

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is PeerTubeChannelDiscoveryItem => item !== null)
    : [];

  return {
    items,
    providers,
    total: numberValue(value.total) || items.length,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const usePeerTubeChannelDiscovery = (
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();
  const result = useQuery<PeerTubeChannelDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'peertube_channel', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'peertube_channel',
        q: query,
        limit: '12',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of usePeerTubeChannelDiscovery.ts */
