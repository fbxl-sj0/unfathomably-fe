/**
 * Unfathomably frontend
 *
 * File: actions/registration.ts
 *
 * Account-registration workflow loaded with the registration interface.
 * This file intentionally does not contain login or session restoration.
 */

import { createAccount } from '@/actions/accounts.ts';
import { authLoggedIn, createAppAndToken } from '@/actions/auth.ts';
import { startOnboarding } from '@/actions/onboarding.ts';

import type { AppDispatch } from '@/store.ts';

const register = (params: Record<string, any>) =>
  (dispatch: AppDispatch) => {
    params.fullname = params.username;

    return dispatch(createAppAndToken())
      .then(() => dispatch(createAccount(params)))
      .then(({ token }: { token: Record<string, string | number> }) => {
        dispatch(startOnboarding());
        return dispatch(authLoggedIn(token));
      });
  };

export { register };

/* end of actions/registration.ts */
