/*
 * Unfathomably native object resolution
 * --------------------------------------
 *
 * File: useNativeObjectResolve.ts
 *
 * Purpose:
 *   Resolve one explicitly submitted ActivityPub object URL inside Worlds.
 *
 * Responsibilities:
 *   - call the authenticated, rate-limited native object resolver
 *   - validate status and source-only resource response envelopes
 *   - import ordinary statuses so existing specialized renderers remain in use
 *
 * This file intentionally does not resolve free text, contact remote servers
 * before submission, follow publishers, or render the resulting object.
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { importFetchedStatus } from '@/actions/importer/index.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

import type { APIEntity } from '@/types/entities.ts';

type NativeResourceField = string | number | boolean | Array<string | number | boolean>;

interface NativeResolvedResource {
  canonical_url: string;
  family: string;
  fields: Record<string, NativeResourceField>;
  kind?: string;
  platform: string;
  source_host: string;
  source_url: string;
  summary?: string;
  title: string;
  type: string;
}

type NativeObjectResolveResponse =
  | { result_type: 'status'; status: APIEntity }
  | { result_type: 'resource'; resource: NativeResolvedResource };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isHttpUrl = (value: string): boolean => {
  if (!value || value.length > 2048) return false;

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch (_error) {
    return false;
  }
};

const normalizeFields = (value: unknown): Record<string, NativeResourceField> => {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<Record<string, NativeResourceField>>((fields, [key, field]) => {
    if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
      fields[key] = field;
    } else if (Array.isArray(field)) {
      const values = field.filter((item): item is string | number | boolean => (
        typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      ));

      if (values.length > 0) fields[key] = values;
    }

    return fields;
  }, {});
};

const normalizeResource = (value: unknown): NativeResolvedResource | null => {
  if (!isRecord(value)) return null;

  const required = ['family', 'platform', 'source_host', 'title', 'type'] as const;
  if (required.some(key => typeof value[key] !== 'string' || !value[key])) return null;

  const canonicalUrl = typeof value.canonical_url === 'string' && isHttpUrl(value.canonical_url)
    ? value.canonical_url
    : null;
  const sourceUrl = typeof value.source_url === 'string' && isHttpUrl(value.source_url)
    ? value.source_url
    : null;

  if (!canonicalUrl || !sourceUrl) return null;

  return {
    canonical_url: canonicalUrl,
    family: value.family as string,
    fields: normalizeFields(value.fields),
    kind: typeof value.kind === 'string' && value.kind ? value.kind : undefined,
    platform: value.platform as string,
    source_host: value.source_host as string,
    source_url: sourceUrl,
    summary: typeof value.summary === 'string' && value.summary ? value.summary : undefined,
    title: value.title as string,
    type: value.type as string,
  };
};

const normalizeResponse = (value: unknown): NativeObjectResolveResponse => {
  if (!isRecord(value)) throw new Error('Invalid native object response');

  if (value.result_type === 'status' && isRecord(value.status) && typeof value.status.id === 'string') {
    return { result_type: 'status', status: value.status as APIEntity };
  }

  if (value.result_type === 'resource') {
    const resource = normalizeResource(value.resource);
    if (resource) return { result_type: 'resource', resource };
  }

  throw new Error('Invalid native object response');
};

const useNativeObjectResolve = (query: string, enabled: boolean) => {
  const api = useApi();
  const dispatch = useAppDispatch();
  const normalizedQuery = query.trim();
  const isResolvable = isHttpUrl(normalizedQuery);

  const result = useQuery<NativeObjectResolveResponse>({
    queryKey: ['nativeObjectResolve', api.baseUrl, normalizedQuery],
    queryFn: async () => {
      const response = await api.get('/api/v1/discovery/native-objects/resolve', {
        searchParams: { q: normalizedQuery },
      });

      return normalizeResponse(await response.json());
    },
    enabled: enabled && isResolvable,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (result.data?.result_type === 'status') {
      dispatch(importFetchedStatus(result.data.status));
    }
  }, [dispatch, result.data]);

  return {
    ...result,
    isResolvable,
    resource: result.data?.result_type === 'resource' ? result.data.resource : null,
    statusId: result.data?.result_type === 'status' ? result.data.status.id : null,
  };
};

export { useNativeObjectResolve, type NativeResolvedResource };

/* end of useNativeObjectResolve.ts */
