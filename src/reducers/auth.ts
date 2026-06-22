import { produce } from 'immer';
import { z } from 'zod';

import { HTTPError } from '@/api/HTTPError.ts';
import { keyring } from '@/features/nostr/keyring.ts';
import { useBunkerStore } from '@/hooks/nostr/useBunkerStore.ts';
import { Application, applicationSchema } from '@/schemas/application.ts';
import { accountSchema } from '@/schemas/index.ts';
import { AuthUser, authUserSchema, SoapboxAuth, soapboxAuthSchema } from '@/schemas/soapbox/soapbox-auth.ts';
import { Token, tokenSchema } from '@/schemas/token.ts';
import { jsonSchema } from '@/schemas/utils.ts';

import {
  AUTH_APP_CREATED,
  AUTH_LOGGED_IN,
  AUTH_LOGGED_OUT,
  SWITCH_ACCOUNT,
  VERIFY_CREDENTIALS_SUCCESS,
  VERIFY_CREDENTIALS_FAIL,
  AUTH_APP_AUTHORIZED,
  AUTH_ACCOUNT_REMEMBER_SUCCESS,
} from '../actions/auth.ts';
import { ME_FETCH_SKIP } from '../actions/me.ts';

import type { UnknownAction } from 'redux';

const STORAGE_KEY = 'soapbox:auth';
const SESSION_KEY = 'soapbox:auth:me';

const getLocalStorage = (): Storage | undefined => {
  try {
    return typeof document === 'undefined' ? undefined : document.defaultView?.localStorage;
  } catch {
    return undefined;
  }
};

const getSessionStorage = (): Storage | undefined => {
  try {
    return typeof document === 'undefined' ? undefined : document.defaultView?.sessionStorage;
  } catch {
    return undefined;
  }
};

const verifiedCredentialsIdentitySchema = z.object({
  id: z.string(),
  url: z.string().url().optional().catch(undefined),
  pleroma: z.object({
    ap_id: z.string().url().optional().catch(undefined),
  }).optional().catch(undefined),
});

// Log out legacy Nostr/Ditto users.
{
  const localStorage = getLocalStorage();
  const sessionStorage = getSessionStorage();

  if (localStorage && sessionStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && /^soapbox:nostr:auth:[0-9a-f]{64}$/.test(key)) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
    }
  }
}

/** Get current user's URL from session storage. */
function getSessionUser(): string | undefined {
  const value = getSessionStorage()?.getItem(SESSION_KEY);
  try {
    return z.string().url().parse(value);
  } catch {
    return undefined;
  }
}

/** Retrieve state from browser storage. */
function getLocalState(): SoapboxAuth | undefined {
  const data = getLocalStorage()?.getItem(STORAGE_KEY);
  const result = jsonSchema().pipe(soapboxAuthSchema).safeParse(data);

  if (!result.success) {
    return undefined;
  }

  return result.data;
}

/** Serialize and save the auth into localStorage. */
function persistAuth(auth: SoapboxAuth): void {
  const localStorage = getLocalStorage();
  const sessionStorage = getSessionStorage();

  if (!localStorage || !sessionStorage) {
    return;
  }

  const value = JSON.stringify(auth);
  localStorage.setItem(STORAGE_KEY, value);

  if (auth.me) {
    sessionStorage.setItem(SESSION_KEY, auth.me);
  }
}

/** Hydrate the initial state, or create a new state. */
function initialize(): SoapboxAuth {
  const auth = getLocalState() || { tokens: {}, users: {} };
  auth.me = getSessionUser() || auth.me;

  maybeShiftMe(auth);
  persistAuth(auth);

  return auth;
}

/** Initial state of the reducer. */
const initialState = initialize();

/** Import a Token into the state. */
function importToken(auth: SoapboxAuth, token: Token): SoapboxAuth {
  return produce(auth, draft => {
    draft.tokens[token.access_token] = token;
  });
}

/** Import Application into the state. */
function importApplication(auth: SoapboxAuth, app: Application): SoapboxAuth {
  return produce(auth, draft => {
    draft.app = app;
  });
}

/** If the user is not set, set it to the first available user. This mutates the object. */
function maybeShiftMe(auth: SoapboxAuth): void {
  if (!auth.me || !auth.users[auth.me]) {
    auth.me = Object.keys(auth.users)[0];
  }
}

type AccountIdentity = Pick<AuthUser, 'id' | 'url'>;

/** Import an Account into the state as an auth user. */
function importCredentials(auth: SoapboxAuth, accessToken: string, account: AccountIdentity): SoapboxAuth {
  const authUser: AuthUser = {
    id: account.id,
    access_token: accessToken,
    url: account.url,
  };

  return produce(auth, draft => {
    draft.users[authUser.url] = authUser;
    maybeShiftMe(draft);
  });
}

function importAuthUser(auth: SoapboxAuth, authUser: AuthUser): SoapboxAuth {
  return produce(auth, draft => {
    draft.users[authUser.url] = authUser;
    maybeShiftMe(draft);
  });
}

