/*
 * Unfathomably Mobilizon discovery
 * --------------------------------
 *
 * File: useMobilizonDiscovery.ts
 *
 * Purpose:
 *   Load public event and organizer records from backend-approved Mobilizon
 *   search indexes.
 *
 * Responsibilities:
 *   - request one explicit event or organizer result page
 *   - validate every remote record before it reaches presentation code
 *   - preserve ActivityPub identifiers for deliberate local resolution
 *
 * This file intentionally does not contact Mobilizon directly, follow an
 * organizer, join an event, or persist search results.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export type MobilizonDiscoveryMode = 'events' | 'organizers';

interface MobilizonDiscoveryBase {
  id: string;
  family: 'event';
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  image_url?: string;
  source_host: string;
  provider_host: string;
  local_action: 'resolve';
  language?: string;
}

export interface MobilizonEventDiscoveryItem extends MobilizonDiscoveryBase {
  kind: 'event';
  begins_at?: string;
  ends_at?: string;
  venue_name?: string;
  venue_address?: string;
  organizer_name?: string;
  organizer_url?: string;
  creator_name?: string;
  creator_url?: string;
  group_name?: string;
  group_url?: string;
  category?: string;
  status?: string;
  join_mode?: string;
  is_online: boolean;
  participant_count: number;
  capacity: number;
  remaining_capacity?: number;
  tags: string[];
}

export interface MobilizonOrganizerDiscoveryItem extends MobilizonDiscoveryBase {
  kind: 'organizer';
  handle?: string;
  member_count: number;
  openness?: string;
  manually_approves_followers: boolean;
}

export type MobilizonDiscoveryItem =
  | MobilizonEventDiscoveryItem
  | MobilizonOrganizerDiscoveryItem;

interface MobilizonDiscoveryProvider {
  type: 'mobilizon_search';
  host: string;
  status: 'ready' | 'unavailable';
}

interface MobilizonDiscoveryResponse {
  items: MobilizonDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: MobilizonDiscoveryProvider[];
}

const emptyResponse: MobilizonDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const numberValue = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

const baseItem = (value: Record<string, unknown>): MobilizonDiscoveryBase | null => {
  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = stringValue(value.url);
  const activitypubUrl = stringValue(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);
  const providerHost = stringValue(value.provider_host);

  if (
    value.family !== 'event'
    || !id
    || !title
    || !url
    || !activitypubUrl
    || !sourceHost
    || !providerHost
    || value.local_action !== 'resolve'
  ) return null;

  return {
    id,
    family: 'event',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    image_url: stringValue(value.image_url),
    source_host: sourceHost,
    provider_host: providerHost,
    local_action: 'resolve',
    language: stringValue(value.language),
  };
};

const normalizeItem = (value: unknown): MobilizonDiscoveryItem | null => {
  if (!isRecord(value)) return null;

  const base = baseItem(value);
  if (!base) return null;

  if (value.kind === 'event') {
    return {
      ...base,
      kind: 'event',
      begins_at: stringValue(value.begins_at),
      ends_at: stringValue(value.ends_at),
      venue_name: stringValue(value.venue_name),
      venue_address: stringValue(value.venue_address),
      organizer_name: stringValue(value.organizer_name),
      organizer_url: stringValue(value.organizer_url),
      creator_name: stringValue(value.creator_name),
      creator_url: stringValue(value.creator_url),
      group_name: stringValue(value.group_name),
      group_url: stringValue(value.group_url),
      category: stringValue(value.category),
      status: stringValue(value.status),
      join_mode: stringValue(value.join_mode),
      is_online: value.is_online === true,
      participant_count: numberValue(value.participant_count) || 0,
      capacity: numberValue(value.capacity) || 0,
      remaining_capacity: numberValue(value.remaining_capacity),
      tags: Array.isArray(value.tags)
        ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8)
        : [],
    };
  }

  if (value.kind === 'organizer') {
    return {
      ...base,
      kind: 'organizer',
      handle: stringValue(value.handle),
      member_count: numberValue(value.member_count) || 0,
      openness: stringValue(value.openness),
      manually_approves_followers: value.manually_approves_followers === true,
    };
  }

  return null;
};

const normalizeResponse = (value: unknown): MobilizonDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid Mobilizon discovery response');

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): MobilizonDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable'
        ? provider.status
        : null;

      return provider.type === 'mobilizon_search' && host && status
        ? [{ type: 'mobilizon_search', host, status }]
        : [];
    })
    : [];

  return {
    items: Array.isArray(value.items)
      ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is MobilizonDiscoveryItem => item !== null)
      : [],
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const useMobilizonDiscovery = (
  mode: MobilizonDiscoveryMode,
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();
  const family = mode === 'events' ? 'mobilizon_event' : 'mobilizon_group';
  const result = useQuery<MobilizonDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, family, query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family,
        q: query,
        limit: '16',
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

/* end of useMobilizonDiscovery.ts */
