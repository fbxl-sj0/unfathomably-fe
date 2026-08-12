/*
 * Unfathomably native discovery access notice
 * --------------------------------------------
 *
 * File: native-discovery-access-notice.tsx
 *
 * Purpose:
 *   Explain authenticated, user-initiated searches of configured specialized
 *   discovery sources.
 *
 * Responsibilities:
 *   - show the available next step without exposing provider administration
 *   - keep the sign-in action scoped to a useful Worlds family
 *
 * This file intentionally does NOT perform discovery, resolve an actor, or
 * establish a follow relationship.
 */

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import type { PresentationFamily } from './presentation-family.ts';

interface NativeDiscoveryAccessNoticeProps {
  family: PresentationFamily;
  signedIn: boolean;
}

const searchableFamilies: PresentationFamily[] = [
  'all',
  'audio',
  'books',
  'culture',
  'events',
  'games',
  'marketplace',
  'models',
  'routes',
  'video',
  'development',
  'coordination',
];

const NativeDiscoveryAccessNotice: React.FC<NativeDiscoveryAccessNoticeProps> = ({ family, signedIn }) => {
  if (signedIn || !searchableFamilies.includes(family)) return null;

  return (
    <section className='border-b border-gray-200 px-4 py-8 text-center black:border-gray-800 dark:border-gray-800 sm:px-5'>
      <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
        <FormattedMessage id='native_discovery.access.title' defaultMessage='Sign in to search connected sources' />
      </h2>
      <p className='mx-auto mt-1 max-w-md text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
        <FormattedMessage id='native_discovery.access.description' defaultMessage='Search specialized sources only when you choose to.' />
      </p>
      <Link className='mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-500' to='/login'>
        <FormattedMessage id='native_discovery.access.sign_in' defaultMessage='Sign in to search' />
      </Link>
    </section>
  );
};

export default NativeDiscoveryAccessNotice;

/* end of native-discovery-access-notice.tsx */