function getVerifiedAccountIdentity(auth: SoapboxAuth, accessToken: string, account: unknown): AccountIdentity | undefined {
  const parsedAccount = accountSchema.safeParse(account);

  if (parsedAccount.success) {
    return parsedAccount.data;
  }

  const parsedIdentity = verifiedCredentialsIdentitySchema.safeParse(account);

  if (!parsedIdentity.success) {
    return undefined;
  }

  /*
    Rebased's verify_credentials response can be accepted by the normalizer but
    rejected by the stricter runtime account schema. Auth persistence only needs
    the stable account id and ActivityPub URL, so fall back to those fields
    instead of losing a successful login across a page reload.
  */
  const url = parsedIdentity.data.url || parsedIdentity.data.pleroma?.ap_id || auth.tokens[accessToken]?.me;
  const parsedUrl = z.string().url().safeParse(url);

  if (!parsedUrl.success) {
    return undefined;
  }

  return {
    id: parsedIdentity.data.id,
    url: parsedUrl.data,
  };
}

/** Delete Nostr credentials when an access token is revoked. */
// TODO: Rework auth so this can all be conrolled from one place.
function revokeNostr(accessToken: string): void {
  const { connections, revoke } = useBunkerStore.getState();

  for (const conn of connections) {
    if (conn.accessToken === accessToken) {
      // Revoke the Bunker connection.
      revoke(accessToken);
      // Revoke the user's private key.
      keyring.delete(conn.pubkey);
      // Revoke the bunker's private key.
      keyring.delete(conn.bunkerPubkey);
    }
  }
}

function deleteToken(auth: SoapboxAuth, accessToken: string): SoapboxAuth {
  revokeNostr(accessToken);

  return produce(auth, draft => {
    delete draft.tokens[accessToken];

    for (const url in draft.users) {
      if (draft.users[url].access_token === accessToken) {
        delete draft.users[url];
      }
    }

    maybeShiftMe(draft);
  });
}

function deleteUser(auth: SoapboxAuth, accountUrl: string): SoapboxAuth {
  return produce(auth, draft => {
    const accessToken = draft.users[accountUrl]?.access_token;

    delete draft.tokens[accessToken];
    delete draft.users[accountUrl];

    maybeShiftMe(draft);
  });
}

function deleteForbiddenToken(auth: SoapboxAuth, error: HTTPError, token: string): SoapboxAuth {
  if ([401, 403].includes(error.response.status)) {
    return deleteToken(auth, token);
  } else {
    return auth;
  }
}

function reducer(state: SoapboxAuth, action: UnknownAction): SoapboxAuth {
  switch (action.type) {
    case AUTH_APP_CREATED: {
      const result = applicationSchema.safeParse(action.app);
      return result.success ? importApplication(state, result.data) : state;
    }
    case AUTH_APP_AUTHORIZED: {
      const result = tokenSchema.safeParse(action.token);
      if (result.success) {
        return produce(state, draft => {
          if (draft.app) {
            draft.app.access_token = result.data.access_token;
          }
        });
      } else {
        return state;
      }
    }
    case AUTH_LOGGED_IN: {
      const result = tokenSchema.safeParse(action.token);
      return result.success ? importToken(state, result.data) : state;
    }
    case AUTH_LOGGED_OUT: {
      const result = accountSchema.safeParse(action.account);
      return result.success ? deleteUser(state, result.data.url) : state;
    }
    case VERIFY_CREDENTIALS_SUCCESS: {
      if (typeof action.token !== 'string') {
        return state;
      }

      const identity = getVerifiedAccountIdentity(state, action.token, action.account);

      if (identity) {
        return importCredentials(state, action.token, identity);
      } else {
        return state;
      }
    }
    case AUTH_ACCOUNT_REMEMBER_SUCCESS: {
      const result = authUserSchema.safeParse(action.authUser);
      return result.success ? importAuthUser(state, result.data) : state;
    }
    case VERIFY_CREDENTIALS_FAIL: {
      if (action.error instanceof HTTPError && typeof action.token === 'string') {
        return deleteForbiddenToken(state, action.error, action.token);
      } else {
        return state;
      }
    }
    case SWITCH_ACCOUNT: {
      const result = accountSchema.safeParse(action.account);
      if (!result.success) {
        return state;
      }
      // Middle-click to switch profiles updates the user in the new tab but leaves the current tab alone.
      if (action.background === true) {
        getSessionStorage()?.setItem(SESSION_KEY, result.data.url);
        return state;
      }
      return { ...state, me: result.data.url };
    }
    case ME_FETCH_SKIP:
      return { ...state, me: undefined };
    default:
      return state;
  }
}

export default function auth(oldState: SoapboxAuth = initialState, action: UnknownAction): SoapboxAuth {
  const state = reducer(oldState, action);

  // Persist the state in localStorage when it changes.
  if (state !== oldState) {
    persistAuth(state);
  }

  // Reload the page when the user logs out or switches accounts.
  if (action.type === AUTH_LOGGED_OUT || (oldState.me && (oldState.me !== state.me))) {
    location.replace('/');
  }

  return state;
}
