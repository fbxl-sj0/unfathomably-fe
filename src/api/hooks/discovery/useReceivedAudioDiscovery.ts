/*
  Project: Unfathomably FE
  File: useReceivedAudioDiscovery.ts
  Purpose: Load and validate Audio objects already received through federation.

  Responsibilities:
  - call the native discovery endpoint with the received-audio family
  - validate useful artist, album, attribution, and source metadata
  - expose stable query state to the received-audio panel

  This file intentionally does not request or play remote media.
*/

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface ReceivedAudioDiscoveryItem {
  id: string;
  family: 'audio';
  kind: 'received_audio';
  title: string;
  summary: string | null;
  url: string;
  activitypub_url: string;
  actor_url: string | null;
  actor_label: string | null;
  artist: string | null;
  artist_url: string | null;
  album: string | null;
  album_url: string | null;
  track_url: string | null;
  library_url: string | null;
  image_url: string | null;
  media_url: string | null;
  media_type: string | null;
  duration: string | null;
  licence: string | null;
  tags: string[];
  platform_hint: 'funkwhale' | 'activitypub_audio';
  published_at: string | null;
  source_host: string | null;
  local_action: 'resolve';
}

interface ReceivedAudioDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface ReceivedAudioDiscoveryResponse {
  items: ReceivedAudioDiscoveryItem[];
  providers: ReceivedAudioDiscoveryProvider[];
}

const emptyResponse: ReceivedAudioDiscoveryResponse = {
  items: [],
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const secureUrl = (value: unknown): string | null => {
  const url = stringValue(value);
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? url : null;
  } catch {
    return null;
  }
};

const normalizeItem = (value: unknown): ReceivedAudioDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'audio' || value.kind !== 'received_audio' || value.local_action !== 'resolve') {
    return null;
  }

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const platformHint = value.platform_hint === 'funkwhale' ? 'funkwhale' : 'activitypub_audio';

  if (!id || !title || !url || !activitypubUrl) return null;

  return {
    id,
    family: 'audio',
    kind: 'received_audio',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: secureUrl(value.actor_url),
    actor_label: stringValue(value.actor_label),
    artist: stringValue(value.artist),
    artist_url: secureUrl(value.artist_url),
    album: stringValue(value.album),
    album_url: secureUrl(value.album_url),
    track_url: secureUrl(value.track_url),
    library_url: secureUrl(value.library_url),
    image_url: secureUrl(value.image_url),
    media_url: secureUrl(value.media_url),
    media_type: stringValue(value.media_type),
    duration: stringValue(value.duration),
    licence: stringValue(value.licence),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    platform_hint: platformHint,
    published_at: stringValue(value.published_at),
    source_host: stringValue(value.source_host),
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ReceivedAudioDiscoveryResponse => {
  if (!isRecord(value)) return emptyResponse;

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ReceivedAudioDiscoveryProvider[] => {
      if (!isRecord(provider) || provider.type !== 'local_federation_cache' || provider.status !== 'ready') return [];

      const host = stringValue(provider.host);
      return host ? [{ type: 'local_federation_cache', host, status: 'ready' }] : [];
    })
    : [];

  return {
    items: Array.isArray(value.items)
      ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ReceivedAudioDiscoveryItem => item !== null)
      : [],
    providers,
  };
};

export const useReceivedAudioDiscovery = (
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();

  const result = useQuery<ReceivedAudioDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedAudio', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'received_audio',
        q: query.trim(),
        limit: '12',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useReceivedAudioDiscovery.ts */
