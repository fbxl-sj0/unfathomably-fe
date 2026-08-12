/*
 * Unfathomably native community catalog
 * -------------------------------------
 *
 * File: useNativeCommunityCatalog.ts
 *
 * Purpose:
 *   Load the server's explicit, no-network community entry points for Worlds.
 *
 * Responsibilities:
 *   - request the bounded local catalog for one native object family
 *   - validate the small community envelope before rendering it
 *   - keep configured origins separate from locally known actors
 *
 * This file intentionally does not request remote community APIs or resolve
 * their ActivityPub actors.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

export type NativeCommunityCatalogOrigin = 'ecosystem_guide' | 'known_actor' | 'operator_index' | 'reviewed_community' | 'reviewed_directory';
export type NativeCommunityCatalogAccessMode = 'directory' | 'external' | 'guide' | 'local';

export interface NativeCommunityCatalogItem {
  id: string;
  family: string;
  platform: string;
  title: string;
  community_name?: string;
  workflow: string;
  url: string;
  local_url?: string;
  origin_type: NativeCommunityCatalogOrigin;
  access_mode: NativeCommunityCatalogAccessMode;
  source_host: string;
  known_locally?: boolean;
  resolver_enabled: boolean;
  resolver_label?: string;
}

interface NativeCommunityCatalogResponse {
  items: NativeCommunityCatalogItem[];
  refreshing: boolean;
}

const emptyItems: NativeCommunityCatalogItem[] = [];
const emptyResponse: NativeCommunityCatalogResponse = { items: emptyItems, refreshing: false };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value : null;

const webUrl = (value: unknown): string | null => {
  const candidate = stringValue(value);

  if (!candidate) return null;

  try {
    const url = new URL(candidate);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
};

const localPath = (value: unknown): string | undefined => {
  const candidate = stringValue(value);

  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
};

const normalizeItem = (value: unknown): NativeCommunityCatalogItem | null => {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const family = stringValue(value.family);
  const platform = stringValue(value.platform);
  const title = stringValue(value.title);
  const workflow = stringValue(value.workflow);
  const url = webUrl(value.url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !family || !platform || !title || !workflow || !url || !sourceHost) return null;

  const knownLocally = value.known_locally === true;
  const suppliedOrigin = stringValue(value.origin_type);
  const originType: NativeCommunityCatalogOrigin = suppliedOrigin === 'ecosystem_guide' ||
    suppliedOrigin === 'known_actor' ||
    suppliedOrigin === 'operator_index' ||
    suppliedOrigin === 'reviewed_community' ||
    suppliedOrigin === 'reviewed_directory'
    ? suppliedOrigin
    : knownLocally ? 'known_actor' : 'operator_index';
  const suppliedAccessMode = stringValue(value.access_mode);
  const accessMode: NativeCommunityCatalogAccessMode = suppliedAccessMode === 'directory' ||
    suppliedAccessMode === 'external' ||
    suppliedAccessMode === 'guide' ||
    suppliedAccessMode === 'local'
    ? suppliedAccessMode
    : knownLocally ? 'local' : originType === 'reviewed_directory' ? 'directory' : 'external';

  return {
    id,
    family,
    platform,
    title,
    community_name: stringValue(value.community_name) || undefined,
    workflow,
    url,
    local_url: localPath(value.local_url),
    origin_type: originType,
    access_mode: accessMode,
    source_host: sourceHost,
    known_locally: knownLocally,
    resolver_enabled: value.resolver_enabled !== false,
    resolver_label: stringValue(value.resolver_label) || undefined,
  };
};

const normalizeResponse = (value: unknown): NativeCommunityCatalogResponse => {
  if (!isRecord(value) || !Array.isArray(value.items)) return emptyResponse;

  return {
    items: value.items
      .map(normalizeItem)
      .filter((item): item is NativeCommunityCatalogItem => item !== null),
    refreshing: value.refreshing === true,
  };
};

const useNativeCommunityCatalog = (family: string) => {
  const api = useApi();

  return useQuery<NativeCommunityCatalogResponse>({
    queryKey: ['nativeCommunityCatalog', api.baseUrl, family],
    queryFn: async () => {
      const response = await api.get('/api/v1/discovery/native-communities', {
        searchParams: { family },
      });

      return normalizeResponse(await response.json());
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
    refetchInterval: (query) => query.state.data?.refreshing ? 10_000 : false,
  });
};

export { useNativeCommunityCatalog };

/* end of useNativeCommunityCatalog.ts */
