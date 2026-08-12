/*
 * Unfathomably forge discovery
 * ----------------------------
 *
 * File: useForgeDiscovery.ts
 *
 * Purpose:
 *   Load public software projects from backend-approved Forgejo catalogues.
 *
 * Responsibilities:
 *   - issue a search only after explicit user input
 *   - validate project, owner, topic, and provider metadata
 *   - retain separate native project and optional actor-resolution paths
 *
 * This file intentionally does not contact forges directly, clone source
 * trees, create issues, or claim every repository is a ForgeFed actor.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface ForgeDiscoveryOwner {
  login: string;
  name: string;
  url: string;
}

export interface ForgeDiscoveryItem {
  id: string;
  family: 'development';
  kind: 'repository';
  title: string;
  summary?: string;
  url: string;
  clone_url?: string;
  website_url?: string;
  activitypub_handle?: string;
  owner: ForgeDiscoveryOwner;
  language?: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  updated_at?: string;
  source_host: string;
  local_action: 'view';
}

interface ForgeDiscoveryProvider {
  type: 'forgejo';
  host: string;
  status: 'ready' | 'unavailable';
}

interface ForgeDiscoveryResponse {
  items: ForgeDiscoveryItem[];
  providers: ForgeDiscoveryProvider[];
}

const emptyResponse: ForgeDiscoveryResponse = { items: [], providers: [] };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const countValue = (value: unknown): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

const secureUrl = (value: unknown, sourceHost?: string): string | undefined => {
  const url = stringValue(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || (sourceHost && parsed.hostname.toLowerCase() !== sourceHost.toLowerCase())) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
};

const normalizeOwner = (value: unknown, sourceHost: string): ForgeDiscoveryOwner | undefined => {
  if (!isRecord(value)) return undefined;

  const login = stringValue(value.login);
  const name = stringValue(value.name);
  const url = secureUrl(value.url, sourceHost);

  return login && name && url ? { login, name, url } : undefined;
};

const normalizeItem = (value: unknown): ForgeDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'development' || value.kind !== 'repository') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const sourceHost = stringValue(value.source_host);
  const url = secureUrl(value.url, sourceHost);
  const owner = sourceHost ? normalizeOwner(value.owner, sourceHost) : undefined;

  if (!id || !title || !sourceHost || !url || !owner || value.local_action !== 'view') return null;

  return {
    id,
    family: 'development',
    kind: 'repository',
    title,
    summary: stringValue(value.summary),
    url,
    clone_url: secureUrl(value.clone_url, sourceHost),
    website_url: secureUrl(value.website_url),
    activitypub_handle: stringValue(value.activitypub_handle),
    owner,
    language: stringValue(value.language),
    stars_count: countValue(value.stars_count),
    forks_count: countValue(value.forks_count),
    open_issues_count: countValue(value.open_issues_count),
    topics: Array.isArray(value.topics)
      ? value.topics.filter((topic): topic is string => typeof topic === 'string' && topic.length > 0).slice(0, 8)
      : [],
    updated_at: stringValue(value.updated_at),
    source_host: sourceHost,
    local_action: 'view',
  };
};

const normalizeResponse = (value: unknown): ForgeDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid forge discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ForgeDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ForgeDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'forgejo' && host && status ? [{ type: 'forgejo', host, status }] : [];
    })
    : [];

  return { items, providers };
};

export const useForgeDiscovery = (query: string, enabled: boolean) => {
  const api = useApi();

  const result = useQuery<ForgeDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'development', query],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'development', q: query, limit: '18', offset: '0' });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useForgeDiscovery.ts */
