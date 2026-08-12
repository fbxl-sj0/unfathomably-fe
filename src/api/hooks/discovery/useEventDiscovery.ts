/*
 * Unfathomably event discovery
 * ----------------------------
 *
 * File: useEventDiscovery.ts
 *
 * Purpose:
 *   Load public federated events from backend-approved event indexes.
 *
 * Responsibilities:
 *   - request bounded event pages from the native discovery API
 *   - validate event, location, organizer, and provider metadata
 *   - distinguish unavailable providers from valid empty searches
 *
 * This file intentionally does not contact Mobilizon instances directly or
 * RSVP on behalf of the user.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface EventLocation {
  name?: string;
  street_address?: string;
  postal_code?: string;
  locality?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface EventActor {
  id?: string;
  name?: string;
  handle?: string;
  url?: string;
}

export interface EventDiscoveryItem {
  id: string;
  family: 'event';
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  image_url?: string;
  begins_at: string;
  ends_at?: string;
  source_host: string;
  online: boolean;
  online_url?: string;
  participation_url?: string;
  phone_address?: string;
  timezone?: string;
  language?: string;
  capacity?: number;
  remaining_capacity?: number;
  participant_count?: number;
  join_mode?: string;
  attendance_mode?: string;
  anonymous_participation: boolean;
  comments_enabled?: boolean;
  replies_moderation?: string;
  replies_url?: string;
  status?: string;
  lifecycle: 'upcoming' | 'ongoing' | 'tentative' | 'postponed' | 'rescheduled' | 'cancelled' | 'past' | 'unknown';
  category?: string;
  tags: string[];
  location: EventLocation;
  organizer: EventActor;
  contacts: EventActor[];
  published_at?: string;
}

export interface EventDiscoveryProvider {
  type: 'gancio' | 'mobilizon' | 'local_federation_cache';
  host: string;
  status: 'ready' | 'unavailable';
}

interface EventDiscoveryResponse {
  items: EventDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: EventDiscoveryProvider[];
}

const emptyResponse: EventDiscoveryResponse = { items: [], has_more: false, next_offset: null, providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const numberValue = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
const coordinateValue = (value: unknown, minimum: number, maximum: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum ? value : undefined;
const webUrl = (value: unknown): string | undefined => {
  const candidate = stringValue(value)?.trim();
  if (!candidate || candidate.length > 2048) return undefined;

  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};
const dateTimeValue = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  return candidate && !Number.isNaN(new Date(candidate).getTime()) ? candidate : undefined;
};
const normalizeActor = (value: unknown): EventActor => {
  if (!isRecord(value)) return {};

  return {
    id: stringValue(value.id),
    name: stringValue(value.name),
    handle: stringValue(value.handle),
    url: webUrl(value.url),
  };
};
const lifecycleValue = (value: unknown): EventDiscoveryItem['lifecycle'] => {
  const lifecycles: EventDiscoveryItem['lifecycle'][] = ['upcoming', 'ongoing', 'tentative', 'postponed', 'rescheduled', 'cancelled', 'past', 'unknown'];
  return lifecycles.includes(value as EventDiscoveryItem['lifecycle']) ? value as EventDiscoveryItem['lifecycle'] : 'unknown';
};

const normalizeItem = (value: unknown): EventDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'event') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const beginsAt = dateTimeValue(value.begins_at);
  const sourceHost = stringValue(value.source_host);
  const location = isRecord(value.location) ? value.location : {};
  const organizer = isRecord(value.organizer) ? value.organizer : {};

  if (!id || !title || !url || !activitypubUrl || !beginsAt || !sourceHost) return null;

  return {
    id,
    family: 'event',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    image_url: webUrl(value.image_url),
    begins_at: beginsAt,
    ends_at: dateTimeValue(value.ends_at),
    source_host: sourceHost,
    online: value.online === true,
    online_url: webUrl(value.online_url),
    participation_url: webUrl(value.participation_url),
    phone_address: stringValue(value.phone_address),
    timezone: stringValue(value.timezone),
    language: stringValue(value.language),
    capacity: numberValue(value.capacity),
    remaining_capacity: numberValue(value.remaining_capacity),
    participant_count: numberValue(value.participant_count),
    join_mode: stringValue(value.join_mode),
    attendance_mode: stringValue(value.attendance_mode),
    anonymous_participation: value.anonymous_participation === true,
    comments_enabled: typeof value.comments_enabled === 'boolean' ? value.comments_enabled : undefined,
    replies_moderation: stringValue(value.replies_moderation),
    replies_url: webUrl(value.replies_url),
    status: stringValue(value.status),
    lifecycle: lifecycleValue(value.lifecycle),
    category: stringValue(value.category),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 6) : [],
    location: {
      name: stringValue(location.name),
      street_address: stringValue(location.street_address),
      postal_code: stringValue(location.postal_code),
      locality: stringValue(location.locality),
      region: stringValue(location.region),
      country: stringValue(location.country),
      latitude: coordinateValue(location.latitude, -90, 90),
      longitude: coordinateValue(location.longitude, -180, 180),
    },
    organizer: normalizeActor(organizer),
    contacts: Array.isArray(value.contacts) ? value.contacts.map(normalizeActor).filter(contact => contact.url).slice(0, 8) : [],
    published_at: dateTimeValue(value.published_at),
  };
};

const normalizeResponse = (value: unknown): EventDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid event discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is EventDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): EventDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const providerType = provider.type;
      if (providerType !== 'mobilizon' && providerType !== 'gancio' && providerType !== 'local_federation_cache') return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return host && status ? [{ type: providerType, host, status }] : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const useEventDiscovery = (query: string, offset: number, enabled: boolean) => {
  const api = useApi();
  const result = useQuery<EventDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedEvent', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'received_event', q: query, limit: '12', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useEventDiscovery.ts */
