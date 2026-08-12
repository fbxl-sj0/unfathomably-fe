/*
 * Unfathomably connected ecosystems panel
 * ----------------------------------------
 *
 * File: native-community-catalog-panel.tsx
 *
 * Purpose:
 *   Give Worlds visitors a useful entry point into configured alien-platform
 *   communities before a followable actor from that platform is local.
 *
 * Responsibilities:
 *   - render server-approved community origins by selected object family
 *   - explain each community's intended public workflow
 *   - keep opening an outside community a deliberate visitor action
 *
 * This file intentionally does not claim that an outside community is already
 * followed, resolve an actor, or make background requests to that community.
 */

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { useNativeCommunityCatalog } from '@/api/hooks/discovery/useNativeCommunityCatalog.ts';

import type { PresentationFamily } from './presentation-family.ts';

interface NativeCommunityCatalogPanelProps {
  family: PresentationFamily;
}

const familyLabels: Record<string, string> = {
  audio: 'Audio',
  books: 'Books',
  bookmarks: 'Bookmarks',
  coordination: 'Coordination',
  culture: 'Culture',
  development: 'Software',
  events: 'Events',
  games: 'Games',
  groups: 'Groups',
  longform: 'Longform',
  marketplace: 'Markets',
  models: '3D models',
  photo: 'Photography',
  publishing: 'Publishing',
  routes: 'Routes',
  video: 'Video',
};

const familyLabel = (family: string) => familyLabels[family] || family;

const emptyGuidance: Partial<Record<PresentationFamily, string>> = {
  bookmarks: 'Postmarks uses one actor per self-hosted bookmark site rather than a global public directory. Review the official workflow, then resolve a specific Postmarks actor by its complete handle or actor URL.',
  coordination: 'ActivityPods Mutual Aid is private by default, while Bonfire Coordination and Cooperation remain in development. Neither has a safe global directory: review the ecosystem guides, then use a complete Pod or actor URL from a trusted introduction.',
  development: 'ForgeFed intentionally does not provide a central project registry. Use a repository or project actor URL published by the project maintainer, then resolve that exact target below.',
};

const familyGuidance: Partial<Record<PresentationFamily, string>> = {
  coordination: 'Coordination is relationship-led rather than globally indexed. Public records already received here can be searched below. Reviewed Bonfire communities provide safe starting points, but connecting still requires a complete public actor or object URL shared by that community.',
  development: 'Forge federation is still experimental across implementations. Prefer an exact actor or object URL published by the project rather than guessing from a repository web page.',
};

