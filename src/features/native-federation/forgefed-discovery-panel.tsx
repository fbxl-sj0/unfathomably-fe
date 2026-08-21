/*
 * Unfathomably received ForgeFed discovery panel
 * -----------------------------------------------
 *
 * File: forgefed-discovery-panel.tsx
 *
 * Purpose:
 *   Present received ForgeFed resources and public development activity.
 *
 * Responsibilities:
 *   - search locally known resources without contacting remote forges
 *   - distinguish actors, tickets, commits, branches, releases, and pushes
 *   - expose source, author, project, tracker, clone, and local actions
 *
 * This file intentionally does not perform forge mutations, clone source,
 * imply write access, or expose non-public development activity.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import { useForgeFedDiscovery } from '@/api/hooks/discovery/useForgeFedDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ForgeFedDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const kindLabel = (kind: string): string => kind
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const shortHash = (hash?: string): string | null => hash ? hash.slice(0, 12) : null;

const dateLabel = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const referenceLabel = (value: string): string => {
  try {
    const url = new URL(value);
    const path = url.pathname.split('/').filter(Boolean).slice(-2).map(decodeURIComponent).join('/');
    return path ? `${url.hostname}/${path}` : url.hostname;
  } catch {
    return 'Related resource';
  }
};

const createPath = (template: 'software' | 'software_project', reference?: string): string => {
  const params = new URLSearchParams({ create: '1', template });
  if (reference) params.set('reference', reference);

  return `/worlds/development?${params.toString()}#worlds-create`;
};

const projectLane = (item: { is_archived?: boolean; is_wip?: boolean; kind: string; status?: string }): 'backlog' | 'active' | 'completed' => {
  const status = item.status?.toLowerCase() || '';

  if (item.is_archived || /^(closed|completed|done|merged|released|resolved)$/.test(status)) return 'completed';
  if (item.is_wip || /^(active|in progress|in_progress|open|review|reviewing)$/.test(status) || /ticket|issue|merge_request|patch/.test(item.kind)) return 'active';

  return 'backlog';
};

const ForgeFedDiscoveryPanel: React.FC<ForgeFedDiscoveryPanelProps> = ({ enabled, family }) => {
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<'cards' | 'board'>('cards');
  const visible = enabled && family === 'development';
  const result = useForgeFedDiscovery(visible, query, offset);

  if (!visible) return null;

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
          <FormattedMessage id='native_discovery.forgefed.title' defaultMessage='Received ForgeFed resources' />
        </h2>
        <p className='mt-1 max-w-3xl text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage
            id='native_discovery.forgefed.description'
            defaultMessage='Browse local projects and tickets alongside repositories, trackers, commits, releases, and public development activity received by this server.'
          />
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Link to={createPath('software_project')} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
            <FormattedMessage id='native_discovery.forgefed.create_project' defaultMessage='Create project' />
          </Link>
          <p className='self-center text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>To file an issue, find its project below and use that project's File issue action.</p>
        </div>

        <div className='mt-3 inline-flex overflow-hidden rounded-lg border border-primary-300 black:border-primary-700 dark:border-primary-700'>
          {(['cards', 'board'] as const).map(option => (
            <button
              aria-pressed={view === option}
              className={view === option
                ? 'bg-primary-600 px-3 py-2 text-sm font-black text-white'
                : 'bg-white black:bg-black px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:bg-primary-50 black:hover:bg-primary-950 dark:bg-primary-900 dark:text-white dark:hover:bg-primary-800'}
              key={option}
              type='button'
              onClick={() => setView(option)}
            >
              {option === 'cards' ? 'Activity' : 'Project board'}
            </button>
          ))}
        </div>

        <NativeDiscoverySearchForm
          disabled={draftQuery.trim().length === 1}
          id='native-forgefed-discovery-search'
          label={<FormattedMessage id='native_discovery.forgefed.search_label' defaultMessage='Search received development resources' />}
          value={draftQuery}
          placeholder='Project, repository, issue, author, branch, or commit'
          secondaryLabel={query
            ? <FormattedMessage id='native_discovery.clear' defaultMessage='Clear' />
            : undefined}
          submitLabel={<FormattedMessage id='native_discovery.forgefed.search' defaultMessage='Search received work' />}
          onChange={setDraftQuery}
          onSecondary={() => {
            setDraftQuery('');
            setQuery('');
            setOffset(0);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            const nextQuery = draftQuery.trim().slice(0, 200);
            if (nextQuery.length === 0 || nextQuery.length >= 2) {
              setQuery(nextQuery);
              setOffset(0);
            }
          }}
        />
      </div>

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.forgefed.error' defaultMessage='Projects and development activity could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          {query ? (
            <FormattedMessage id='native_discovery.forgefed.empty_search' defaultMessage='No projects or development activity matched this search.' />
          ) : (
            <FormattedMessage id='native_discovery.forgefed.empty' defaultMessage='No projects or issues have reached your server yet. Find a project below, then follow its owner for updates.' />
          )}
        </NativeDiscoveryState>
      ) : view === 'board' ? (
        <div className='grid gap-3 p-4 lg:grid-cols-3 sm:p-5'>
          {([
            ['backlog', 'Backlog'],
            ['active', 'Active'],
            ['completed', 'Completed'],
          ] as const).map(([lane, label]) => {
            const items = result.data.items.filter(item => projectLane(item) === lane);

            return (
              <section className='min-w-0 rounded-xl border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 p-3 dark:border-primary-800 dark:bg-primary-950/30' key={lane}>
                <h3 className='flex items-center justify-between text-sm font-black uppercase tracking-wide text-gray-900 black:text-white dark:text-white'>
                  <span>{label}</span>
                  <span className='rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white'>{items.length}</span>
                </h3>
                <div className='mt-3 space-y-2'>
                  {items.length === 0 ? (
                    <p className='py-4 text-center text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>No items</p>
                  ) : items.map(item => (
                    <Link
                      className='block rounded-lg border border-primary-200 black:border-primary-800 bg-white black:bg-black p-3 hover:border-primary-500 dark:border-primary-700 dark:bg-primary-900'
                      key={item.id}
                      to={nativeResolvePath('development', item.activitypub_url)}
                    >
                      <p className='line-clamp-2 text-sm font-black text-gray-950 black:text-white dark:text-white'>{item.title}</p>
                      <p className='mt-1 truncate text-xs font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.status || kindLabel(item.kind)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {result.data.items.map(item => {
            const facts = [
              item.status,
              item.is_archived ? 'archived' : null,
              item.is_wip ? 'work in progress' : null,
              item.branch,
              shortHash(item.hash),
              item.commit_count === undefined ? null : `${item.commit_count} commit${item.commit_count === 1 ? '' : 's'}`,
              item.patch_count === undefined ? null : `${item.patch_count} patch${item.patch_count === 1 ? '' : 'es'}`,
              item.required_approvals === undefined ? null : `${item.given_approvals || 0}/${item.required_approvals} approvals`,
              item.component_count === undefined ? null : `${item.component_count} component${item.component_count === 1 ? '' : 's'}`,
              item.subproject_count === undefined ? null : `${item.subproject_count} subproject${item.subproject_count === 1 ? '' : 's'}`,
              item.fork_count === undefined ? null : `${item.fork_count} fork${item.fork_count === 1 ? '' : 's'}`,
              dateLabel(item.published_at || item.updated_at),
            ].filter((fact): fact is string => Boolean(fact));
            const relationshipLinks = [
              ...item.component_urls.map(url => ({ label: `Component: ${referenceLabel(url)}`, url })),
              ...item.subproject_urls.map(url => ({ label: `Subproject: ${referenceLabel(url)}`, url })),
              ...item.fork_urls.map(url => ({ label: `Fork: ${referenceLabel(url)}`, url })),
              ...item.assignee_urls.map(url => ({ label: `Assigned to: ${referenceLabel(url)}`, url })),
            ];

            return (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    <p className='mt-1 truncate text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.source_host}</p>
                  </div>
                  <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                    {item.ticket_kind === 'merge_request' ? 'Merge request' : item.ticket_kind === 'issue' ? 'Issue' : kindLabel(item.kind)}
                  </span>
                </div>

                {item.author_label && <p className='mt-2 text-sm font-semibold text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.author_label}</p>}
                {item.context_label && <p className='mt-1 truncate text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.context_label}</p>}
                {item.summary && <p className='mt-3 line-clamp-4 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                {facts.length > 0 && <p className='mt-3 text-xs leading-5 text-gray-600 black:text-gray-300 dark:text-gray-300'>{facts.join(' | ')}</p>}

                {(item.origin_label || item.target_label) && (
                  <div className='mt-3 rounded-lg border border-gray-200 black:border-gray-800 bg-white black:bg-black px-3 py-2 text-xs text-gray-700 black:text-gray-200 dark:border-gray-700 dark:bg-primary-900 dark:text-gray-200'>
                    <span className='font-bold'>{item.origin_label || 'proposed changes'}</span>
                    <span className='mx-2 text-gray-400 black:text-gray-500'>to</span>
                    <span className='font-bold'>{item.target_label || 'target branch'}</span>
                    {item.diff_url && <a href={item.diff_url} target='_blank' rel='noopener noreferrer' className='ml-3 font-black text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>View diff</a>}
                  </div>
                )}

                {item.commits.length > 0 && (
                  <ul className='mt-3 space-y-2 border-l-2 border-primary-300 black:border-primary-700 pl-3 dark:border-primary-700'>
                    {item.commits.map((commit, index) => {
                      const commitContent = <>{commit.hash && <code className='mr-2 font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>{shortHash(commit.hash)}</code>}{commit.summary || 'Commit'}</>;

                      return (
                        <li key={`${commit.hash || commit.url || 'commit'}-${index}`} className='text-xs text-gray-700 black:text-gray-200 dark:text-gray-200'>
                          {commit.url ? <Link className='hover:underline' to={nativeResolvePath('development', commit.url)}>{commitContent}</Link> : commitContent}
                          {commit.author_url && <Link className='ml-2 font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to={nativeResolvePath('development', commit.author_url)}>{commit.author_label || 'Author'}</Link>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {item.topics.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {item.topics.map(topic => <span key={topic} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{topic}</span>)}
                  </div>
                )}

                {relationshipLinks.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {relationshipLinks.map(relationship => (
                      <Link key={`${relationship.label}:${relationship.url}`} to={nativeResolvePath('development', relationship.url)} className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-1 text-xs font-bold text-gray-700 black:text-gray-200 hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-gray-200 dark:hover:text-primary-300'>
                        {relationship.label}
                      </Link>
                    ))}
                  </div>
                )}

                <WorldObjectStateControl
                  family='development'
                  objectUri={item.activitypub_url}
                  presentation={{ source_host: item.source_host, title: item.title }}
                />
                <div className='mt-4 flex flex-wrap gap-2'>
                  {item.can_file_locally && (
                    <Link to={createPath('software', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.forgefed.file_project_issue' defaultMessage='File issue' />
                    </Link>
                  )}
                  <Link to={nativeResolvePath('development', item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                    <FormattedMessage id='native_discovery.resolve' defaultMessage='Open here' />
                  </Link>
                  <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.open_source' defaultMessage='Open source' />
                  </a>
                  {item.author_url && <Link to={nativeResolvePath('development', item.author_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_author' defaultMessage='Open author here' />
                  </Link>}
                  {item.context_url && item.context_url !== item.activitypub_url && <Link to={nativeResolvePath('development', item.context_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_project' defaultMessage='Open project here' />
                  </Link>}
                  {item.tracker_url && <Link to={nativeResolvePath('development', item.tracker_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_issues' defaultMessage='Open issue tracker' />
                  </Link>}
                  {item.patch_tracker_url && <Link to={nativeResolvePath('development', item.patch_tracker_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_patches' defaultMessage='Open patch tracker' />
                  </Link>}
                  {item.replies_url && <Link to={nativeResolvePath('development', item.replies_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_discussion' defaultMessage='Open discussion' />
                  </Link>}
                  {item.dependencies_url && <Link to={nativeResolvePath('development', item.dependencies_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_dependencies' defaultMessage='Open dependencies' />
                  </Link>}
                  {item.dependants_url && <Link to={nativeResolvePath('development', item.dependants_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Dependants</Link>}
                  {item.object_url && <Link to={nativeResolvePath('development', item.object_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open {item.object_label || 'affected resource'}</Link>}
                  {item.target_url && <Link to={nativeResolvePath('development', item.target_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open {item.target_label || 'target'}</Link>}
                  {item.team_url && <Link to={nativeResolvePath('development', item.team_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open team</Link>}
                  {item.milestone_url && <Link to={nativeResolvePath('development', item.milestone_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open milestone</Link>}
                  {item.resolved_by_url && <Link to={nativeResolvePath('development', item.resolved_by_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open resolver</Link>}
                  {item.committed_by_url && <Link to={nativeResolvePath('development', item.committed_by_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>Open committer</Link>}
                  {item.moved_to_url && <Link to={nativeResolvePath('development', item.moved_to_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.open_replacement' defaultMessage='Open replacement' />
                  </Link>}
                  {item.clone_url && <a href={item.clone_url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forgefed.clone' defaultMessage='Clone endpoint' />
                  </a>}
                </div>
              </NativeDiscoveryArticle>
            );
          })}
          <NativeDiscoveryPagination
            className='col-span-full border-t border-gray-200 pt-4 black:border-gray-800 dark:border-gray-700'
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            inset
            label={<FormattedMessage id='native_discovery.forgefed.page' defaultMessage='Resources {start}-{end}' values={{ start: offset + 1, end: offset + result.data.items.length }} />}
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - 18))}
            onNext={() => setOffset(result.data.next_offset ?? offset + 18)}
          />
        </div>
      )}
    </section>
  );
};

export default ForgeFedDiscoveryPanel;

/* end of forgefed-discovery-panel.tsx */
