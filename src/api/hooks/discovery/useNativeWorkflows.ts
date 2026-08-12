/*
 * Unfathomably native federation workflows
 * -----------------------------------------
 *
 * File: useNativeWorkflows.ts
 *
 * Purpose:
 *   Load the backend's stable description of supported specialized workflows.
 *
 * Responsibilities:
 *   - validate the public workflow manifest before exposing it to the UI
 *   - provide a complete local fallback during mixed-version deployments
 *   - bound all strings and arrays received from the server
 *
 * This file intentionally does not discover remote servers, resolve objects,
 * or decide how workflow cards are presented.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

export type NativeWorkflowFamily =
  | 'audio'
  | 'video'
  | 'longform'
  | 'photo'
  | 'books'
  | 'bookmarks'
  | 'groups'
  | 'events'
  | 'development'
  | 'models'
  | 'marketplace'
  | 'games'
  | 'routes'
  | 'culture'
  | 'coordination'
  | 'publishing';

export interface NativeWorkflow {
  actions?: string[];
  creation?: string[];
  family: NativeWorkflowFamily;
  platforms: string[];
  objects: string[];
  participation: string[];
}

interface NativeWorkflowResponse {
  version: number;
  workflows: NativeWorkflow[];
}

const allowedFamilies = new Set<NativeWorkflowFamily>([
  'audio',
  'video',
  'longform',
  'photo',
  'books',
  'bookmarks',
  'groups',
  'events',
  'development',
  'models',
  'marketplace',
  'games',
  'routes',
  'culture',
  'coordination',
  'publishing',
]);

const fallbackWorkflows: NativeWorkflow[] = [
  { family: 'books', platforms: ['BookWyrm'], objects: ['books', 'editions', 'shelves', 'reviews'], participation: ['find books', 'review', 'shelve', 'track reading'] },
  { family: 'culture', platforms: ['NeoDB'], objects: ['catalog items', 'collections', 'ratings', 'reviews'], participation: ['find works', 'rate', 'review', 'collect'] },
  { family: 'audio', platforms: ['Funkwhale', 'Castopod'], objects: ['artists', 'albums', 'tracks', 'podcasts', 'libraries'], participation: ['listen', 'follow creators', 'favourite'] },
  { family: 'video', platforms: ['PeerTube', 'Owncast'], objects: ['channels', 'videos', 'playlists', 'live streams'], participation: ['watch', 'follow channels', 'comment', 'react'] },
  { family: 'photo', platforms: ['Pixelfed'], objects: ['photographs', 'albums', 'image descriptions'], participation: ['browse', 'follow photographers', 'reply', 'favourite'] },
  { family: 'events', platforms: ['Mobilizon', 'Gancio', 'WordPress Event Bridge'], objects: ['events', 'places', 'organizers'], participation: ['find events', 'RSVP', 'comment', 'create events'] },
  { family: 'groups', platforms: ['Lemmy', 'MBin', 'PieFed', 'NodeBB', 'Discourse', 'Friendica', 'Hubzilla', 'FediGroups', 'Bonfire'], objects: ['communities', 'forums', 'channels', 'topics'], participation: ['find communities', 'join', 'post', 'reply'] },
  { family: 'marketplace', platforms: ['Flohmarkt'], objects: ['classified advertisements', 'offers', 'requests'], participation: ['browse listings', 'contact sellers', 'offer', 'request'] },
  { family: 'routes', platforms: ['Wanderer'], objects: ['routes', 'trails', 'geographic data', 'GPX tracks'], participation: ['find routes', 'inspect maps', 'follow authors'] },
  { family: 'models', platforms: ['Manyfold'], objects: ['3D models', 'files', 'collections'], participation: ['find models', 'inspect files', 'follow creators'] },
  { family: 'development', platforms: ['ForgeFed', 'Forgejo', 'Gitea', 'GitLab', 'Vervis'], objects: ['projects', 'repositories', 'issues', 'merge requests'], participation: ['follow projects', 'inspect issues', 'reply'] },
  { family: 'coordination', platforms: ['Bonfire ValueFlows', 'mutual-aid federation', 'ActivityPods'], objects: ['offers', 'needs', 'resources', 'intentions'], participation: ['find needs', 'offer help', 'request help', 'coordinate'] },
  { family: 'games', platforms: ['Castling.club'], objects: ['chess games', 'players', 'positions', 'moves'], participation: ['find players', 'inspect games', 'join challenges'] },
  { family: 'longform', platforms: ['WriteFreely', 'WordPress', 'Flipboard', 'RSS and Atom publishers'], objects: ['articles', 'blogs', 'newsletters'], participation: ['read', 'follow authors', 'reply'] },
  { family: 'bookmarks', platforms: ['Postmarks'], objects: ['bookmarks', 'links', 'notes', 'tags'], participation: ['find links', 'follow curators', 'save'] },
  { family: 'publishing', platforms: ['ZenPub', 'Ibis', 'XWiki', 'CommonsPub'], objects: ['publications', 'documents', 'chapters'], participation: ['read', 'follow publishers', 'discuss'] },
];

const fallbackResponse: NativeWorkflowResponse = {
  version: 1,
  workflows: fallbackWorkflows,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 32),
  ));
};

const normalizeWorkflow = (value: unknown): NativeWorkflow | null => {
  if (!isRecord(value) || typeof value.family !== 'string') return null;
  if (!allowedFamilies.has(value.family as NativeWorkflowFamily)) return null;

  const platforms = normalizeStringList(value.platforms);
  if (platforms.length === 0) return null;

  return {
    actions: normalizeStringList(value.actions),
    creation: normalizeStringList(value.creation),
    family: value.family as NativeWorkflowFamily,
    platforms,
    objects: normalizeStringList(value.objects),
    participation: normalizeStringList(value.participation),
  };
};

const normalizeResponse = (value: unknown): NativeWorkflowResponse => {
  if (!isRecord(value) || !Array.isArray(value.workflows)) return fallbackResponse;

  const received = value.workflows
    .map(normalizeWorkflow)
    .filter((workflow): workflow is NativeWorkflow => workflow !== null);
  const receivedByFamily = new Map(received.map(workflow => [workflow.family, workflow]));

  return {
    version: typeof value.version === 'number' && value.version > 0 ? value.version : 1,
    workflows: fallbackWorkflows.map(workflow => receivedByFamily.get(workflow.family) || workflow),
  };
};

export const useNativeWorkflows = () => {
  const api = useApi();
  const result = useQuery<NativeWorkflowResponse>({
    queryKey: ['nativeWorkflows', api.baseUrl],
    queryFn: async () => {
      const response = await api.get('/api/v1/discovery/native/workflows');
      if (!response.ok) return fallbackResponse;
      return normalizeResponse(await response.json());
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
    placeholderData: fallbackResponse,
  });

  return result.data || fallbackResponse;
};

/* end of useNativeWorkflows.ts */
