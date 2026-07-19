/*
  Project: Unfathomably FE
  File: actions/quote-authorizations.ts

  Purpose:
    Approve, reject, or revoke quote authorization requests.

  Responsibilities:
    Call the authenticated quote lifecycle endpoints and import the refreshed
    quote status returned by the backend.

  This file intentionally does NOT contain:
    Quote policy evaluation or ActivityPub authorization verification.
*/

import api from '@/api/index.ts';

import { importFetchedStatus } from './importer/index.ts';

import type { AppDispatch, RootState } from '@/store.ts';

type QuoteAuthorizationDecision = 'approve' | 'reject';

const updateQuoteAuthorization = (statusId: string, decision: QuoteAuthorizationDecision) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const response = await api(getState).post(`/api/v1/statuses/${statusId}/quote/${decision}`);
    const status = await response.json();

    dispatch(importFetchedStatus(status));
    return status;
  };

export { updateQuoteAuthorization };

/* end of actions/quote-authorizations.ts */
