import { useMemo } from 'react';

import { MastodonClient } from '@/api/MastodonClient.ts';
import * as BuildConfig from '@/build-config.ts';

import { useAppSelector } from './useAppSelector.ts';
import { useOwnAccount } from './useOwnAccount.ts';

export function useApi(): MastodonClient {
  const { account } = useOwnAccount();
  const authUserUrl = useAppSelector((state) => state.auth.me);
  const accessToken = useAppSelector((state) => {
    if (account?.url) {
      return state.auth.users[account.url]?.access_token;
    }

    return authUserUrl ? state.auth.users[authUserUrl]?.access_token : undefined;
  });

  /*
    ActivityPub actor URLs are federation identifiers, not necessarily the
    browser API origin. Smoke hosts, reverse proxies, and canonical public
    domains can all make account.url differ from location.origin.
  */
  const baseUrl = new URL(BuildConfig.BACKEND_URL || location.origin).origin;

  return useMemo(() => {
    return new MastodonClient(baseUrl, accessToken);
  }, [baseUrl, accessToken]);
}
