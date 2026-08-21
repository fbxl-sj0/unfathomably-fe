/*
 * Unfathomably marketplace discovery panel
 * -----------------------------------------
 *
 * File: marketplace-discovery-panel.tsx
 *
 * Purpose:
 *   Make federated Flohmarkt listings understandable and actionable in Worlds.
 *
 * Responsibilities:
 *   - collect an explicit listing search from the user
 *   - show price, source, tags, and an original-listing route clearly
 *   - direct seller contact to the marketplace that owns the listing
 *
 * This file intentionally does not expose user coordinates, claim an item is
 * available, resolve non-ActivityPub listing pages locally, or complete a
 * marketplace conversation on a user's behalf.
 */

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { fetchAccount } from '@/actions/accounts.ts';
import { directComposeById } from '@/actions/compose.ts';
import {
  useMarketplaceDiscovery,
  type MarketplaceDiscoveryItem,
} from '@/api/hooks/discovery/useMarketplaceDiscovery.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import WorldObjectStateControl from '@/components/world-object-state-control.tsx';

import NativeObjectUrlForm from './native-object-url-form.tsx';
import { nativeResolvePath } from './native-resolve-path.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import NativeDiscoveryPagination from './native-discovery-pagination.tsx';
import NativeDiscoverySearchHeader from './native-discovery-search-header.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface MarketplaceDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const MarketplaceDiscoveryPanel: React.FC<MarketplaceDiscoveryPanelProps> = ({ enabled, family }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { account } = useOwnAccount();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const visible = enabled && (family === 'all' || family === 'marketplace');
  const result = useMarketplaceDiscovery(submittedQuery, offset, visible);

  if (!visible) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = query.trim();
    if (nextQuery.length === 1) return;

    setOffset(0);
    setSubmittedQuery(nextQuery);
  };

  const contactSeller = (item: MarketplaceDiscoveryItem) => {
    if (!account || !item.seller_id) return;

    const listingReference = intl.formatMessage(
      {
        id: 'native_discovery.market.contact_reference',
        defaultMessage: 'I am contacting you about "{title}":\n{url}',
      },
      { title: item.title, url: item.url },
    );

    void dispatch(fetchAccount(item.seller_id)).then(() => {
      dispatch(directComposeById(item.seller_id!, listingReference));
    });
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <NativeDiscoverySearchHeader
        title={<FormattedMessage id='native_discovery.market.title' defaultMessage='Listings already connected to this server' />}
        description={(
          <FormattedMessage
            id='native_discovery.market.description'
            defaultMessage='Browse listings already shared with this server. Search by item, location, price, or condition.'
          />
        )}
        id='native-marketplace-discovery-search'
        label={<FormattedMessage id='native_discovery.market.search_label' defaultMessage='Search connected marketplaces' />}
        value={query}
        maxLength={200}
        placeholder='Search listings, descriptions, or tags'
        submitLabel={<FormattedMessage id='native_discovery.market.search' defaultMessage='Search listings' />}
        disabled={query.trim().length === 1}
        onChange={setQuery}
        onSubmit={submit}
      />

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <NativeDiscoveryState tone='danger' onRetry={() => void result.refetch()}>
          <FormattedMessage id='native_discovery.market.error' defaultMessage='Listings could not be searched right now.' />
        </NativeDiscoveryState>
      ) : result.data.providers.length === 0 ? (
        <NativeDiscoveryState
          action={<NativeObjectUrlForm
            family='marketplace'
            title={<FormattedMessage id='native_discovery.market.shared_title' defaultMessage='Have a listing link?' />}
            hint={<FormattedMessage id='native_discovery.market.shared_hint' defaultMessage='Paste a public listing link to preview it here.' />}
            placeholder='https://market.example/objects/...'
            action={<FormattedMessage id='native_discovery.market.shared_action' defaultMessage='View listing' />}
          />}
        >
          <FormattedMessage id='native_discovery.marketplace.not_configured' defaultMessage='Marketplace search is not available here yet.' />
        </NativeDiscoveryState>
      ) : result.data.items.length === 0 ? (
        <NativeDiscoveryState
          action={<NativeObjectUrlForm
            family='marketplace'
            title={<FormattedMessage id='native_discovery.market.shared_title' defaultMessage='Have a listing link?' />}
            hint={<FormattedMessage id='native_discovery.market.shared_hint' defaultMessage='Paste a public listing link to preview it here.' />}
            placeholder='https://market.example/objects/...'
            action={<FormattedMessage id='native_discovery.market.shared_action' defaultMessage='View listing' />}
          />}
        >
          <FormattedMessage id='native_discovery.market.empty' defaultMessage='No current public received listings are available for this view.' />
        </NativeDiscoveryState>
      ) : (
        <>
          <div className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
            {result.data.items.map(item => {
              const price = [item.price, item.currency].filter(Boolean).join(' ');
              const published = item.published_at && !Number.isNaN(new Date(item.published_at).getTime())
                ? new Intl.DateTimeFormat(intl.locale, { dateStyle: 'medium' }).format(new Date(item.published_at))
                : null;
              const expires = item.expires_at && !Number.isNaN(new Date(item.expires_at).getTime())
                ? new Intl.DateTimeFormat(intl.locale, { dateStyle: 'medium' }).format(new Date(item.expires_at))
                : null;

              return (
                <NativeDiscoveryArticle item={item} key={item.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                  {item.image_url && <img src={item.image_url} alt='' loading='lazy' className='mb-3 aspect-[2/1] w-full rounded-lg bg-black object-cover' />}
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='line-clamp-2 font-black leading-snug text-gray-950 black:text-white dark:text-white'>{item.title}</h3>
                    {price && <span className='shrink-0 rounded-full bg-primary-100 black:bg-primary-900 px-2.5 py-1 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700/40 dark:text-primary-200'>{price}</span>}
                  </div>
                  <p className='mt-1 truncate text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{item.source_host}</p>
                  {(item.seller_label || item.seller_handle || item.location) && (
                    <p className='mt-1 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      {[item.seller_label, item.seller_handle, item.location].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    <span className='rounded-full bg-primary-100 black:bg-primary-900 px-2 py-0.5 text-xs font-black text-primary-800 black:text-primary-200 dark:bg-primary-700/40 dark:text-primary-200'>
                      {item.purpose === 'request'
                        ? <FormattedMessage id='native_discovery.market.request' defaultMessage='Wanted' />
                        : <FormattedMessage id='native_discovery.market.offer' defaultMessage='Offered' />}
                    </span>
                    {item.availability && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-0.5 text-xs font-bold text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>{item.availability}</span>}
                    {published && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-0.5 text-xs text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>{published}</span>}
                    {expires && <span className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-0.5 text-xs text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>Expires {expires}</span>}
                  </div>
                  {item.summary && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{item.summary}</p>}
                  {(item.condition || item.delivery || item.category) && <p className='mt-2 text-xs font-bold text-gray-600 black:text-gray-300 dark:text-gray-300'>{[item.condition, item.delivery, item.category].filter(Boolean).join(' / ')}</p>}
                  {item.currency_url && (
                    <p className='mt-2 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
                      Currency:{' '}
                      <a className='font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' href={item.currency_url} rel='noopener noreferrer' target='_blank'>
                        {item.currency || 'View currency definition'}
                      </a>
                    </p>
                  )}
                  {item.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {item.tags.map(tag => <span key={tag} className='rounded-full border border-gray-300 black:border-gray-700 px-2 py-0.5 text-xs text-gray-600 black:text-gray-300 dark:border-gray-600 dark:text-gray-300'>#{tag}</span>)}
                    </div>
                  )}
                  <p className='mt-3 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    <FormattedMessage id='native_discovery.market.availability_notice' defaultMessage='Availability is reported by the source marketplace. Confirm it with the seller before making arrangements.' />
                  </p>
                  <p className='mt-1 text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
                    <FormattedMessage
                      id='native_discovery.market.contact_notice'
                      defaultMessage='You can contact a known seller with a private Fediverse message without following them. Payment, delivery, and other marketplace-specific controls remain on the original listing.'
                    />
                  </p>
                  <WorldObjectStateControl
                    family='marketplace'
                    objectUri={item.activitypub_url}
                    presentation={{
                      image: item.image_url,
                      source_host: item.source_host,
                      subtitle: price || item.location,
                      title: item.title,
                    }}
                  />
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {account && item.seller_id && (
                      <button type='button' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500' onClick={() => contactSeller(item)}>
                        <FormattedMessage id='native_discovery.market.contact' defaultMessage='Message seller' />
                      </button>
                    )}
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.market.open' defaultMessage='Open original listing' />
                    </a>
                    <Link to={nativeResolvePath('marketplace', item.activitypub_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                      <FormattedMessage id='native_discovery.market.resolve' defaultMessage='Open locally' />
                    </Link>
                    {item.seller_url && (
                      <Link to={nativeResolvePath('marketplace', item.seller_url)} className='rounded-lg border border-gray-300 black:border-gray-700 px-3 py-2 text-sm font-black text-gray-900 black:text-white hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-600 dark:text-white dark:hover:text-primary-300'>
                        <FormattedMessage id='native_discovery.market.seller' defaultMessage='Open seller locally' />
                      </Link>
                    )}
                  </div>
                </NativeDiscoveryArticle>
              );
            })}
          </div>

          <NativeDiscoveryPagination
            empty={result.data.items.length === 0}
            failed={result.isError}
            hasMore={result.data.has_more}
            loading={result.isFetching}
            offset={offset}
            onRecover={() => setOffset(0)}
            onPrevious={() => setOffset(Math.max(0, offset - 12))}
            onNext={() => setOffset(result.data.next_offset || offset + 12)}
          />
        </>
      )}
    </section>
  );
};

export default MarketplaceDiscoveryPanel;

/* end of marketplace-discovery-panel.tsx */
