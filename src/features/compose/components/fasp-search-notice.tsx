/*
 * Unfathomably external account discovery notice
 * ------------------------------------------------
 *
 * File: fasp-search-notice.tsx
 *
 * Purpose:
 *   Explain when global account search can contact approved FASP providers.
 *
 * Responsibilities:
 *   - name active providers and link their privacy policies
 *   - explain what is and is not shared during account discovery
 *   - allow the expanded explanation to be dismissed per provider set
 *   - retain a compact indicator after dismissal
 *
 * This file intentionally does not attribute individual results to providers,
 * alter search requests, or control provider activation.
 */

import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useFaspDiscoveryProviders } from '@/api/hooks/discovery/useFaspDiscoveryProviders.ts';

interface FaspSearchNoticeProps {
  enabled: boolean;
}

const storageKey = 'unfathomably:fasp-account-search-disclosure-v1';

const FaspSearchNotice: React.FC<FaspSearchNoticeProps> = ({ enabled }) => {
  const providersQuery = useFaspDiscoveryProviders(enabled);
  const [storageReady, setStorageReady] = useState(false);
  const [dismissedSignature, setDismissedSignature] = useState('');
  const providers = providersQuery.data.providers;
  const signature = useMemo(
    () => providers.map(provider => provider.base_url).sort().join('|'),
    [providers],
  );

  useEffect(() => {
    try {
      setDismissedSignature(localStorage.getItem(storageKey) || '');
    } catch {
      setDismissedSignature('');
    } finally {
      setStorageReady(true);
    }
  }, []);

  if (!enabled || providersQuery.isLoading || providers.length === 0 || !storageReady) return null;

  const dismissed = signature.length > 0 && signature === dismissedSignature;

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, signature);
    } catch {
      // Storage can be disabled. The notice remains dismissible for this view.
    }
    setDismissedSignature(signature);
  };

  if (dismissed) {
    return (
      <div className='mx-4 mb-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-gray-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-gray-200'>
        <FormattedMessage
          id='search_results.fasp.compact'
          defaultMessage='External account discovery is active through {providers}. Search terms may be shared; account identity is not.'
          values={{ providers: providers.map(provider => provider.name).join(', ') }}
        />
      </div>
    );
  }

  return (
    <aside className='mx-4 mb-4 rounded-xl border border-primary-200 bg-primary-50 p-4 text-gray-900 dark:border-primary-800 dark:bg-primary-900/20 dark:text-gray-100'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='font-black'>
            <FormattedMessage id='search_results.fasp.title' defaultMessage='External account discovery is active' />
          </h2>
          <p className='mt-1 text-sm leading-6'>
            <FormattedMessage
              id='search_results.fasp.description'
              defaultMessage="This search may send the term you typed to the approved providers below. Unfathomably does not send your account identifier, and every returned actor still passes through this server's normal moderation, block, visibility, and reachability checks."
            />
          </p>
        </div>
        <button
          type='button'
          className='shrink-0 rounded-lg border border-primary-300 px-3 py-1.5 text-sm font-bold hover:bg-primary-100 dark:border-primary-700 dark:hover:bg-primary-800'
          onClick={dismiss}
        >
          <FormattedMessage id='search_results.fasp.dismiss' defaultMessage='Got it' />
        </button>
      </div>

      <ul className='mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm'>
        {providers.map(provider => (
          <li key={provider.base_url}>
            <a href={provider.base_url} target='_blank' rel='noopener noreferrer' className='font-bold text-primary-700 hover:underline dark:text-primary-300'>
              {provider.name}
            </a>
            {provider.privacy_policy.map(policy => (
              <a
                key={`${policy.language}:${policy.url}`}
                href={policy.url}
                target='_blank'
                rel='noopener noreferrer'
                className='ml-2 text-primary-700 hover:underline dark:text-primary-300'
              >
                <FormattedMessage
                  id='search_results.fasp.privacy'
                  defaultMessage='Privacy ({language})'
                  values={{ language: policy.language }}
                />
              </a>
            ))}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default FaspSearchNotice;

/* end of fasp-search-notice.tsx */
