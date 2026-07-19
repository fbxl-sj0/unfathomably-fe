/*
 * Unfathomably FE
 * ----------------
 *
 * File: useInvites.ts
 *
 * Purpose:
 *   Expose the Pleroma-compatible administrator invite API through the
 *   frontend's shared query and mutation layer.
 *
 * Responsibilities:
 *   - load generated invite tokens
 *   - create and revoke invite tokens
 *   - send registration invitations by email
 *
 * This file intentionally does not contain invite form or presentation logic.
 */

import { useMutation, useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';
import { queryClient } from '@/queries/client.ts';

interface InviteToken {
  id: number;
  token: string;
  used: boolean;
  expires_at: string | null;
  uses: number;
  max_use: number | null;
  invite_type: 'one_time' | 'reusable' | 'date_limited' | 'reusable_date_limited';
}

interface InviteList {
  invites: InviteToken[];
}

interface CreateInviteParams {
  max_use: number;
  expires_at?: string;
}

interface EmailInviteParams {
  email: string;
  name?: string;
}

const inviteQueryKey = ['admin', 'invites'] as const;

const useInvites = () => {
  const api = useApi();

  const queryInfo = useQuery<InviteToken[]>({
    queryKey: inviteQueryKey,
    queryFn: async () => {
      const response = await api.get('/api/v1/pleroma/admin/users/invites');
      const data: InviteList = await response.json();

      return data.invites;
    },
    placeholderData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (params: CreateInviteParams): Promise<InviteToken> => {
      const response = await api.post('/api/v1/pleroma/admin/users/invite_token', params);
      return response.json();
    },
    retry: false,
    onSuccess: (invite) => {
      queryClient.setQueryData<InviteToken[]>(inviteQueryKey, (invites = []) => [invite, ...invites]);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (token: string) => api.post('/api/v1/pleroma/admin/users/revoke_invite', { token }),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteQueryKey }),
  });

  const emailMutation = useMutation({
    mutationFn: (params: EmailInviteParams) => api.post('/api/v1/pleroma/admin/users/email_invite', params),
    retry: false,
  });

  return {
    ...queryInfo,
    createInvite: createMutation.mutate,
    isCreating: createMutation.isPending,
    revokeInvite: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    sendEmailInvite: emailMutation.mutate,
    isSendingEmail: emailMutation.isPending,
  };
};

export { useInvites };
export type { CreateInviteParams, EmailInviteParams, InviteToken };

/* end of useInvites.ts */
