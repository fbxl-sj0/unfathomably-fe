import { combineReducers, configureStore, Tuple } from '@reduxjs/toolkit';
import { thunk, type ThunkDispatch } from 'redux-thunk';

import errorsMiddleware from './middleware/errors.ts';
import soundsMiddleware from './middleware/sounds.ts';
import appReducer, { staticReducers } from './reducers/index.ts';

import type aliasesReducer from './reducers/aliases.ts';
import type backupsReducer from './reducers/backups.ts';
import type domainListsReducer from './reducers/domain-lists.ts';
import type historyReducer from './reducers/history.ts';
import type securityReducer from './reducers/security.ts';
import type { AnyAction, Reducer } from 'redux';

export const store = configureStore({
  reducer: appReducer,
  middleware: () => new Tuple(
    thunk,
    errorsMiddleware(),
    soundsMiddleware(),
  ),
  devTools: true,
});

const injectedReducers: Record<string, Reducer<any, AnyAction>> = {};

/**
 * Attach state owned by a lazy feature before that feature renders.
 *
 * Route-only reducers should not make every visitor download their actions and
 * data model during boot. Injection is idempotent because multiple lazy entry
 * points may share the same state.
 */
export const injectReducer = (key: string, reducer: Reducer<any, AnyAction>): void => {
  if (injectedReducers[key]) return;

  injectedReducers[key] = reducer;

  const reducerMap = {
    ...staticReducers,
    ...injectedReducers,
  };

  /*
   * The store starts with static state, then lazy routes add bounded reducer
   * keys. Redux cannot express that growing state shape through replaceReducer,
   * but the injected reducers retain the same action and state contracts.
   */
  store.replaceReducer(
    combineReducers(reducerMap) as unknown as Parameters<typeof store.replaceReducer>[0],
  );
};

export type Store = typeof store;

// Infer the `RootState` and `AppDispatch` types from the store itself
// https://redux.js.org/usage/usage-with-typescript
export type RootState = ReturnType<typeof store.getState> & {
  aliases: ReturnType<typeof aliasesReducer>;
  backups: ReturnType<typeof backupsReducer>;
  domain_lists: ReturnType<typeof domainListsReducer>;
  history: ReturnType<typeof historyReducer>;
  security: ReturnType<typeof securityReducer>;
};
export type AppDispatch = ThunkDispatch<RootState, {}, AnyAction>;
