/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-loading.tsx

  Purpose:

    Present specialized discovery loading through the same visual language as
    an ordinary status timeline.

  Responsibilities:

    * provide one accessible progress label for discovery requests
    * reserve post-shaped space while providers and local caches respond
    * honor the configured light, dark, and black themes

  This file intentionally does NOT contain:

    * provider-specific loading details
    * request or retry logic
    * empty and error state copy
*/

import { FormattedMessage } from 'react-intl';

import PlaceholderStatus from '@/features/placeholder/components/placeholder-status.tsx';

const NativeDiscoveryLoading = () => (
  <div role='status' className='divide-y divide-solid divide-gray-200 black:divide-gray-800 dark:divide-gray-800'>
    <span className='sr-only'>
      <FormattedMessage id='native_discovery.loading' defaultMessage='Loading results...' />
    </span>

    {[0, 1, 2].map(row => (
      <div key={row} aria-hidden='true'>
        <PlaceholderStatus />
      </div>
    ))}
  </div>
);

export default NativeDiscoveryLoading;

/* end of src/features/native-federation/native-discovery-loading.tsx */
