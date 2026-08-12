/*
  Project: Unfathomably FE
  File: useMusicCatalogDiscovery.ts
  Purpose: Load and validate durable music-catalog objects already received.

  Responsibilities:
  - call native discovery for artists, albums, libraries, and playlists
  - validate ownership, artwork, collection, and release metadata
  - expose stable local-search state to the music-catalog panel

  This file intentionally does not crawl remote collection pages.
*/

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

type MusicCatalogKind = 'artist' | 'album' | 'library' | 'playlist';

export interface MusicCatalogDiscoveryItem {
  id: string;
  family: 'audio';
  kind: MusicCatalogKind;
  title: string;
  summary: string | null;
  url: string;
  activitypub_url: string;
  actor_url: string | null;
  actor_label: string | null;
  image_url: string | null;
  artist: string | null;
  artist_url: string | null;
  released: string | null;
  musicbrainz_id: string | null;
  musicbrainz_url: string | null;
  total_items: number | null;
  first_page: string | null;
  last_page: string | null;
  current_page: string | null;
  followers_url: string | null;
  published_at: string | null;
  source_host: string | null;
  local_action: 'resolve';
}

interface MusicCatalogDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface MusicCatalogDiscoveryResponse {
  items: MusicCatalogDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: MusicCatalogDiscoveryProvider[];
}

const emptyResponse: MusicCatalogDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const kinds: MusicCatalogKind[] = ['artist', 'album', 'library', 'playlist'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const secureUrl = (value: unknown): string | null => {
  const url = stringValue(value);
  if (!url) return null;

  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

const normalizeItem = (value: unknown): MusicCatalogDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'audio' || value.local_action !== 'resolve' || !kinds.includes(value.kind as MusicCatalogKind)) {
    return null;
  }

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);

  if (!id || !title || !url || !activitypubUrl) return null;

  return {
    id,
    family: 'audio',
    kind: value.kind as MusicCatalogKind,
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: secureUrl(value.actor_url),
    actor_label: stringValue(value.actor_label),
    image_url: secureUrl(value.image_url),
    artist: stringValue(value.artist),
    artist_url: secureUrl(value.artist_url),
    released: stringValue(value.released),
    musicbrainz_id: stringValue(value.musicbrainz_id),
    musicbrainz_url: secureUrl(value.musicbrainz_url),
    total_items: typeof value.total_items === 'number' && Number.isInteger(value.total_items) && value.total_items >= 0
      ? value.total_items
      : null,
    first_page: secureUrl(value.first_page),
    last_page: secureUrl(value.last_page),
    current_page: secureUrl(value.current_page),
    followers_url: secureUrl(value.followers_url),
    published_at: stringValue(value.published_at),
    source_host: stringValue(value.source_host),
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): MusicCatalogDiscoveryResponse => {
  if (!isRecord(value)) return emptyResponse;

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): MusicCatalogDiscoveryProvider[] => {
      if (!isRecord(provider) || provider.type !== 'local_federation_cache' || provider.status !== 'ready') return [];

      const host = stringValue(provider.host);
      return host ? [{ type: 'local_federation_cache', host, status: 'ready' }] : [];
    })
    : [];

  return {
    items: Array.isArray(value.items)
      ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is MusicCatalogDiscoveryItem => item !== null)
      : [],
    has_more: value.has_more === true,
    next_offset: typeof value.next_offset === 'number' && Number.isInteger(value.next_offset) && value.next_offset >= 0
      ? value.next_offset
      : null,
    providers,
  };
};

export const useMusicCatalogDiscovery = (
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();

  const result = useQuery<MusicCatalogDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'musicCatalog', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'music_catalog',
        q: query.trim(),
        limit: '12',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: enabled && query.trim().length !== 1,
    staleTime: 5 * 60 * 1000,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useMusicCatalogDiscovery.ts */
