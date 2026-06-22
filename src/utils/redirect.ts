import { useEffect } from 'react';

import type { Location } from '@/types/history.ts';

const LOCAL_STORAGE_REDIRECT_KEY = 'soapbox:redirect-uri';

const cacheCurrentUrl = (location: Location) => {
  const actualUrl = encodeURIComponent(`${location.pathname}${location.search}`);
  window.localStorage.setItem(LOCAL_STORAGE_REDIRECT_KEY, actualUrl);
  return actualUrl;
};

const getRedirectUrl = () => {
  let redirectUri = window.localStorage.getItem(LOCAL_STORAGE_REDIRECT_KEY);
  if (redirectUri) {
    redirectUri = decodeURIComponent(redirectUri);
  }

  window.localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);
  return redirectUri || '/';
};

const useCachedLocationHandler = () => {
  const removeCachedRedirectUri = () => window.localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);

  useEffect(() => {
    window.addEventListener('beforeunload', removeCachedRedirectUri);

    return () => {
      window.removeEventListener('beforeunload', removeCachedRedirectUri);
    };
  }, []);

  return null;
};

export { cacheCurrentUrl, getRedirectUrl, useCachedLocationHandler };
