/*
 * Unfathomably alien publishing discovery
 * ----------------------------------------
 *
 * File: usePublishingDiscovery.ts
 *
 * Purpose:
 *   Load locally known public bookmarks, articles, and publications.
 *
 * Responsibilities:
 *   - issue bounded local searches only after an explicit user action
 *   - validate bookmark targets separately from federated source objects
 *   - retain author, subject, language, licence, tags, and attachment context
 *
 * This file intentionally does not contact publishing servers directly,
 * download attachments, or classify ordinary social Notes as bookmarks.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export type PublishingDiscoveryFamily = 'bookmarks' | 'longform' | 'publishing';

interface PublishingAttachment {
  url: string;
  name?: string;
  media_type?: string;
}

export interface PublishingDiscoveryItem {
  id: string;
  family: PublishingDiscoveryFamily;
  kind: 'bookmark' | 'article' | 'publication';
  object_type?: string;
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  actor_url?: string;
  target_url?: string;
  target_host?: string;
  byline?: string;
  site_name?: string;
  subtitle?: string;
  subject?: string;
  language?: string;
  licence?: string;
  tags: string[];
  attachment?: PublishingAttachment;
  sensitive: boolean;
  published_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface PublishingDiscoveryProvider {
  type: 'local_publishing';
  host: string;
  status: 'ready' | 'unavailable';
}

interface PublishingDiscoveryResponse {
  items: PublishingDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: PublishingDiscoveryProvider[];
}

const emptyResponse: PublishingDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;

const secureUrl = (value: unknown): string | undefined => {
  const url = stringValue(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizeAttachment = (value: unknown): PublishingAttachment | undefined => {
  if (!isRecord(value)) return undefined;
  const url = secureUrl(value.url);
  if (!url) return undefined;
  return { url, name: stringValue(value.name), media_type: stringValue(value.media_type) };
};

const normalizeItem = (value: unknown, family: PublishingDiscoveryFamily): PublishingDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== family || value.local_action !== 'resolve') return null;

  const expectedKind = family === 'bookmarks' ? 'bookmark' : family === 'longform' ? 'article' : 'publication';
  if (value.kind !== expectedKind) return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family,
    kind: expectedKind,
    object_type: stringValue(value.object_type),
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: secureUrl(value.actor_url),
    target_url: secureUrl(value.target_url),
    target_host: stringValue(value.target_host),
    byline: stringValue(value.byline),
    site_name: stringValue(value.site_name),
    subtitle: stringValue(value.subtitle),
    subject: stringValue(value.subject),
    language: stringValue(value.language),
    licence: stringValue(value.licence),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8)
      : [],
    attachment: normalizeAttachment(value.attachment),
    sensitive: value.sensitive === true,
    published_at: stringValue(value.published_at),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown, family: PublishingDiscoveryFamily): PublishingDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid alien publishing discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem, family), rawItem)).filter((item): item is PublishingDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): PublishingDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'local_publishing' && host && status
        ? [{ type: 'local_publishing', host, status }]
        : [];
    })
    : [];

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: typeof value.next_offset === 'number' && value.next_offset >= 0 ? value.next_offset : null,
  };
};

export const usePublishingDiscovery = (
  family: PublishingDiscoveryFamily,
  query: string,
  offset: number,
  requested: boolean,
) => {
  const api = useApi();

  const result = useQuery<PublishingDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, family, query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family,
        q: query,
        limit: '16',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json(), family);
    },
    enabled: requested,
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of usePublishingDiscovery.ts */
