/*
  Unfathomably Frontend
  ---------------------

  File: useFederationStatus.ts

  Purpose:

    Load local federation-policy status for a host, URL, or acct-style search
    value before the user tries an interaction that local policy cannot allow.

  Responsibilities:

    * call the backend federation status endpoint
    * normalize failed or irrelevant lookups to an empty state
    * expose a small status object for search and follow UI hints

  This file intentionally does NOT contain:

    * MRF policy interpretation
    * follow or block mutations
    * visual rendering
*/

import { useEffect, useMemo, useState } from 'react';

import { useApi } from '@/hooks/useApi.ts';
import { federationStatusSchema, type FederationStatus } from '@/schemas/index.ts';

const emptyStatus = federationStatusSchema.parse({});

const looksLikeRemoteIdentifier = (value: string) => (
  value.startsWith('@') ||
  value.startsWith('acct:') ||
  /^https?:\/\//i.test(value) ||
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ||
  /^[^/\s]+\.[^/\s]+$/.test(value)
);

function useFederationStatus(q = '') {
  const api = useApi();
  const query = q.trim();
  const [status, setStatus] = useState<FederationStatus>(emptyStatus);
  const [isLoading, setIsLoading] = useState(false);

  const shouldFetch = useMemo(() => query.length > 0 && looksLikeRemoteIdentifier(query), [query]);

  useEffect(() => {
    let cancelled = false;

    if (!shouldFetch) {
      setStatus(emptyStatus);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    api.get('/api/v1/federation/status', { searchParams: { q: query } })
      .then(response => response.json())
      .then(data => federationStatusSchema.parse(data))
      .then((nextStatus) => {
        if (!cancelled) {
          setStatus(nextStatus);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(emptyStatus);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, query, shouldFetch]);

  return {
    isLoading,
    status,
  };
}

export { useFederationStatus };

/* end of useFederationStatus.ts */