const NativeCommunityCatalogPanel: React.FC<NativeCommunityCatalogPanelProps> = ({ family }) => {
  const result = useNativeCommunityCatalog(family);
  const items = result.data?.items || [];
  const localItems = items.filter(item => item.known_locally && item.local_url);
  const referenceItems = items.filter(item => !item.known_locally || !item.local_url);
  const refreshing = result.data?.refreshing === true;
  const guidance = familyGuidance[family];
  const noEntryPointGuidance = emptyGuidance[family]
    || 'This ecosystem does not currently have a trustworthy public directory configured here. Locally known compatible actors will appear automatically when they are available, and you can still resolve a complete handle or URL below.';

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
          <FormattedMessage id='native_community_catalog.title' defaultMessage='People and collections to follow' />
        </h2>
        <p className='mt-1 max-w-3xl text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage id='native_community_catalog.description' defaultMessage='Open a known creator, channel, collection, group, or service here, then follow it from its normal profile.' />
        </p>
        {guidance && <p className='mt-3 max-w-3xl rounded-xl border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 px-3 py-2 text-sm leading-6 text-primary-900 black:text-primary-200 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-100'>{guidance}</p>}
        {refreshing && <p className='mt-2 text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'><FormattedMessage id='native_community_catalog.refreshing' defaultMessage='Updating known choices' /></p>}
      </div>

      {localItems.length === 0 ? (
        <div className='px-5 py-7 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <p className='font-bold text-gray-950 black:text-white dark:text-white'>
            <FormattedMessage id='native_community_catalog.empty_title' defaultMessage='No followable starting point is known here yet' />
          </p>
          <p className='mt-1 max-w-3xl'>{noEntryPointGuidance}</p>
          <a href='#native-federation-target-search' className='mt-4 inline-flex rounded-lg border border-primary-500 px-3 py-2 font-bold text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30'>
            <FormattedMessage id='native_community_catalog.resolve_target' defaultMessage='Open a shared profile, community, or item link' />
          </a>
        </div>
      ) : (
        <div className='grid gap-3 p-4 sm:grid-cols-2 sm:p-5'>
          {localItems.map(item => (
            <article key={item.id} className='rounded-xl border border-gray-200 black:border-gray-800 bg-white black:bg-black p-4 dark:border-gray-700 dark:bg-primary-800'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.title}</p>
                <div className='flex shrink-0 flex-wrap justify-end gap-1'>
                  {family === 'all' && <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-0.5 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-900 dark:text-primary-200'>{familyLabel(item.family)}</span>}
                  <span className='rounded-full border border-primary-300 black:border-primary-700 px-2 py-0.5 text-xs font-bold text-primary-700 black:text-primary-300 dark:border-primary-700 dark:text-primary-300'>
                    {item.origin_type === 'known_actor' ? <FormattedMessage id='native_community_catalog.known' defaultMessage='Known here' /> : item.origin_type === 'reviewed_directory' ? <FormattedMessage id='native_community_catalog.reviewed_directory' defaultMessage='Reviewed directory' /> : item.origin_type === 'reviewed_community' ? <FormattedMessage id='native_community_catalog.reviewed' defaultMessage='Reviewed community' /> : item.origin_type === 'ecosystem_guide' ? <FormattedMessage id='native_community_catalog.ecosystem_guide' defaultMessage='Ecosystem guide' /> : <FormattedMessage id='native_community_catalog.configured' defaultMessage='Configured source' />}
                  </span>
                  <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-0.5 text-xs font-bold text-gray-700 black:text-gray-200 dark:border-gray-600 dark:text-gray-300'>
                    {item.access_mode === 'local' ? <FormattedMessage id='native_community_catalog.access_local' defaultMessage='Open locally' /> : item.access_mode === 'directory' ? <FormattedMessage id='native_community_catalog.access_directory' defaultMessage='Choose a community' /> : item.access_mode === 'guide' ? <FormattedMessage id='native_community_catalog.access_guide' defaultMessage='Read before connecting' /> : <FormattedMessage id='native_community_catalog.access_external' defaultMessage='Open at source' />}
                  </span>
                </div>
              </div>
              <h3 className='mt-1 truncate font-black text-gray-950 black:text-white dark:text-white'>{item.community_name || item.source_host}</h3>
              {item.community_name && <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>}
              <p className='mt-2 text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.workflow}</p>
              <div className='mt-4 flex flex-wrap gap-2'>
                {item.known_locally && item.local_url && <Link to={item.local_url} className='inline-flex rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'><FormattedMessage id='native_community_catalog.local_record' defaultMessage='Open here' /></Link>}
                <a href={item.url} target='_blank' rel='noopener noreferrer' className='inline-flex rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                  {item.access_mode === 'local' ? <FormattedMessage id='native_community_catalog.open_original' defaultMessage='Open original source' /> : item.access_mode === 'directory' ? <FormattedMessage id='native_community_catalog.open_directory' defaultMessage='Open directory' /> : item.access_mode === 'guide' ? <FormattedMessage id='native_community_catalog.open_guide' defaultMessage='Review ecosystem' /> : <FormattedMessage id='native_community_catalog.open_source' defaultMessage='Open source' />}
                </a>
                {item.access_mode !== 'local' && item.resolver_enabled && (
                  <a href='#native-federation-target-search' className='inline-flex rounded-lg border border-primary-500 px-3 py-2 text-sm font-black text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30'>
                    {item.resolver_label || <FormattedMessage id='native_community_catalog.resolve_entry' defaultMessage='Open here' />}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {referenceItems.length > 0 && (
        <details className='border-t border-gray-200 black:border-gray-800 dark:border-gray-800'>
          <summary className='cursor-pointer px-5 py-4 text-sm font-black text-primary-700 black:text-primary-300 dark:text-primary-300'>
            <FormattedMessage id='native_community_catalog.more_sources' defaultMessage='More places to search' />
          </summary>
          <div className='grid gap-2 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5'>
            {referenceItems.map(item => (
              <a key={`${item.origin_type}:${item.url}`} href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-xl border border-gray-300 black:border-gray-700 px-3 py-3 hover:border-primary-500 dark:border-gray-700'>
                <span className='block truncate text-sm font-black text-gray-950 black:text-white dark:text-white'>{item.community_name || item.source_host}</span>
                <span className='mt-1 block text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>{item.access_mode === 'guide' ? 'Ecosystem guide' : item.access_mode === 'directory' ? 'Directory' : 'External source'}</span>
              </a>
            ))}
          </div>
        </details>
      )}
    </section>
  );
};

export default NativeCommunityCatalogPanel;

/* end of native-community-catalog-panel.tsx */
