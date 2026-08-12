/*
 * Unfathomably Worlds search workspace
 * -------------------------------------
 *
 * File: worlds-search-panel.tsx
 *
 * Purpose:
 *   Give every focused Worlds page one obvious place to find useful objects.
 *
 * Responsibilities:
 *   - map user-facing Worlds families to bounded backend discovery requests
 *   - combine federated results with approved metadata catalogues where useful
 *   - normalize heterogeneous provider records into compact result cards
 *   - offer safe source and local-resolution handoffs without mutating state
 *
 * This file intentionally does not follow actors, publish objects, crawl
 * providers, download source media, or make remote metadata authoritative.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useHistory, useLocation } from 'react-router-dom';

import { withNativeDiscoveryStatus } from '@/api/hooks/discovery/nativeDiscoveryStatus.ts';
import Button from '@/components/ui/button.tsx';
import Input from '@/components/ui/input.tsx';
import { useApi } from '@/hooks/useApi.ts';

import NativeDiscoveryArticle from './native-discovery-article.tsx';
import type { PresentationFamily } from './presentation-family.ts';

type SearchFamily = PresentationFamily;

interface SearchDefinition {
  apiFamily: string;
  autoBrowse?: boolean;
  catalogTemplate?: 'audio' | 'books';
  category?: string;
  heading: string;
  help: string;
  placeholder: string;
  suggestions: string[];
}

interface SearchItem {
  id: string;
  imageUrl?: string;
  localAction?: 'resolve' | 'source_only';
  meta?: string;
  provider?: string;
  summary?: string;
  title: string;
  url: string;
}

interface CachedSearchResult {
  expiresAt: number;
  items: SearchItem[];
}

/*
 * Worlds fans one search out to local discovery and, for selected families,
 * a metadata catalogue. Keep exact successful results briefly so returning to
 * a World does not repeat the same remote-facing work. The small fixed bound
 * prevents arbitrary search terms from turning this cache into retained UI
 * state for the lifetime of the browser tab.
 */
const SEARCH_CACHE_TTL = 60_000;
const SEARCH_CACHE_LIMIT = 64;
const searchCache = new Map<string, CachedSearchResult>();

const readSearchCache = (key: string): SearchItem[] | undefined => {
  const cached = searchCache.get(key);
  if (!cached) return undefined;

  if (cached.expiresAt <= Date.now()) {
    searchCache.delete(key);
    return undefined;
  }

  searchCache.delete(key);
  searchCache.set(key, cached);
  return cached.items;
};

const writeSearchCache = (key: string, items: SearchItem[]): void => {
  searchCache.delete(key);

  while (searchCache.size >= SEARCH_CACHE_LIMIT) {
    const oldestKey = searchCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    searchCache.delete(oldestKey);
  }

  searchCache.set(key, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL,
    items,
  });
};

