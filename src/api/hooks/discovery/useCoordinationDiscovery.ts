/*
 * Unfathomably coordination discovery
 * ------------------------------------
 *
 * File: useCoordinationDiscovery.ts
 *
 * Purpose:
 *   Search public ValueFlows and mutual-aid objects already known locally.
 *
 * Responsibilities:
 *   - browse active local records immediately and run indexed text searches
 *   - validate bounded roles, participants, terms, lifecycle, and source fields
 *   - retain the normal local object-resolution handoff
 *
 * This file intentionally does not contact Bonfire servers, query GraphQL,
 * infer private coordination records, or execute economic actions.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface CoordinationQuantity {
  value: number;
  unit?: string;
}

export interface CoordinationIntent {
  action?: string;
  activitypub_url?: string;
  begins_at?: string;
  ends_at?: string;
  location?: string;
  location_url?: string;
  provider_url?: string;
  quantity?: CoordinationQuantity;
  receiver_url?: string;
  resource?: string;
  resource_url?: string;
  role: string;
  title?: string;
}

export interface CoordinationDiscoveryItem {
  id: string;
  family: 'coordination';
  kind: string;
  role: string;
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  actor_url?: string;
  publisher_url?: string;
  publisher_label?: string;
  provider_url?: string;
  provider_label?: string;
  receiver_url?: string;
  receiver_label?: string;
  purpose?: string;
  action?: string;
  state?: string;
  quantity?: CoordinationQuantity;
  location?: string;
  tags: string[];
  primary_intents: CoordinationIntent[];
  reciprocal_intents: CoordinationIntent[];
  primary_intent_count: number;
  reciprocal_intent_count: number;
  exchange: boolean;
  availability: string;
  actionable: boolean;
  historical: boolean;
  begins_at?: string;
  ends_at?: string;
  published_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface CoordinationDiscoveryProvider {
  type: 'local_coordination';
  host: string;
  status: 'ready';
}

interface CoordinationDiscoveryResponse {
  items: CoordinationDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: CoordinationDiscoveryProvider[];
}

const emptyResponse: CoordinationDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const booleanValue = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback;

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

const normalizeQuantity = (value: unknown): CoordinationQuantity | undefined => {
  if (!isRecord(value) || typeof value.value !== 'number' || !Number.isFinite(value.value) || value.value < 0) return undefined;
  return { value: value.value, unit: stringValue(value.unit) };
};

const normalizeIntent = (value: unknown): CoordinationIntent | null => {
  if (!isRecord(value)) return null;

  const role = stringValue(value.role) || 'intent';
  const activitypubUrl = secureUrl(value.activitypub_url);
  const title = stringValue(value.title);
  const resource = stringValue(value.resource);
  const action = stringValue(value.action);

  if (!activitypubUrl && !title && !resource && !action) return null;

  return {
    role,
    activitypub_url: activitypubUrl,
    title,
    resource,
    action,
    quantity: normalizeQuantity(value.quantity),
    location: stringValue(value.location),
    location_url: secureUrl(value.location_url),
    provider_url: secureUrl(value.provider_url),
    receiver_url: secureUrl(value.receiver_url),
    resource_url: secureUrl(value.resource_url),
    begins_at: stringValue(value.begins_at),
    ends_at: stringValue(value.ends_at),
  };
};

const normalizeIntentList = (value: unknown): CoordinationIntent[] => Array.isArray(value)
  ? value.map(normalizeIntent).filter((intent): intent is CoordinationIntent => intent !== null).slice(0, 4)
  : [];

const boundedCount = (value: unknown, fallback: number): number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 100 ? value : fallback
);

const normalizeItem = (value: unknown): CoordinationDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'coordination' || value.local_action !== 'resolve') return null;

  const id = stringValue(value.id);
  const kind = stringValue(value.kind);
  const role = stringValue(value.role);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !kind || !role || !title || !url || !activitypubUrl || !sourceHost) return null;

  const primaryIntents = normalizeIntentList(value.primary_intents);
  const reciprocalIntents = normalizeIntentList(value.reciprocal_intents);
  const availability = stringValue(value.availability) || stringValue(value.state) || 'active';
  const historical = booleanValue(value.historical, role === 'economic_event');
  const actionable = booleanValue(
    value.actionable,
    ['offer', 'need', 'proposal', 'intent'].includes(role) && !historical,
  );

  return {
    id,
    family: 'coordination',
    kind,
    role,
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: secureUrl(value.actor_url),
    publisher_url: secureUrl(value.publisher_url),
    publisher_label: stringValue(value.publisher_label),
    provider_url: secureUrl(value.provider_url),
    provider_label: stringValue(value.provider_label),
    receiver_url: secureUrl(value.receiver_url),
    receiver_label: stringValue(value.receiver_label),
    purpose: stringValue(value.purpose),
    action: stringValue(value.action),
    state: stringValue(value.state),
    quantity: normalizeQuantity(value.quantity),
    location: stringValue(value.location),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8)
      : [],
    primary_intents: primaryIntents,
    reciprocal_intents: reciprocalIntents,
    primary_intent_count: boundedCount(value.primary_intent_count, primaryIntents.length),
    reciprocal_intent_count: boundedCount(value.reciprocal_intent_count, reciprocalIntents.length),
    exchange: booleanValue(value.exchange, reciprocalIntents.length > 0),
    availability,
    actionable,
    historical,
    begins_at: stringValue(value.begins_at),
    ends_at: stringValue(value.ends_at),
    published_at: stringValue(value.published_at),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): CoordinationDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid coordination discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is CoordinationDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): CoordinationDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      return provider.type === 'local_coordination' && provider.status === 'ready' && host
        ? [{ type: 'local_coordination', host, status: 'ready' }]
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

export const useCoordinationDiscovery = (query: string, offset: number, requested: boolean) => {
  const api = useApi();

  const result = useQuery<CoordinationDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'coordination', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'coordination', q: query, limit: '24', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: requested,
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useCoordinationDiscovery.ts */
