import { NKeyring } from './NKeyring.ts';

const getStorage = (): Storage | undefined => {
  try {
    return typeof document === 'undefined' ? undefined : document.defaultView?.localStorage;
  } catch {
    return undefined;
  }
};

export const keyring = new NKeyring(
  getStorage(),
  'soapbox:nostr:keys',
);
