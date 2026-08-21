/*
 * Unfathomably coordination discovery panel
 * -------------------------------------------
 *
 * File: coordination-discovery-panel.tsx
 *
 * Purpose:
 *   Make locally known ValueFlows and mutual-aid records understandable.
 *
 * Responsibilities:
 *   - browse recent or search indexed public coordination objects
 *   - display directional terms, participants, lifecycle, and source context
 *   - open accepted objects through the normal local resolver
 *
 * This file intentionally does not contact remote coordination servers,
 * promise availability, accept offers, or expose private records.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import {
  useCoordinationDiscovery,
  type CoordinationDiscoveryItem,
  type CoordinationIntent,
} from '@/api/hooks/discovery/useCoordinationDiscovery.ts';

import NativeObjectUrlForm from './native-object-url-form.tsx';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface CoordinationDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const roleLabel = (role: string) => {
  switch (role) {
    case 'offer':
      return 'Offering';
    case 'need':
      return 'Looking for';
    case 'proposal':
      return 'Exchange proposal';
    case 'economic_event':
      return 'Recorded activity';
    case 'resource':
      return 'Resource';
    case 'process':
      return 'Process';
    default:
      return role.replaceAll('_', ' ');
  }
};

const readableTerm = (value: string) => value.replaceAll('-', ' ').replaceAll('_', ' ');

const quantityLabel = (quantity: CoordinationIntent['quantity']) => quantity
  ? `${quantity.value}${quantity.unit ? ` ${quantity.unit}` : ''}`
  : undefined;

const timeLabel = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const participantLink = (label: string, url?: string) => url ? (
  <Link to={nativeResolvePath('coordination', url)} className='font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'>
    {label}
  </Link>
) : null;

const IntentTerms: React.FC<{ intent: CoordinationIntent; reciprocal?: boolean }> = ({ intent, reciprocal = false }) => {
  const heading = intent.title || intent.resource || (intent.action ? readableTerm(intent.action) : 'Coordination term');
  const amount = quantityLabel(intent.quantity);

  return (
    <li className='rounded-lg border border-gray-200 black:border-gray-800 bg-white black:bg-black p-3 dark:border-gray-700 dark:bg-primary-900'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <p className='font-bold text-gray-950 black:text-white dark:text-white'>{heading}</p>
        <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
          {reciprocal ? 'In return' : roleLabel(intent.role)}
        </span>
      </div>
      <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
        {intent.action && <span>Action: {readableTerm(intent.action)}</span>}
        {amount && <span>Quantity: {amount}</span>}
        {intent.location && <span>Location: {intent.location}</span>}
        {intent.ends_at && <span>By: {timeLabel(intent.ends_at)}</span>}
        {participantLink('Open term', intent.activitypub_url)}
        {participantLink('Open resource', intent.resource_url)}
        {participantLink('Open place', intent.location_url)}
        {participantLink('Provider', intent.provider_url)}
        {participantLink('Receiver', intent.receiver_url)}
      </div>
    </li>
  );
};

const localActionLabel = (item: CoordinationDiscoveryItem) => item.actionable
  ? 'Open local discussion'
  : 'Inspect locally';

const sourceActionLabel = (item: CoordinationDiscoveryItem) => item.actionable
  ? 'Confirm at source'
  : 'View source record';

const CoordinationDiscoveryPanel: React.FC<CoordinationDiscoveryPanelProps> = ({ enabled, family }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && family === 'coordination';
  const result = useCoordinationDiscovery(submittedQuery, offset, visible);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSubmittedQuery(query.trim().slice(0, 200));
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
          <FormattedMessage id='native_discovery.coordination.title' defaultMessage='Offers, needs, and coordination' />
        </h2>
        <p className='mt-1 max-w-3xl text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage
            id='native_discovery.coordination.description'
            defaultMessage='Browse active public ValueFlows and mutual-aid records this server has already accepted. Search also reveals matching completed or historical records; no remote community or private API is crawled.'
          />
        </p>
        <p className='mt-2 max-w-3xl rounded-lg border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 px-3 py-2 text-xs leading-5 text-primary-900 black:text-primary-200 dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-100'>
          <FormattedMessage
            id='native_discovery.coordination.boundary'
            defaultMessage='These records describe offers, needs, and proposed terms. Confirm availability and agreement at the source: ValueFlows does not define the conversation or transaction protocol.'
          />
        </p>

        <NativeDiscoverySearchForm
          id='native-coordination-discovery-search'
          label={<FormattedMessage id='native_discovery.coordination.search_label' defaultMessage='Search coordination records' />}
          value={query}
          placeholder='Optional item, skill, place, action, or community'
          submitLabel={<FormattedMessage id='native_discovery.coordination.search' defaultMessage='Search local records' />}
          onChange={setQuery}
          onSubmit={submit}
        />
      </div>

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.coordination.error' defaultMessage='Coordination records could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<NativeObjectUrlForm
            family='coordination'
            title={<FormattedMessage id='native_discovery.coordination.shared_title' defaultMessage='Did someone share an offer or request?' />}
            hint={<FormattedMessage id='native_discovery.coordination.shared_hint' defaultMessage='Paste a public request or offer link to preview its details and participants here.' />}
            placeholder='https://community.example/objects/...'
            action={<FormattedMessage id='native_discovery.coordination.shared_action' defaultMessage='View terms' />}
          />}
        >
          <FormattedMessage id='native_discovery.coordination.empty' defaultMessage='No offers, needs, or coordination records matched this search.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => (
              <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className='line-clamp-2 text-base font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    <p className='mt-1 truncate text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>{item.source_host}</p>
                  </div>
                  <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-black uppercase tracking-wide text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>
                    {roleLabel(item.role)}
                  </span>
                </div>

                {item.summary && <p className='mt-3 line-clamp-4 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}

                <dl className='mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                  {item.action && <><dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.action' defaultMessage='Action' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{readableTerm(item.action)}</dd></>}
                  <dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.availability' defaultMessage='Source state' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{readableTerm(item.availability)}</dd>
                  {item.quantity && <><dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.quantity' defaultMessage='Quantity' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{quantityLabel(item.quantity)}</dd></>}
                  {item.location && <><dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.location' defaultMessage='Location' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{item.location}</dd></>}
                  {item.begins_at && <><dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.begins' defaultMessage='Begins' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{timeLabel(item.begins_at)}</dd></>}
                  {item.ends_at && <><dt className='font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'><FormattedMessage id='native_discovery.coordination.ends' defaultMessage='Ends or due' /></dt><dd className='text-gray-900 black:text-white dark:text-white'>{timeLabel(item.ends_at)}</dd></>}
                </dl>

                {item.primary_intents.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='text-xs font-black uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>
                      <FormattedMessage id='native_discovery.coordination.terms' defaultMessage='Proposed terms' />
                    </h4>
                    <ul className='mt-2 space-y-2'>
                      {item.primary_intents.map((intent, index) => <IntentTerms key={`${item.id}:primary:${index}`} intent={intent} />)}
                    </ul>
                  </div>
                )}

                {item.reciprocal_intents.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='text-xs font-black uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>
                      <FormattedMessage id='native_discovery.coordination.reciprocal' defaultMessage='Requested in return' />
                    </h4>
                    <ul className='mt-2 space-y-2'>
                      {item.reciprocal_intents.map((intent, index) => <IntentTerms key={`${item.id}:reciprocal:${index}`} intent={intent} reciprocal />)}
                    </ul>
                  </div>
                )}

                {(item.primary_intent_count > item.primary_intents.length || item.reciprocal_intent_count > item.reciprocal_intents.length) && (
                  <p className='mt-3 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    <FormattedMessage
                      id='native_discovery.coordination.more_terms'
                      defaultMessage='Additional referenced terms are available in the source record.'
                    />
                  </p>
                )}

                {item.tags.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {item.tags.map(tag => <span key={tag} className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-1 text-xs font-bold text-primary-800 black:text-primary-200 dark:bg-primary-700 dark:text-primary-100'>{tag}</span>)}
                  </div>
                )}

                <WorldObjectStateControl
                  family='coordination'
                  objectUri={item.activitypub_url}
                  presentation={{
                    source_host: item.source_host,
                    subtitle: item.location || item.action,
                    title: item.title,
                  }}
                />

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Link to={nativeResolvePath(family, item.activitypub_url)} className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                    {localActionLabel(item)}
                  </Link>
                  <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                    {sourceActionLabel(item)}
                  </a>
                </div>

                <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                  {participantLink(item.provider_label || 'Provider', item.provider_url)}
                  {participantLink(item.receiver_label || 'Receiver', item.receiver_url)}
                  {participantLink(item.publisher_label || 'Publisher', item.publisher_url || item.actor_url)}
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
            onPrevious={() => setOffset(Math.max(0, offset - 24))}
            onNext={() => setOffset(result.data.next_offset ?? offset + 24)}
          />
        </>
      )}
    </section>
  );
};

export default CoordinationDiscoveryPanel;

/* end of coordination-discovery-panel.tsx */
