/*
 * Unfathomably federated reading discovery
 * -----------------------------------------
 *
 * File: useReadingDiscovery.ts
 *
 * Purpose:
 *   Search public BookWyrm-style reading objects already received locally.
 *
 * Responsibilities:
 *   - request bounded local-only reading searches
 *   - validate review, shelf, book, and actor references
 *   - preserve stable ActivityPub URLs for deliberate local navigation
 *
 * This file intentionally does not query BookWyrm instances, expose private
 * shelves, or infer reading history from unrelated statuses.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

export type ReadingDiscoveryKind =
  | 'review'
  | 'comment'
  | 'quotation'
  | 'rating'
  | 'shelf'
  | 'book_list'
  | 'suggestion_list'
  | 'shelf_item'
  | 'list_item'
  | 'suggestion_item'
  | 'reading';

interface ReadingBookAuthor {
  name?: string;
  url: string;
}

interface ReadingCatalogueLink {
  label: string;
  url: string;
}

export interface ReadingBookContext {
  id: string;
  type: 'book' | 'edition' | 'work';
  title: string;
  subtitle?: string;
  authors: ReadingBookAuthor[];
  work_url?: string;
  isbn_10?: string;
  isbn_13?: string;
  catalogue_links: ReadingCatalogueLink[];
  pages?: number;
  physical_format?: string;
  publishers: string[];
  languages: string[];
  subjects: string[];
  published_date?: string;
}

export interface ReadingDiscoveryItem {
  id: string;
  family: 'books';
  kind: ReadingDiscoveryKind;
  object_type: string;
  title: string;
  summary?: string;
  content_warning?: string;
  sensitive: boolean;
  quote?: string;
  url: string;
  activitypub_url: string;
  actor_url?: string;
  actor_label?: string;
  book_url?: string;
  book?: ReadingBookContext;
  collection_url?: string;
  item_count?: number;
  known_item_count?: number;
  book_urls: string[];
  books: ReadingBookContext[];
  position?: number;
  position_mode?: string;
  progress?: number;
  progress_mode?: string;
  rating?: number;
  rating_best: number;
  reading_status?: string;
  published_at?: string;
  source_host: string;
  local_action: 'resolve';
}

interface ReadingDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface ReadingDiscoveryResponse {
  items: ReadingDiscoveryItem[];
  has_more: boolean;
  next_offset: number | null;
  providers: ReadingDiscoveryProvider[];
}

const emptyResponse: ReadingDiscoveryResponse = {
  items: [],
  has_more: false,
  next_offset: null,
  providers: [],
};

const kinds: ReadingDiscoveryKind[] = [
  'review',
  'comment',
  'quotation',
  'rating',
  'shelf',
  'book_list',
  'suggestion_list',
  'shelf_item',
  'list_item',
  'suggestion_item',
  'reading',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const safeHttpUrl = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? candidate
      : undefined;
  } catch {
    return undefined;
  }
};

const numberValue = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

const normalizeBookAuthor = (value: unknown): ReadingBookAuthor | null => {
  if (!isRecord(value)) return null;
  const url = safeHttpUrl(value.url);
  return url ? { url, name: stringValue(value.name) } : null;
};

const normalizeCatalogueLink = (value: unknown): ReadingCatalogueLink | null => {
  if (!isRecord(value)) return null;
  const label = stringValue(value.label);
  const url = safeHttpUrl(value.url);
  return label && url ? { label, url } : null;
};

const normalizeBook = (value: unknown): ReadingBookContext | null => {
  if (!isRecord(value) || !['book', 'edition', 'work'].includes(String(value.type))) return null;

  const id = safeHttpUrl(value.id);
  const title = stringValue(value.title);
  if (!id || !title) return null;

  return {
    id,
    type: value.type as ReadingBookContext['type'],
    title,
    subtitle: stringValue(value.subtitle),
    authors: Array.isArray(value.authors)
      ? value.authors.map(normalizeBookAuthor).filter((author): author is ReadingBookAuthor => author !== null).slice(0, 8)
      : [],
    work_url: safeHttpUrl(value.work_url),
    isbn_10: stringValue(value.isbn_10),
    isbn_13: stringValue(value.isbn_13),
    catalogue_links: Array.isArray(value.catalogue_links)
      ? value.catalogue_links
        .map(normalizeCatalogueLink)
        .filter((link): link is ReadingCatalogueLink => link !== null)
        .slice(0, 8)
      : [],
    pages: numberValue(value.pages),
    physical_format: stringValue(value.physical_format),
    publishers: Array.isArray(value.publishers)
      ? value.publishers.flatMap(publisher => stringValue(publisher) || []).slice(0, 6)
      : [],
    languages: Array.isArray(value.languages)
      ? value.languages.flatMap(language => stringValue(language) || []).slice(0, 6)
      : [],
    subjects: Array.isArray(value.subjects)
      ? value.subjects.flatMap(subject => stringValue(subject) || []).slice(0, 8)
      : [],
    published_date: stringValue(value.published_date),
  };
};

const normalizeItem = (value: unknown): ReadingDiscoveryItem | null => {
  if (
    !isRecord(value)
    || value.family !== 'books'
    || typeof value.kind !== 'string'
    || !kinds.includes(value.kind as ReadingDiscoveryKind)
  ) return null;

  const id = stringValue(value.id);
  const objectType = stringValue(value.object_type);
  const title = stringValue(value.title);
  const url = safeHttpUrl(value.url);
  const activitypubUrl = safeHttpUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (
    !id
    || !objectType
    || !title
    || !url
    || !activitypubUrl
    || !sourceHost
    || value.local_action !== 'resolve'
  ) return null;

  return {
    id,
    family: 'books',
    kind: value.kind as ReadingDiscoveryKind,
    object_type: objectType,
    title,
    summary: stringValue(value.summary),
    content_warning: stringValue(value.content_warning),
    sensitive: value.sensitive === true,
    quote: stringValue(value.quote),
    url,
    activitypub_url: activitypubUrl,
    actor_url: safeHttpUrl(value.actor_url),
    actor_label: stringValue(value.actor_label),
    book_url: safeHttpUrl(value.book_url),
    book: normalizeBook(value.book) || undefined,
    collection_url: safeHttpUrl(value.collection_url),
    item_count: numberValue(value.item_count),
    known_item_count: numberValue(value.known_item_count),
    book_urls: Array.isArray(value.book_urls)
      ? value.book_urls.flatMap(bookUrl => safeHttpUrl(bookUrl) || [])
      : [],
    books: Array.isArray(value.books)
      ? value.books.map(normalizeBook).filter((book): book is ReadingBookContext => book !== null).slice(0, 8)
      : [],
    position: numberValue(value.position),
    position_mode: stringValue(value.position_mode),
    progress: numberValue(value.progress),
    progress_mode: stringValue(value.progress_mode),
    rating: numberValue(value.rating),
    rating_best: numberValue(value.rating_best) || 5,
    reading_status: stringValue(value.reading_status),
    published_at: stringValue(value.published_at),
    source_host: sourceHost,
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ReadingDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid reading discovery response');

  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ReadingDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = stringValue(provider.host);
      return provider.type === 'local_federation_cache' && provider.status === 'ready' && host
        ? [{ type: 'local_federation_cache', host, status: 'ready' }]
        : [];
    })
    : [];

  return {
    items: Array.isArray(value.items)
      ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ReadingDiscoveryItem => item !== null)
      : [],
    providers,
    has_more: value.has_more === true,
    next_offset: numberValue(value.next_offset) ?? null,
  };
};

export const useReadingDiscovery = (
  query: string,
  offset: number,
  enabled: boolean,
) => {
  const api = useApi();
  const result = useQuery<ReadingDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'reading', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        family: 'reading',
        q: query,
        limit: '16',
        offset: String(offset),
      });
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled: enabled && (query.trim().length === 0 || query.trim().length >= 2),
    staleTime: 2 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useReadingDiscovery.ts */
