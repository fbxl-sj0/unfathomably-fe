/*
 * Unfathomably forge discovery panel
 * -----------------------------------
 *
 * File: forge-discovery-panel.tsx
 *
 * Purpose:
 *   Turn public Forgejo repository search into a useful development workflow.
 *
 * Responsibilities:
 *   - search reviewed forges only after explicit submission
 *   - present project, owner, language, topic, and activity metadata
 *   - distinguish native project viewing from optional owner resolution
 *
 * This file intentionally does not imply that every repository is an
 * ActivityPub actor, clone code, or perform write operations against a forge.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoverySearchHeader from '@/features/native-federation/native-discovery-search-header.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { useForgeDiscovery } from '@/api/hooks/discovery/useForgeDiscovery.ts';

import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ForgeDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const ForgeDiscoveryPanel: React.FC<ForgeDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const visible = enabled && family === 'development';
  const result = useForgeDiscovery(submittedQuery, visible && submittedQuery.length >= 2);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim().slice(0, 200);
    if (nextQuery.length >= 2) setSubmittedQuery(nextQuery);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.forge.title' defaultMessage='Find public software projects' />}
        description={(
          <FormattedMessage
            id='native_discovery.forge.description'
            defaultMessage="Search reviewed Forgejo catalogs and open a project's real forge page. When its owner publishes a compatible profile, you can also open and follow that account here."
          />
        )}
        id='native-forge-discovery-search'
        label={<FormattedMessage id='native_discovery.forge.search_label' defaultMessage='Search public software projects' />}
        value={query}
        placeholder='Search project names, descriptions, or topics'
        submitLabel={<FormattedMessage id='native_discovery.forge.search' defaultMessage='Search projects' />}
        disabled={query.trim().length < 2}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!submittedQuery ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.forge.start' defaultMessage='Enter a project, organization, language, or topic. A reviewed forge is contacted only when you submit the search.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || (result.data.providers.length > 0 && result.data.providers.every(provider => provider.status === 'unavailable')) ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.forge.error' defaultMessage='Project search is temporarily unavailable. Developer accounts and activity already received here remain available below.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.forge.empty' defaultMessage='No public projects matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
          {result.data.items.map(item => (
            <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                  <a href={item.owner.url} target='_blank' rel='noopener noreferrer' className='mt-1 block truncate text-sm font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
                    {item.owner.name}
                  </a>
                </div>
                {item.language && <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>{item.language}</span>}
              </div>

              {item.summary && <p className='mt-3 line-clamp-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

              <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                <span><FormattedMessage id='native_discovery.forge.stars' defaultMessage='{count} stars' values={{ count: item.stars_count }} /></span>
                <span><FormattedMessage id='native_discovery.forge.forks' defaultMessage='{count} forks' values={{ count: item.forks_count }} /></span>
                <span><FormattedMessage id='native_discovery.forge.issues' defaultMessage='{count} open issues' values={{ count: item.open_issues_count }} /></span>
              </div>

              {item.topics.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {item.topics.map(topic => <span key={topic} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{topic}</span>)}
                </div>
              )}

              <div className='mt-4 flex flex-wrap gap-2'>
                <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                  <FormattedMessage id='native_discovery.forge.view' defaultMessage='View project' />
                </a>
                {item.activitypub_handle && (
                  <Link to={nativeResolvePath(family, item.activitypub_handle)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    <FormattedMessage id='native_discovery.forge.resolve_owner' defaultMessage='Open project owner here' />
                  </Link>
                )}
                {item.clone_url && <a href={item.clone_url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                  <FormattedMessage id='native_discovery.forge.clone' defaultMessage='Clone project' />
                </a>}
              </div>
            </NativeDiscoveryArticle>
          ))}
        </div>
      )}
    </section>
  );
};

export default ForgeDiscoveryPanel;

/* end of forge-discovery-panel.tsx */
