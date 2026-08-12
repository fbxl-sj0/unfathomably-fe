/*
 * Unfathomably marketplace discovery
 * -----------------------------------
 *
 * File: useMarketplaceDiscovery.ts
 *
 * Purpose:
 *   Load explicitly requested classified listings from backend-approved
 *   Flohmarkt marketplace peers.
 *
 * Responsibilities:
 *   - request a bounded, user-submitted marketplace search
 *   - validate listing links and display metadata before it reaches the UI
 *   - distinguish unavailable peers from a valid empty search result
 *
 * This file intentionally does not send a user's location, scrape additional
 * marketplaces, or create a conversation on the remote listing.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export interface MarketplaceDiscoveryItem {
  id: string;
  family: 'market';
  kind: string;
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  image_url?: string;
  price?: string;
  currency?: string;
  currency_url?: string;
  purpose: 'offer' | 'request';
  availability?: string;
  published_at?: string;
  expires_at?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  condition?: string;
  delivery?: string;
  category?: string;
  seller_url?: string;
  seller_id?: string;
  seller_label?: string;
  seller_handle?: string;
  tags: string[];
  source_host: string;
}

export interface MarketplaceDiscoveryProvider {
  type: 'flohmarkt' | 'local_federation_cache';
  host: string;
  status: 'ready' | 'unavailable';
}

interface MarketplaceDiscoveryResponse {
  items: MarketplaceDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: MarketplaceDiscoveryProvider[];
}

const emptyResponse: MarketplaceDiscoveryResponse = { items: [], has_more: false, next_offset: null, providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const coordinateValue = (value: unknown, minimum: number, maximum: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum ? value : undefined;
const webUrl = (value: unknown): string | undefined => {
  const text = stringValue(value);
  if (!text || text.length > 2048) return undefined;

  try {
    const url = new URL(text);
    return (url.protocol === 'https:' || url.protocol === 'http:')
      && !url.username
      && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const normalizeItem = (value: unknown): MarketplaceDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'market') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family: 'market',
    kind: stringValue(value.kind) || 'classified',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    image_url: webUrl(value.image_url),
    price: stringValue(value.price),
    currency: stringValue(value.currency),
    currency_url: webUrl(value.currency_url),
    purpose: value.purpose === 'request' ? 'request' : 'offer',
    availability: stringValue(value.availability),
    published_at: stringValue(value.published_at),
    expires_at: stringValue(value.expires_at),
    location: stringValue(value.location),
    latitude: coordinateValue(value.latitude, -90, 90),
    longitude: coordinateValue(value.longitude, -180, 180),
    condition: stringValue(value.condition),
    delivery: stringValue(value.delivery),
    category: stringValue(value.category),
    seller_url: webUrl(value.seller_url),
    seller_id: stringValue(value.seller_id),
    seller_label: stringValue(value.seller_label),
    seller_handle: stringValue(value.seller_handle),
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8) : [],
    source_host: sourceHost,
  };
};

const normalizeResponse = (value: unknown): MarketplaceDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid marketplace discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is MarketplaceDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): MarketplaceDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const providerType = provider.type;
      if (providerType !== 'flohmarkt' && providerType !== 'local_federation_cache') return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return host && status ? [{ type: providerType, host, status }] : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: coordinateValue(value.next_offset, 0, Number.MAX_SAFE_INTEGER) ?? null,
  };
};

export const useMarketplaceDiscovery = (query: string, offset: number, enabled: boolean) => {
  const api = useApi();
  const result = useQuery<MarketplaceDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedMarket', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'received_market', q: query, limit: '12', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useMarketplaceDiscovery.ts */
