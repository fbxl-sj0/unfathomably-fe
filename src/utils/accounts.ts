import avatarMissing from '@/assets/images/avatar-missing.png';
import headerMissing from '@/assets/images/header-missing.png';

import type { Account } from '@/schemas/index.ts';

const getDomainFromURL = (account: Pick<Account, 'url'>): string => {
  try {
    const url = account.url;
    return new URL(url).host;
  } catch {
    return '';
  }
};

export const getDomain = (account: Pick<Account, 'acct' | 'url'>): string => {
  const domain = account.acct.split('@')[1];
  return domain ? domain : getDomainFromURL(account);
};

export const getBaseURL = (account: Pick<Account, 'url'>): string => {
  try {
    return new URL(account.url).origin;
  } catch {
    return '';
  }
};

export const getAcct = (account: Pick<Account, 'fqn' | 'acct'>, displayFqn: boolean): string => (
  displayFqn === true ? account.fqn : account.acct
);

/** Default header filenames from various backends */
const DEFAULT_HEADERS: string[] = [
  '/headers/original/missing.png', // Mastodon
  '/images/banner.png', // Pleroma
  headerMissing, // header not provided by backend
];

/** Check if the avatar is a default avatar */
export const isDefaultHeader = (url: string) => {
  return DEFAULT_HEADERS.some(header => url.endsWith(header));
};

/** Default avatar filenames from various backends */
const DEFAULT_AVATARS = [
  '/avatars/original/missing.png', // Mastodon
  '/images/avi.png', // Pleroma
  avatarMissing, // avatar not provided by backend
];

/** Check if the avatar is a default avatar */
export const isDefaultAvatar = (url: string) => {
  return DEFAULT_AVATARS.some(avatar => url.endsWith(avatar));
};

/** Return the first usable avatar URL, or the bundled fallback asset. */
const firstUsableURL = (
  urls: unknown[],
  fallback: string,
  isDefault: (url: string) => boolean,
): string => {
  const url = urls.find(value => typeof value === 'string' && value.length > 0 && !isDefault(value));
  return typeof url === 'string' ? url : fallback;
};

export const getAvatarURL = (...urls: unknown[]): string => (
  firstUsableURL(urls, avatarMissing, isDefaultAvatar)
);

/** Return the first usable header URL, or the bundled fallback asset. */
export const getHeaderURL = (...urls: unknown[]): string => (
  firstUsableURL(urls, headerMissing, isDefaultHeader)
);
