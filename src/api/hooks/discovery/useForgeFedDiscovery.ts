/*
 * Unfathomably received ForgeFed discovery
 * -----------------------------------------
 *
 * File: useForgeFedDiscovery.ts
 *
 * Purpose:
 *   Search ForgeFed resources already accepted through federation.
 *
 * Responsibilities:
 *   - validate resource actor, durable object, and public activity results
 *   - retain project, author, tracker, clone, hash, and commit context
 *   - distinguish local resolution from explicit source navigation
 *
 * This file intentionally does not query remote forges, clone repositories,
 * create tickets, or perform ForgeFed write operations.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

type ForgeFedKind =
  | 'approval'
  | 'apply'
  | 'assign'
  | 'branch'
  | 'commit'
  | 'enum'
  | 'enum_value'
  | 'factory'
  | 'field'
  | 'milestone'
  | 'patch'
  | 'patch_tracker'
  | 'project'
  | 'push'
  | 'release'
  | 'release_tracker'
  | 'repository'
  | 'review'
  | 'resolve'
  | 'roadmap'
  | 'team'
  | 'ticket'
  | 'ticket_dependency'
  | 'ticket_tracker'
  | 'workflow';

interface ForgeFedCommit {
  hash?: string;
  summary?: string;
  url?: string;
  author_url?: string;
  author_label?: string;
  committed_by_url?: string;
  context_url?: string;
  created_at?: string;
}

export interface ForgeFedDiscoveryItem {
  id: string;
  family: 'development';
  kind: ForgeFedKind;
  object_type: string;
  title: string;
  summary?: string;
  url: string;
  activitypub_url: string;
  source_host: string;
  author_url?: string;
  author_label?: string;
  context_url?: string;
  context_label?: string;
  object_url?: string;
  object_label?: string;
  clone_url?: string;
  push_url?: string;
  tracker_url?: string;
  patch_tracker_url?: string;
  component_urls: string[];
  component_count?: number;
  subproject_urls: string[];
  subproject_count?: number;
  fork_urls: string[];
  fork_count?: number;
  team_url?: string;
  is_archived: boolean;
  can_file_locally: boolean;
  moved_to_url?: string;
  ticket_kind?: 'issue' | 'merge_request';
  is_wip: boolean;
  origin_url?: string;
  origin_label?: string;
  target_url?: string;
  target_label?: string;
  diff_url?: string;
  patch_count?: number;
  required_approvals?: number;
  given_approvals?: number;
  replies_url?: string;
  dependencies_url?: string;
  dependants_url?: string;
  assignee_urls: string[];
  milestone_url?: string;
  resolved_by_url?: string;
  committed_by_url?: string;
  created_at?: string;
  committed_at?: string;
  status?: string;
  hash?: string;
  hash_before?: string;
  hash_after?: string;
  branch?: string;
  commit_count?: number;
  commits: ForgeFedCommit[];
  published_at?: string;
  resolved_at?: string;
  updated_at?: string;
  topics: string[];
  local_action: 'resolve';
}

interface ForgeFedDiscoveryProvider {
  type: 'local_federation_cache';
  host: string;
  status: 'ready';
}

interface ForgeFedDiscoveryResponse {
  items: ForgeFedDiscoveryItem[];
  providers: ForgeFedDiscoveryProvider[];
  has_more: boolean;
  next_offset?: number;
}

const kinds = new Set<ForgeFedKind>([
  'approval',
  'apply',
  'assign',
  'branch',
  'commit',
  'enum',
  'enum_value',
  'factory',
  'field',
  'milestone',
  'patch',
  'patch_tracker',
  'project',
  'push',
  'release',
  'release_tracker',
  'repository',
  'review',
  'resolve',
  'roadmap',
  'team',
  'ticket',
  'ticket_dependency',
  'ticket_tracker',
  'workflow',
]);

const emptyResponse: ForgeFedDiscoveryResponse = { items: [], providers: [], has_more: false };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const countValue = (value: unknown): number | undefined => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.flatMap(item => stringValue(item) || []).slice(0, 12)
  : [];

const webUrl = (value: unknown): string | undefined => {
  const url = stringValue(value)?.trim();
  if (!url || url.length > 2048) return undefined;

  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const normalizeCommit = (value: unknown): ForgeFedCommit | null => {
  if (!isRecord(value)) return null;

  const hash = stringValue(value.hash);
  const summary = stringValue(value.summary);
  const url = webUrl(value.url);
  const authorUrl = webUrl(value.author_url);
  const createdAt = stringValue(value.created_at);
  return hash || summary || url ? {
    hash,
    summary,
    url,
    author_url: authorUrl,
    author_label: stringValue(value.author_label),
    committed_by_url: webUrl(value.committed_by_url),
    context_url: webUrl(value.context_url),
    created_at: createdAt,
  } : null;
};

const normalizeItem = (value: unknown): ForgeFedDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'development' || value.local_action !== 'resolve') return null;

  const id = stringValue(value.id);
  const kind = stringValue(value.kind);
  const objectType = stringValue(value.object_type);
  const title = stringValue(value.title);
  const url = webUrl(value.url);
  const activitypubUrl = webUrl(value.activitypub_url);
  const sourceHost = stringValue(value.source_host);

  if (!id || !kind || !kinds.has(kind as ForgeFedKind) || !objectType || !title || !url || !activitypubUrl || !sourceHost) return null;

  return {
    id,
    family: 'development',
    kind: kind as ForgeFedKind,
    object_type: objectType,
    title,
    summary: stringValue(value.summary),
    url,
    activitypub_url: activitypubUrl,
    source_host: sourceHost,
    author_url: webUrl(value.author_url),
    author_label: stringValue(value.author_label),
    context_url: webUrl(value.context_url),
    context_label: stringValue(value.context_label),
    object_url: webUrl(value.object_url),
    object_label: stringValue(value.object_label),
    clone_url: webUrl(value.clone_url),
    push_url: webUrl(value.push_url),
    tracker_url: webUrl(value.tracker_url),
    patch_tracker_url: webUrl(value.patch_tracker_url),
    component_urls: Array.isArray(value.component_urls) ? value.component_urls.flatMap(item => webUrl(item) || []).slice(0, 8) : [],
    component_count: countValue(value.component_count),
    subproject_urls: Array.isArray(value.subproject_urls) ? value.subproject_urls.flatMap(item => webUrl(item) || []).slice(0, 8) : [],
    subproject_count: countValue(value.subproject_count),
    fork_urls: Array.isArray(value.fork_urls) ? value.fork_urls.flatMap(item => webUrl(item) || []).slice(0, 8) : [],
    fork_count: countValue(value.fork_count),
    team_url: webUrl(value.team_url),
    is_archived: value.is_archived === true,
    can_file_locally: value.can_file_locally === true,
    moved_to_url: webUrl(value.moved_to_url),
    ticket_kind: value.ticket_kind === 'issue' || value.ticket_kind === 'merge_request' ? value.ticket_kind : undefined,
    is_wip: value.is_wip === true,
    origin_url: webUrl(value.origin_url),
    origin_label: stringValue(value.origin_label),
    target_url: webUrl(value.target_url),
    target_label: stringValue(value.target_label),
    diff_url: webUrl(value.diff_url),
    patch_count: countValue(value.patch_count),
    required_approvals: countValue(value.required_approvals),
    given_approvals: countValue(value.given_approvals),
    replies_url: webUrl(value.replies_url),
    dependencies_url: webUrl(value.dependencies_url),
    dependants_url: webUrl(value.dependants_url),
    assignee_urls: Array.isArray(value.assignee_urls) ? value.assignee_urls.flatMap(item => webUrl(item) || []).slice(0, 8) : [],
    milestone_url: webUrl(value.milestone_url),
    resolved_by_url: webUrl(value.resolved_by_url),
    committed_by_url: webUrl(value.committed_by_url),
    created_at: stringValue(value.created_at),
    committed_at: stringValue(value.committed_at),
    status: stringValue(value.status),
    hash: stringValue(value.hash),
    hash_before: stringValue(value.hash_before),
    hash_after: stringValue(value.hash_after),
    branch: stringValue(value.branch),
    commit_count: countValue(value.commit_count),
    commits: Array.isArray(value.commits)
      ? value.commits.map(normalizeCommit).filter((commit): commit is ForgeFedCommit => commit !== null).slice(0, 5)
      : [],
    published_at: stringValue(value.published_at),
    resolved_at: stringValue(value.resolved_at),
    updated_at: stringValue(value.updated_at),
    topics: stringArray(value.topics),
    local_action: 'resolve',
  };
};

const normalizeResponse = (value: unknown): ForgeFedDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid ForgeFed discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ForgeFedDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ForgeFedDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];
      const host = stringValue(provider.host);
      return provider.type === 'local_federation_cache' && provider.status === 'ready' && host
        ? [{ type: 'local_federation_cache', host, status: 'ready' }]
        : [];
    })
    : [];

  const nextOffset = countValue(value.next_offset);

  return {
    items,
    providers,
    has_more: value.has_more === true,
    next_offset: nextOffset,
  };
};

export const useForgeFedDiscovery = (enabled: boolean, query = '', offset = 0) => {
  const api = useApi();
  const result = useQuery<ForgeFedDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'receivedDevelopment', query, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ family: 'received_development', limit: '18', offset: String(offset) });
      if (query.trim().length >= 2) params.set('q', query.trim());
      const response = await api.get(`/api/v1/discovery/native?${params.toString()}`);
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useForgeFedDiscovery.ts */
