/*
 * Unfathomably alien publishing discovery panel
 * ----------------------------------------------
 *
 * File: publishing-discovery-panel.tsx
 *
 * Purpose:
 *   Present public alien bookmarks, articles, and documents meaningfully.
 *
 * Responsibilities:
 *   - browse recent or search indexed locally received publishing objects
 *   - distinguish a bookmark target from the ActivityPub object sharing it
 *   - expose author, subject, language, licence, tags, and attachment context
 *
 * This file intentionally does not crawl outboxes, download attachments,
 * bypass content warnings, or imply that the local cache is a global index.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { usePublishingDiscovery } from '@/api/hooks/discovery/usePublishingDiscovery.ts';

import type { PublishingDiscoveryFamily } from '@/api/hooks/discovery/usePublishingDiscovery.ts';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface PublishingDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const definitions: Record<PublishingDiscoveryFamily, {
  title: string;
  description: string;
  placeholder: string;
  action: string;
  empty: string;
}> = {
  bookmarks: {
    title: 'Bookmarks known here',
    description: 'Browse Postmarks-compatible bookmarks and native link collections already received through federation. A saved page and the ActivityPub object sharing it remain separate, useful destinations.',
    placeholder: 'Optional title, site, annotation, or tag',
    action: 'Search local bookmarks',
    empty: 'No bookmarks matched this search. You can still open an exact bookmark or account link.',
  },
  longform: {
    title: 'Articles known here',
    description: 'Browse public root articles from WriteFreely, WordPress, Flipboard, and compatible publishers already received through federation. Replies and group-discussion pages are excluded.',
    placeholder: 'Optional title, author, topic, or text',
    action: 'Search local articles',
    empty: 'No articles matched this search. Try another title, author, or publication.',
  },
  publishing: {
    title: 'Publications known here',
    description: 'Browse received chapters, documents, and publication records from Ibis, CommonPub, ZenPub, XWiki, and compatible publishers without fetching their remote collections.',
    placeholder: 'Optional title, author, subject, or language',
    action: 'Search local publications',
    empty: 'No publications matched this search. You can still open an exact document or collection link.',
  },
};

const isPublishingFamily = (family: PresentationFamily): family is PublishingDiscoveryFamily => (
  family === 'bookmarks' || family === 'longform' || family === 'publishing'
);

const PublishingDiscoveryPanel: React.FC<PublishingDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [requested, setRequested] = useState(false);
  const visible = enabled && isPublishingFamily(family);
  const activeFamily: PublishingDiscoveryFamily = isPublishingFamily(family) ? family : 'longform';
  const definition = definitions[activeFamily];
  const result = usePublishingDiscovery(activeFamily, submittedQuery, offset, visible && requested);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSubmittedQuery(query.trim().slice(0, 200));
    setRequested(true);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={definition.title}
        description={definition.description}
        id='native-publishing-discovery-search'
        label={<FormattedMessage id='native_discovery.publishing.search_label' defaultMessage='Search locally known publishing records' />}
        value={query}
        maxLength={200}
        placeholder={definition.placeholder}
        submitLabel={definition.action}
        onChange={setQuery}
        onSubmit={submit}
      />

      {!requested ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.publishing.start' defaultMessage='Search by text, or leave the field blank to browse recently received public records.' />
        </NativeDiscoveryState>
      ) : result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError || result.data.providers.every(provider => provider.status === 'unavailable') ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.publishing.error' defaultMessage='Publishing records could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<a href='#native-federation-target-search' className='mt-4 inline-flex rounded-lg border border-primary-500 px-3 py-2 font-black text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30'>
            <FormattedMessage id='native_discovery.publishing.resolve_exact' defaultMessage='Open a profile or shared item link' />
          </a>}
        >
          {definition.empty}
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    {item.subtitle && <p className='mt-1 line-clamp-2 text-sm font-bold text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.subtitle}</p>}
                    <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.site_name || item.source_host}</p>
                  </div>
                  <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black uppercase tracking-wide text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>{item.kind}</span>
                </div>

                {item.sensitive && <p className='mt-3 rounded-lg border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 px-3 py-2 text-sm font-bold text-primary-900 black:text-primary-200 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-100'><FormattedMessage id='native_discovery.publishing.sensitive' defaultMessage='Content warning applies. Open locally to review before reading.' /></p>}
                {item.summary && <p className='mt-3 line-clamp-5 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

                <div className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                  {item.byline && <span>{item.byline}</span>}
                  {item.subject && <span>{item.subject}</span>}
                  {item.language && <span>{item.language}</span>}
                  {item.licence && <span>{item.licence}</span>}
                  {item.target_host && <span>{item.target_host}</span>}
                </div>

                {item.tags.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>#{tag}</span>)}
                  </div>
                )}

                <div className='mt-4 flex flex-wrap gap-2'>
                  {item.target_url && (
                    <a href={item.target_url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                      <FormattedMessage id='native_discovery.publishing.open_bookmark' defaultMessage='Open saved page' />
                    </a>
                  )}
                  <Link to={nativeResolvePath(activeFamily, item.activitypub_url)} className={item.target_url ? 'rounded-lg border border-primary-500 px-3 py-2 text-sm font-black text-primary-700 black:text-primary-300 hover:bg-primary-50 black:hover:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-900/30' : 'rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'}>
                    <FormattedMessage id='native_discovery.publishing.open_local' defaultMessage='Open and interact here' />
                  </Link>
                  {item.url !== item.activitypub_url && (
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.publishing.open_source' defaultMessage='Open publication source' />
                    </a>
                  )}
                  {item.attachment && (
                    <a href={item.attachment.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      {item.attachment.name || item.attachment.media_type || 'Open attachment'}
                    </a>
                  )}
                  {item.actor_url && (
                    <Link to={nativeResolvePath(activeFamily, item.actor_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.publishing.open_publisher' defaultMessage='Open and follow publisher' />
                    </Link>
                  )}
                </div>
              </NativeDiscoveryArticle>
            ))}
          </div>

          <NativeDiscoveryPagination
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - 16))}
            onNext={() => setOffset(result.data.next_offset || offset + 16)}
          />
        </>
      )}
    </section>
  );
};

export default PublishingDiscoveryPanel;

/* end of publishing-discovery-panel.tsx */
