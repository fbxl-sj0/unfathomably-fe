/*
  Project: Unfathomably FE
  File: queries/policies.ts

  Purpose:
    Query and acknowledge backend policy updates that require user consent.

  Responsibilities:
    Fetch the pending policy marker, accept the current policy, and keep the
    React Query cache in sync with the backend response.

  This file intentionally does NOT contain:
    Modal rendering or policy document content.
*/

import { useMutation, useQuery } from '@tanstack/react-query';
import z from 'zod';

import { MastodonClient } from '@/api/MastodonClient.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import { queryClient } from './client.ts';

const pendingPolicySchema = z.object({
  pending_policy_id: z.string(),
});

const PolicyKeys = {
  pending: () => ['policy', 'pending'] as const,
};

async function fetchPendingPolicy(api: MastodonClient): Promise<PendingPolicy> {
  const response = await api.get('/api/v1/truth/policies/pending');
  const data = await response.json();

  return pendingPolicySchema.parse(data);
}

async function acceptPolicy(api: MastodonClient, policyId: string): Promise<void> {
  await api.patch(`/api/v1/truth/policies/${encodeURIComponent(policyId)}/accept`, {});
}

function usePendingPolicy() {
  const api = useApi();
  const features = useFeatures();
  const { account } = useOwnAccount();

  return useQuery({
    queryKey: PolicyKeys.pending(),
    queryFn: () => fetchPendingPolicy(api),
    enabled: Boolean(account && features.truthPolicies),
  });
}

function useAcceptPolicy() {
  const api = useApi();

  return useMutation({
    mutationFn: (policyId: string) => acceptPolicy(api, policyId),
    onSuccess() {
      queryClient.setQueryData(PolicyKeys.pending(), null);
    },
  });
}

type PendingPolicy = z.infer<typeof pendingPolicySchema>;

export {
  PolicyKeys,
  acceptPolicy,
  fetchPendingPolicy,
  pendingPolicySchema,
  type PendingPolicy,
  useAcceptPolicy,
  usePendingPolicy,
};

/* end of queries/policies.ts */
