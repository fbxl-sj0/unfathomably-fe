/*
 * Unfathomably cultural catalog discovery
 * ---------------------------------------
 *
 * File: useCatalogDiscovery.ts
 *
 * Purpose:
 *   Load search-result records from backend-approved NeoDB catalogs.
 *
 * Responsibilities:
 *   - request one fixed provider page at a time
 *   - validate catalog, credit, rating, and provider metadata
 *   - avoid any blank-query discovery request
 *
 * This file intentionally does not create catalog entries or inspect private
 * collections on a remote NeoDB service.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export type CatalogCategory = 'book' | 'game' | 'movie' | 'music' | 'podcast' | 'tv';
export type CatalogDiscoveryLocalAction = 'resolve' | 'source_only';

interface CatalogCredit {
  role: string;
  name: string;
}

export interface CatalogDiscoveryItem {
  id: string;
  family: 'catalog';
  category: CatalogCategory;
  kind?: string;
  title: string;
  summary?: string;
  url: string;
  image_url?: string;
  rating?: number;
  rating_count: number;
  tags: string[];
  credits: CatalogCredit[];
  year?: string;
  languages: string[];
  local_action: CatalogDiscoveryLocalAction;
  source_host: string;
}

export interface CatalogDiscoveryProvider {
  type: 'bookwyrm' | 'neodb';
  host: string;
  status: 'ready' | 'unavailable';
}

interface CatalogDiscoveryResponse {
  items: CatalogDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: CatalogDiscoveryProvider[];
}

const emptyResponse: CatalogDiscoveryResponse = { items: [], has_more: false, next_offset: null, providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const numberValue = (value: unknown): number | undefined => typeof value === 'number' && value >= 0 ? value : undefined;
const categories: CatalogCategory[] = ['book', 'game', 'movie', 'music', 'podcast', 'tv'];

const webUrl = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  if (!candidate || candidate.length > 2048) return undefined;

  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const normalizeCredit = (value: unknown): CatalogCredit | null => {
  if (!isRecord(value)) return null;

  const role = stringValue(value.role);
  const name = stringValue(value.name);
  return role && name ? { role, name } : null;
};

const normalizeItem = (value: unknown): CatalogDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'catalog' || typeof value.category !== 'string' || !categories.includes(value.category as CatalogCategory)) return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const sourceHost = stringValue(value.source_host);
  const ratingCount = numberValue(value.rating_count);
  const localAction: CatalogDiscoveryLocalAction = value.local_action === 'resolve' ? 'resolve' : 'source_only';

  if (!id || !title || !url || !sourceHost || typeof ratingCount !== 'number') return null;

  return {
    id,
    family: 'catalog',
    category: value.category as CatalogCategory,
    kind: stringValue(value.kind),
    title,
    summary: stringValue(value.summary),
    url,
    image_url: webUrl(value.image_url),
    rating: numberValue(value.rating),
    rating_count: ratingCount,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 6) : [],
    credits: Array.isArray(value.credits) ? value.credits.map(normalizeCredit).filter((credit): credit is CatalogCredit => credit !== null).slice(0, 4) : [],
    year: stringValue(value.year),
    languages: Array.isArray(value.languages) ? value.languages.filter((language): language is string => typeof language === 'string' && language.length > 0).slice(0, 4) : [],
    local_action: localAction,
    source_host: sourceHost,
  };
};

const normalizeResponse = (value: unknown): CatalogDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid catalog discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is CatalogDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): CatalogDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const type = provider.type === 'bookwyrm' || provider.type === 'neodb' ? provider.type : null;
      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return type && host && status ? [{ type, host, status }] : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const useCatalogDiscovery = (category: CatalogCategory, query: string, offset: number, enabled: boolean) => {
  const api = useApi();
  const result = useQuery<CatalogDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'catalog', category, query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'catalog', category, q: query, limit: '16', offset: String(offset) });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useCatalogDiscovery.ts */
