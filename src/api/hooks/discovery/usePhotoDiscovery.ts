/*
 * Unfathomably public photograph discovery
 * -----------------------------------------
 *
 * File: usePhotoDiscovery.ts
 *
 * Purpose:
 *   Load locally known public photographic objects for Worlds.
 *
 * Responsibilities:
 *   - request photo discovery only after an explicit browse or search action
 *   - validate object, media, actor, location, and source metadata
 *   - allow media-proxied local preview paths as well as secure URLs
 *
 * This file intentionally does not query Pixelfed directly, expose sensitive
 * previews, or perform favourites, follows, replies, or shares.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface PhotoDiscoveryImage {
  preview_url: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

interface PhotoDiscoveryCapabilities {
  announce: boolean;
  like: boolean;
  reply: boolean;
}

export interface PhotoDiscoveryItem {
  id: string;
  family: 'photo';
  kind: 'photograph';
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  actor_url?: string;
  actor_label?: string;
  preview_url?: string;
  alt_text?: string;
  sensitive: boolean;
  image_count: number;
  images: PhotoDiscoveryImage[];
  tags: string[];
  location?: string;
  licence?: string;
  comments_enabled?: boolean;
  capabilities: PhotoDiscoveryCapabilities;
  capabilities_declared: PhotoDiscoveryCapabilities;
  published_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface PhotoDiscoveryProvider {
  type: 'local_photo';
  host: string;
  status: 'ready' | 'unavailable';
}

interface PhotoDiscoveryResponse {
  items: PhotoDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: PhotoDiscoveryProvider[];
}

const emptyResponse: PhotoDiscoveryResponse = {
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
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const previewUrl = (value: unknown): string | undefined => {
  const url = stringValue(value);
  if (!url) return undefined;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return secureUrl(url);
};

const imageDimension = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 30000 ? value : undefined
);

const normalizeImage = (value: unknown): PhotoDiscoveryImage | null => {
  if (!isRecord(value)) return null;

  const url = previewUrl(value.preview_url);
  if (!url) return null;

  return {
    preview_url: url,
    alt_text: stringValue(value.alt_text),
    width: imageDimension(value.width),
    height: imageDimension(value.height),
  };
};

export const normalizePhotoDiscoveryCapabilities = (value: unknown): PhotoDiscoveryCapabilities => {
  if (!isRecord(value)) return { announce: false, like: false, reply: false };

  return {
    announce: value.announce === true,
    like: value.like === true,
    reply: value.reply === true,
  };
};

const normalizeItem = (value: unknown): PhotoDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'photo' || value.kind !== 'photograph' || value.local_action !== 'resolve') return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = secureUrl(value.url);
  const activitypubUrl = secureUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family: 'photo',
    kind: 'photograph',
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    actor_url: secureUrl(value.actor_url),
    actor_label: stringValue(value.actor_label),
    preview_url: value.sensitive === true ? undefined : previewUrl(value.preview_url),
    alt_text: stringValue(value.alt_text),
    sensitive: value.sensitive === true,
    image_count: typeof value.image_count === 'number' && value.image_count > 0 ? Math.min(Math.floor(value.image_count), 100) : 1,
    images: value.sensitive === true || !Array.isArray(value.images)
      ? []
      : value.images.map(normalizeImage).filter((image): image is PhotoDiscoveryImage => image !== null).slice(0, 12),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).slice(0, 8)
      : [],
    location: stringValue(value.location),
    licence: stringValue(value.licence),
    comments_enabled: typeof value.comments_enabled === 'boolean' ? value.comments_enabled : undefined,
    capabilities: normalizePhotoDiscoveryCapabilities(value.capabilities),
    capabilities_declared: normalizePhotoDiscoveryCapabilities(value.capabilities_declared),
    published_at: stringValue(value.published_at),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): PhotoDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid public photograph discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is PhotoDiscoveryItem => item !== null)
    : [];

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): PhotoDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;
      return provider.type === 'local_photo' && host && status
        ? [{ type: 'local_photo', host, status }]
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

export const usePhotoDiscovery = (query: string, offset: number, requested: boolean) => {
  const api = useApi();

  const result = useQuery<PhotoDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'photo', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'photo',
        q: query,
        limit: '16',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: requested,
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of usePhotoDiscovery.ts */
