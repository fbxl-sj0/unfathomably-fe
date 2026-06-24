import { describe, expect, it } from 'vitest';

import { HTTPError } from '@/api/HTTPError.ts';
import { MastodonResponse } from '@/api/MastodonResponse.ts';

import {
  isTransientFetchError,
  queryRetryDelay,
  shouldRetryQuery,
} from './client.ts';

function httpError(status: number): HTTPError {
  const response = MastodonResponse.fromResponse(new Response(null, { status }));
  const request = new Request('https://social.test/api/v1/timelines/home');

  return new HTTPError(response, request);
}

function setNavigatorOnline(online: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  });
}

describe('shouldRetryQuery', () => {
  it('retries temporary HTTP failures without retrying permanent responses', () => {
    setNavigatorOnline(true);

    expect(shouldRetryQuery(0, httpError(503))).toBe(true);
    expect(shouldRetryQuery(2, httpError(503))).toBe(true);
    expect(shouldRetryQuery(3, httpError(503))).toBe(false);
    expect(shouldRetryQuery(0, httpError(404))).toBe(false);
  });

  it('retries transient browser fetch failures while the browser is online', () => {
    setNavigatorOnline(true);

    const error = new TypeError('Failed to fetch');

    expect(isTransientFetchError(error)).toBe(true);
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(false);
  });

  it('does not retry while the browser reports offline', () => {
    setNavigatorOnline(false);

    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(false);

    setNavigatorOnline(true);
  });
});

describe('queryRetryDelay', () => {
  it('uses exponential delay with bounded jitter', () => {
    expect(queryRetryDelay(0, 0)).toBe(1000);
    expect(queryRetryDelay(1, 0.5)).toBe(2250);
    expect(queryRetryDelay(20, 1)).toBe(15_500);
  });

  it('clamps unusual values', () => {
    expect(queryRetryDelay(-1, Number.NaN)).toBe(1000);
    expect(queryRetryDelay(0, -1)).toBe(1000);
    expect(queryRetryDelay(0, 2)).toBe(1500);
  });
});
