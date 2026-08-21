import { useQuery } from '@tanstack/react-query';

import { HTTPError } from '@/api/HTTPError.ts';
import { useApi } from '@/hooks/useApi.ts';
import { InstanceV1, instanceV1Schema } from '@/schemas/instance.ts';

interface Opts {
  /** The base URL of the instance. */
  baseUrl?: string;
  enabled?: boolean;
  retryOnMount?: boolean;
  staleTime?: number;
}

interface CachedInstanceV1 {
  instance: InstanceV1;
  fetchedAt: number;
}

const INSTANCE_CACHE_PREFIX = 'soapbox:instance:v1:';
const INSTANCE_CACHE_STALE_TIME = 15 * 60 * 1000;

function readCachedInstance(cacheKey: string): CachedInstanceV1 | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const cached = JSON.parse(window.localStorage.getItem(cacheKey) ?? 'null');
    const instance = instanceV1Schema.safeParse(cached?.instance);

    if (instance.success && Number.isFinite(cached?.fetchedAt)) {
      return { instance: instance.data, fetchedAt: cached.fetchedAt };
    }
  } catch {
    // Storage may be disabled or contain data from an older frontend schema.
  }

  return undefined;
}

function writeCachedInstance(cacheKey: string, instance: InstanceV1): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify({ instance, fetchedAt: Date.now() }));
  } catch {
    // Instance metadata remains available through the in-memory query cache.
  }
}

/** Get the Instance for the current backend. */
export function useInstanceV1(opts: Opts = {}) {
  const api = useApi();

  const { baseUrl } = opts;
  const cacheKey = `${INSTANCE_CACHE_PREFIX}${baseUrl ?? api.baseUrl}`;
  const cached = readCachedInstance(cacheKey);

  const { data: instance, ...rest } = useQuery<InstanceV1>({
    queryKey: ['instance', baseUrl ?? api.baseUrl, 'v1'],
    queryFn: async () => {
      const response = await api.get('/api/v1/instance');
      const data = await response.json();
      const instance = instanceV1Schema.parse(data);

      writeCachedInstance(cacheKey, instance);

      return instance;
    },
    initialData: cached?.instance,
    initialDataUpdatedAt: cached?.fetchedAt,
    staleTime: INSTANCE_CACHE_STALE_TIME,
    retry: (failureCount, error) => {
      if (error instanceof HTTPError && error.response.status < 500) {
        return false;
      }

      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(500 * (2 ** attempt), 2000),
    ...opts,
  });

  return { instance, ...rest };
}
