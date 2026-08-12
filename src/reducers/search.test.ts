/*
 * Project: Unfathomably FE
 * ------------------------
 * File: search.test.ts
 * Purpose: Protect search reducer state across replacement searches.
 * Responsibilities: Clear stale cursors and retain specialized search mode.
 * This file intentionally does NOT contain API or rendering tests.
 */

import { describe, expect, it } from 'vitest';

import { SEARCH_FETCH_REQUEST, SEARCH_RESULTS_CLEAR } from '@/actions/search.ts';

import reducer from './search.ts';

describe('search reducer', () => {
  it('resets a stale cursor and records specialized search mode', () => {
    const state = reducer(undefined, {} as any).set('next', '/api/v2/search?offset=20');
    const result = reducer(state, {
      type: SEARCH_FETCH_REQUEST,
      value: 'video:true',
      shortVideosOnly: true,
    } as any);

    expect(result.next).toBeNull();
    expect(result.shortVideosOnly).toBe(true);
  });

  it('clears the cursor and specialized search mode with the results', () => {
    const state = reducer(undefined, {} as any)
      .set('next', '/api/v2/search?offset=20')
      .set('shortVideosOnly', true);
    const result = reducer(state, { type: SEARCH_RESULTS_CLEAR } as any);

    expect(result.next).toBeNull();
    expect(result.shortVideosOnly).toBe(false);
  });
});

/* end of search.test.ts */
