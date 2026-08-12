/*
 * Unfathomably audio discovery
 * ----------------------------
 *
 * File: useAudioDiscovery.ts
 *
 * Purpose:
 *   Load public catalog tracks from backend-approved Funkwhale peers.
 *
 * Responsibilities:
 *   - request bounded audio pages from the native discovery API
 *   - validate track, release, attribution, and provider metadata
 *   - distinguish unavailable providers from valid empty searches
 *
 * This file intentionally does not play, download, or directly query remote
 * audio services from the browser.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface AudioAccount {
  name?: string;
  handle?: string;
  url?: string;
}

export interface AudioDiscoveryItem {
  id: string;
  family: 'audio';
  title: string;
  url: string;
  image_url?: string;
  published_at?: string;
  duration: number;
  artist?: string;
  album?: string;
  release_date?: string;
  licence?: string;
  tags: string[];
  source_host: string;
  account: AudioAccount;
}

export interface AudioDiscoveryProvider {
  type: 'funkwhale';
  host: string;
  status: 'ready' | 'unavailable';
}

interface AudioDiscoveryResponse {
  items: AudioDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: AudioDiscoveryProvider[];
}

const emptyResponse: AudioDiscoveryResponse = { items: [], has_more: false, next_offset: null, providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const numberValue = (value: unknown): number | undefined => typeof value === 'number' && value >= 0 ? value : undefined;

const normalizeItem = (value: unknown): AudioDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'audio') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = stringValue(value.url);
  const sourceHost = stringValue(value.source_host);
  const duration = numberValue(value.duration);
  const account = isRecord(value.account) ? value.account : {};

  if (!id || !title || !url || !sourceHost || typeof duration !== 'number') return null;

  return {
    id,
    family: 'audio',
    title,
    url,
    image_url: stringValue(value.image_url),
    published_at: stringValue(value.published_at),
    duration,
    artist: stringValue(value.artist),
    album: stringValue(value.album),
    release_date: stringValue(value.release_date),
    licence: stringValue(value.licence),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 6) : [],
    source_host: sourceHost,
    account: {
      name: stringValue(account.name),
      handle: stringValue(account.handle),
      url: stringValue(account.url),
    },
  };
};

const normalizeResponse = (value: unknown): AudioDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid audio discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is AudioDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): AudioDiscoveryProvider[] => {
      if (!isRecord(provider) || provider.type !== 'funkwhale') return [];
      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return host && status ? [{ type: 'funkwhale', host, status }] : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const useAudioDiscovery = (query: string, offset: number, enabled: boolean) => {
  const api = useApi();
  const result = useQuery<AudioDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'audio', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'audio', q: query, limit: '12', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useAudioDiscovery.ts */
