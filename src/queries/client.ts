import { QueryClient } from '@tanstack/react-query';

import { HTTPError } from '@/api/HTTPError.ts';

/** HTTP response codes to retry. */
const RETRY_CODES = [408, 425, 429, 500, 502, 503, 504, 521, 522, 523, 524];
const HTTP_RETRY_LIMIT = 3;
const NETWORK_RETRY_LIMIT = 2;
const RETRY_DELAY_BASE = 1000;
const RETRY_DELAY_MAX = 15_000;
const RETRY_DELAY_JITTER = 500;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex: number) => queryRetryDelay(attemptIndex),
    },
  },
});

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isTransientFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return error.name === 'TypeError' && (
    message.includes('failed to fetch')
    || message.includes('load failed')
    || message.includes('networkerror')
    || message.includes('network request failed')
  );
}

export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (browserIsOffline()) return false;

  if (error instanceof HTTPError) {
    const { response } = error;

    // TODO: Implement Retry-After.
    // const retryAfter = response.headers.get('Retry-After');

    return RETRY_CODES.includes(response.status) && failureCount < HTTP_RETRY_LIMIT;
  }

  return isTransientFetchError(error) && failureCount < NETWORK_RETRY_LIMIT;
}

export function queryRetryDelay(attemptIndex: number, randomValue = Math.random()): number {
  const normalizedAttemptIndex = Math.max(0, attemptIndex);
  const baseDelay = Math.min(RETRY_DELAY_BASE * (2 ** normalizedAttemptIndex), RETRY_DELAY_MAX);
  const normalizedRandomValue = Number.isFinite(randomValue) ? Math.min(Math.max(randomValue, 0), 1) : 0;

  return baseDelay + Math.floor(RETRY_DELAY_JITTER * normalizedRandomValue);
}

export { queryClient };
