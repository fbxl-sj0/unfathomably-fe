/*
  Project: Unfathomably FE
  File: src/api/hooks/admin/useFederationHealth.ts

  Purpose:
    Fetch the admin federation health snapshot from the backend.

  Responsibilities:
    - request the read-only federation health endpoint
    - validate the response before it reaches UI components
    - refresh often enough for queue state to be useful while viewed

  This file intentionally does NOT contain:
    - presentation logic
    - queue interpretation rules
*/

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';
import { federationHealthSchema, type FederationHealth } from '@/schemas/index.ts';

const useFederationHealth = () => {
  const api = useApi();

  const getFederationHealth = async () => {
    const response = await api.get('/api/v1/pleroma/admin/federation/health');
    const data: FederationHealth = await response.json();

    return federationHealthSchema.parse(data);
  };

  return useQuery<FederationHealth>({
    queryKey: ['admin', 'federation-health'],
    queryFn: getFederationHealth,
    refetchInterval: 30000,
  });
};

export { useFederationHealth };

/* end of src/api/hooks/admin/useFederationHealth.ts */
