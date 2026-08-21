import { useEffect, useMemo } from 'react';

import { HTTPError } from '@/api/HTTPError.ts';
import { useInstanceV1 } from '@/api/hooks/instance/useInstanceV1.ts';
import { useInstanceV2 } from '@/api/hooks/instance/useInstanceV2.ts';
import { instanceV2Schema, mergeInstance, upgradeInstance } from '@/schemas/instance.ts';
import { getFeatures } from '@/utils/features.ts';

import { useAppDispatch } from './useAppDispatch.ts';

interface Opts {
  /** The base URL of the instance. */
  baseUrl?: string;
  enabled?: boolean;
  retryOnMount?: boolean;
  staleTime?: number;
}

/** Get the Instance for the current backend. */
export function useInstance(opts: Opts = {}) {
  const { baseUrl, enabled = true, retryOnMount = false, staleTime = Infinity } = opts;

  // V1 is implemented by old and new Mastodon API backends alike. Its version
  // and metadata tell us whether requesting v2 is useful, avoiding a noisy 404
  // on Pleroma, Akkoma, and older Rebased installations.
  const v1 = useInstanceV1({ baseUrl, retryOnMount, staleTime, enabled });
  const supportsV2 = Boolean(v1.instance && getFeatures(v1.instance).instanceV2);
  const v2 = useInstanceV2({ baseUrl, retryOnMount, staleTime, enabled: enabled && supportsV2 });

  const instance = useMemo(() => {
    if (v2.instance) {
      return mergeInstance(v2.instance, v1.instance);
    } if (v1.instance) {
      return upgradeInstance(v1.instance);
    } else {
      return instanceV2Schema.parse({});
    }
  }, [v2.instance, v1.instance]);

  const props = supportsV2 && !v2.isError ? v2 : v1;
  const isNotFound = props.error instanceof HTTPError && props.error.response.status === 404;

  // HACK: store the instance in Redux for legacy code
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch({
      type: 'instanceV2/fetch/fulfilled',
      payload: { instance },
    });
  }, [instance]);

  return { ...props, instance, isNotFound };
}