const definitions: Record<SearchFamily, SearchDefinition> = {
  all: {
    apiFamily: 'all',
    autoBrowse: true,
    heading: 'Find something from another world',
    help: 'Search by the words you would normally use. You do not need to know the server or software name.',
    placeholder: 'People, groups, media, events, or topics',
    suggestions: ['Communities', 'Music', 'Books'],
  },
  audio: {
    apiFamily: 'audio',
    autoBrowse: true,
    catalogTemplate: 'audio',
    heading: 'Find music or a podcast',
    help: 'Try a track, artist, album, show, or subject.',
    placeholder: 'Track, artist, album, or podcast',
    suggestions: ['Jazz', 'Bach', 'Ambient'],
  },
  video: {
    apiFamily: 'video',
    autoBrowse: true,
    heading: 'Find a video or channel',
    help: 'Try a title, channel name, or subject you want to watch.',
    placeholder: 'Video, channel, or topic',
    suggestions: ['Linux', 'Animation', 'Documentary'],
  },
  longform: {
    apiFamily: 'longform',
    heading: 'Find an article or writer',
    help: 'Try an author, publication, headline, or subject.',
    placeholder: 'Article, author, or topic',
    suggestions: ['Fediverse', 'Technology', 'History'],
  },
  photo: {
    apiFamily: 'photo',
    autoBrowse: true,
    heading: 'Find photographs or photographers',
    help: 'Try a photographer, place, subject, or album.',
    placeholder: 'Photograph, photographer, or subject',
    suggestions: ['Nature', 'Architecture', 'Street'],
  },
  books: {
    apiFamily: 'catalog',
    catalogTemplate: 'books',
    category: 'book',
    heading: 'Find a book or edition',
    help: 'Use a title, author, or the ISBN printed near the barcode.',
    placeholder: 'Title, author, or ISBN',
    suggestions: ['Tolkien', 'Octavia Butler', '9780395520215'],
  },
  bookmarks: {
    apiFamily: 'bookmarks',
    heading: 'Find a saved link',
    help: 'Try the page title, curator, subject, or tag.',
    placeholder: 'Link, curator, note, or tag',
    suggestions: ['Fediverse', 'Programming', 'Reference'],
  },
  groups: {
    apiFamily: 'groups',
    autoBrowse: true,
    heading: 'Find a community',
    help: 'Search for the topic or community name. You can decide whether to join after opening it.',
    placeholder: 'Community, forum, or topic',
    suggestions: ['Technology', 'Books', 'Self-hosting'],
  },
  events: {
    apiFamily: 'event',
    autoBrowse: true,
    heading: 'Find an event',
    help: 'Try an event name, organizer, place, or kind of activity.',
    placeholder: 'Event, organizer, or place',
    suggestions: ['Music', 'Online', 'Workshop'],
  },
  development: {
    apiFamily: 'development',
    heading: 'Find a project or issue',
    help: 'Try a project name, repository, programming language, or problem.',
    placeholder: 'Project, repository, issue, or language',
    suggestions: ['Pleroma', 'ActivityPub', 'Elixir'],
  },
  models: {
    apiFamily: 'model',
    heading: 'Find a 3D model',
    help: 'Try the object, replacement part, creator, or model tag.',
    placeholder: '3D model, creator, or tag',
    suggestions: ['Dragon', 'Replacement part', 'Miniature'],
  },
  marketplace: {
    apiFamily: 'market',
    heading: 'Find an offer or request',
    help: 'Search for the item, need, or general area. Private addresses are never required.',
    placeholder: 'Item, offer, request, or location',
    suggestions: ['Bicycle', 'Books', 'Electronics'],
  },
  games: {
    apiFamily: 'game',
    heading: 'Find a player or game',
    help: 'Try a player, opening, challenge, or game identifier.',
    placeholder: 'Player, game, opening, or challenge',
    suggestions: ['Chess', 'Open games', 'Challenges'],
  },
  routes: {
    apiFamily: 'route',
    autoBrowse: true,
    heading: 'Find a route or trail',
    help: 'Try a place, activity, trail name, or terrain.',
    placeholder: 'Trail, route, place, or activity',
    suggestions: ['Hiking', 'Cycling', 'Walking'],
  },
  culture: {
    apiFamily: 'catalog',
    category: 'movie',
    heading: 'Find a film, album, game, or other work',
    help: 'Search for the title, creator, series, or kind of work.',
    placeholder: 'Film, series, game, album, or creator',
    suggestions: ['The Matrix', 'Studio Ghibli', 'Civilization'],
  },
  coordination: {
    apiFamily: 'coordination',
    heading: 'Find help, offers, or needs',
    help: 'Try the resource, skill, place, or outcome people are coordinating around.',
    placeholder: 'Need, offer, resource, or place',
    suggestions: ['Food', 'Transport', 'Volunteer'],
  },
  publishing: {
    apiFamily: 'publishing',
    heading: 'Find a publication or document',
    help: 'Try a title, author, chapter, collection, or subject.',
    placeholder: 'Publication, document, chapter, or topic',
    suggestions: ['ActivityPub', 'Open knowledge', 'Documentation'],
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const stringValue = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const webUrl = (value: unknown): string | undefined => {
  const candidate = stringValue(value);
  if (!candidate || candidate.length > 2048) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const creatorLabel = (value: unknown): string | undefined => {
  if (typeof value === 'string') return stringValue(value);
  if (!isRecord(value)) return undefined;

  return stringValue(value.name)
    || stringValue(value.handle)
    || stringValue(value.preferred_username)
    || stringValue(value.preferredUsername);
};

const normalizeDiscoveryItem = (value: unknown): SearchItem | null => {
  if (!isRecord(value)) return null;

  const url = webUrl(value.url) || webUrl(value.source_url);
  const title = stringValue(value.title) || stringValue(value.name) || stringValue(value.label);
  const id = stringValue(value.id) || url;
  if (!id || !title || !url) return null;

  const meta = [
    creatorLabel(value.creator),
    stringValue(value.category),
    stringValue(value.kind),
    stringValue(value.year),
    stringValue(value.source_host),
  ].filter((item): item is string => Boolean(item)).join(' | ');

  return {
    id,
    imageUrl: webUrl(value.image_url) || webUrl(value.thumbnail_url) || webUrl(value.preview_url),
    localAction: value.local_action === 'resolve' ? 'resolve' : 'source_only',
    meta: meta || undefined,
    provider: stringValue(value.provider),
    summary: stringValue(value.summary) || stringValue(value.description),
    title,
    url,
  };
};

const normalizeCatalogItem = (value: unknown): SearchItem | null => {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const title = stringValue(value.title);
  const url = webUrl(value.source_url);
  if (!id || !title || !url) return null;

  return {
    id,
    localAction: 'source_only',
    meta: stringValue(value.subtitle),
    provider: stringValue(value.provider_label),
    title,
    url,
  };
};

const uniqueItems = (items: SearchItem[]): SearchItem[] => {
  const seen = new Set<string>();

  return items.filter(item => {
    const key = item.url || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 24);
};

interface WorldsSearchPanelProps {
  enabled: boolean;
  family: SearchFamily;
  initialQuery?: string;
}

const WorldsSearchPanel: React.FC<WorldsSearchPanelProps> = ({ enabled, family, initialQuery = '' }) => {
  const api = useApi();
  const history = useHistory();
  const location = useLocation();
  const definition = definitions[family];
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestSequence = useRef(0);

  const minimumQueryMet = query.trim().length >= 2;
  const canBrowseWithoutQuery = Boolean(definition.autoBrowse);
  const canSubmit = minimumQueryMet || (!query.trim() && canBrowseWithoutQuery);

  const search = useCallback(async (requestedQuery: string) => {
    const normalizedQuery = requestedQuery.trim().slice(0, 200);
    const queryIsValid = normalizedQuery.length >= 2
      || (normalizedQuery.length === 0 && Boolean(definition.autoBrowse));

    if (!enabled || !queryIsValid) return;

    const requestId = ++requestSequence.current;
    const cacheKey = `${family}:${normalizedQuery}`;
    const cachedItems = readSearchCache(cacheKey);

    if (cachedItems) {
      setItems(cachedItems);
      setFailed(false);
      setSearched(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);

    const discoveryRequest = async (): Promise<{ items: SearchItem[] }> => {
      if (family === 'groups') {
        const response = await api.get('/api/v1/discovery/native-communities', {
          searchParams: { family: 'groups', limit: '24', q: normalizedQuery },
        });
        const payload = await response.json() as unknown;
        const rawItems = Array.isArray(payload)
          ? payload
          : isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];

        return {
          items: rawItems.map(rawItem => withNativeDiscoveryStatus(normalizeDiscoveryItem(rawItem), rawItem)).filter((item): item is SearchItem => item !== null),
        };
      }

      const searchParams: Record<string, string> = {
        family: definition.apiFamily,
        limit: '24',
        q: normalizedQuery,
      };
      if (definition.category) searchParams.category = definition.category;

      const response = await api.get('/api/v1/discovery/native', { searchParams });
      const payload = await response.json() as unknown;
      if (!isRecord(payload)) throw new Error('Invalid Worlds discovery response');

      const rawItems = Array.isArray(payload.items) ? payload.items : [];
      return {
        items: rawItems.map(rawItem => withNativeDiscoveryStatus(normalizeDiscoveryItem(rawItem), rawItem)).filter((item): item is SearchItem => item !== null),
      };
    };

    const catalogRequest = async (): Promise<SearchItem[]> => {
      if (!definition.catalogTemplate || normalizedQuery.length < 2) return [];

      const response = await api.get('/api/v1/discovery/native-objects/catalog', {
        searchParams: { q: normalizedQuery, template: definition.catalogTemplate },
      });
      const payload = await response.json() as unknown;
      const rawResults = isRecord(payload) && Array.isArray(payload.results) ? payload.results : [];
      return rawResults.map(normalizeCatalogItem).filter((item): item is SearchItem => item !== null);
    };

    const [discoveryResult, catalogResult] = await Promise.allSettled([
      discoveryRequest(),
      catalogRequest(),
    ]);

    const discovered = discoveryResult.status === 'fulfilled' ? discoveryResult.value.items : [];
    const catalogued = catalogResult.status === 'fulfilled' ? catalogResult.value : [];

    /*
     * A family change or a second suggestion can complete before the first
     * request. Only the newest request may update the visible World.
     */
    if (requestId !== requestSequence.current) return;

    const nextItems = uniqueItems([...catalogued, ...discovered]);
    const requestFailed = discoveryResult.status === 'rejected' && catalogResult.status === 'rejected';

    if (!requestFailed) writeSearchCache(cacheKey, nextItems);

    setItems(nextItems);
    setFailed(requestFailed);
    setSearched(true);
    setLoading(false);
  }, [api, definition, enabled, family]);

  const submitSearch = useCallback((requestedQuery: string) => {
    const normalizedQuery = requestedQuery.trim().slice(0, 200);
    const params = new URLSearchParams(location.search);

    setQuery(normalizedQuery);
    params.set('view', 'search');
    params.delete('create');
    params.delete('reference');
    params.delete('resolve');
    params.delete('template');

    if (normalizedQuery) {
      params.set('q', normalizedQuery);
    } else {
      params.delete('q');
    }

    const nextSearch = params.toString();
    const currentSearch = location.search.replace(/^\?/, '');

    if (nextSearch === currentSearch) {
      void search(normalizedQuery);
    } else {
      history.push({
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      });
    }
  }, [history, location.pathname, location.search, search]);

  useEffect(() => {
    requestSequence.current += 1;
    setQuery(initialQuery);
    setItems([]);
    setLoading(false);
    setSearched(false);
    setFailed(false);

    if (enabled && initialQuery.trim().length >= 2) {
      void search(initialQuery);
    }

    return () => {
      requestSequence.current += 1;
    };
  }, [enabled, family, initialQuery, search]);

  return (
    <section id='worlds-search' className='border-b border-gray-200 bg-white p-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:p-5'>
      <div className='mb-4'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>{definition.heading}</h2>
        <p className='mt-1 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>{definition.help}</p>
      </div>
      <form
        className='flex flex-col gap-2 sm:flex-row'
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(query);
        }}
      >
        <label className='sr-only' htmlFor='worlds-primary-search'>
          <FormattedMessage id='worlds.search.label' defaultMessage='Search this world' />
        </label>
        <Input
          id='worlds-primary-search'
          type='search'
          value={query}
          maxLength={200}
          autoComplete='off'
          disabled={!enabled}
          placeholder={definition.placeholder}
          outerClassName='min-w-0 flex-1'
          className='px-4 py-2.5'
          onChange={(event) => setQuery(event.target.value)}
        />
        {enabled ? (
          <Button
            className='w-full shrink-0 sm:w-auto'
            type='submit'
            disabled={loading || !canSubmit}
            theme='primary'
          >
            {loading
              ? <FormattedMessage id='worlds.search.searching' defaultMessage='Searching...' />
              : <FormattedMessage id='worlds.search.submit' defaultMessage='Search' />}
          </Button>
        ) : (
          <Link to='/login' className='rounded-lg bg-primary-600 px-5 py-2.5 text-center font-bold text-white hover:bg-primary-500'>
            <FormattedMessage id='worlds.search.sign_in' defaultMessage='Sign in' />
          </Link>
        )}
      </form>

      {enabled && (
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <span className='text-sm font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
            <FormattedMessage id='worlds.search.try' defaultMessage='Try:' />
          </span>
          {definition.suggestions.map(suggestion => (
            <button
              key={suggestion}
              type='button'
              className='rounded-full border border-gray-300 black:border-gray-700 px-3 py-1.5 text-sm font-bold text-gray-700 black:text-gray-200 hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:text-gray-200 dark:hover:text-primary-300'
              onClick={() => {
                submitSearch(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {failed && (
        <div className='mt-5 border-l-4 border-danger-500 px-4 py-2 text-sm font-bold text-danger-700 black:text-danger-300 dark:text-danger-300'>
          <FormattedMessage id='worlds.search.error' defaultMessage='Search is temporarily unavailable. You can still use an exact public link below.' />
        </div>
      )}

      {!failed && searched && !loading && items.length === 0 && (
        <div className='px-4 py-8 text-center'>
          <p className='font-black text-gray-950 black:text-white dark:text-white'>
            <FormattedMessage id='worlds.search.empty' defaultMessage='No matches yet' />
          </p>
          <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
            <FormattedMessage id='worlds.search.empty_hint' defaultMessage='Try one of the suggested searches or open an exact public link.' />
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className='mt-5 divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {items.map(item => (
            <NativeDiscoveryArticle item={item} key={item.id} className='flex min-w-0 gap-3 px-1 py-4'>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt='' loading='lazy' className='h-24 w-20 shrink-0 rounded-lg bg-black object-cover' />
              ) : (
                <div className='flex h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-100 black:bg-primary-900 text-2xl font-black text-primary-700 black:text-primary-300 dark:bg-primary-700 dark:text-primary-100' aria-hidden='true'>
                  {item.title.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <h2 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h2>
                {item.meta && <p className='mt-1 line-clamp-2 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.meta}</p>}
                {item.summary && <p className='mt-2 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                <div className='mt-3 flex flex-wrap gap-2'>
                  {item.localAction === 'resolve' && (
                    <Link
                      to={`/worlds/${family}?resolve=${encodeURIComponent(item.url)}#worlds-connect`}
                      className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'
                    >
                      <FormattedMessage id='worlds.search.view_here' defaultMessage='View here' />
                    </Link>
                  )}
                  <a
                    href={item.url}
                    target='_blank'
                    rel='nofollow noopener noreferrer'
                    className={item.localAction === 'resolve'
                      ? 'rounded-lg border border-gray-300 px-3 py-2 text-sm font-black text-gray-900 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-white black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'
                      : 'rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'}
                  >
                    {item.localAction === 'resolve'
                      ? <FormattedMessage id='worlds.search.source' defaultMessage='Open original' />
                      : <FormattedMessage id='worlds.search.open_source' defaultMessage='Open original' />}
                  </a>
                </div>
              </div>
            </NativeDiscoveryArticle>
          ))}
        </div>
      )}
    </section>
  );
};

export default WorldsSearchPanel;

/* end of worlds-search-panel.tsx */
