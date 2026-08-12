/*
 * Project: Unfathomably FE
 *
 * File: useFederatedTargetCurations.ts
 *
 * Purpose:
 *   Manage the remote Groups deliberately featured in Worlds discovery.
 *
 * Responsibilities:
 *   - validate the protected administration response
 *   - add, enable, disable, reorder, and remove curation rows
 *   - invalidate the shared administration query after mutations
 *
 * This file intentionally does not resolve actors or render controls.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import * as z from '@/zod.ts';

import { useApi } from '@/hooks/useApi.ts';
import { queryClient } from '@/queries/client.ts';
import { groupSchema } from '@/schemas/index.ts';

const queryKey = ['admin', 'federated-target-curations'];

const federatedTargetCurationSchema = z.object({
  id: z.coerce.string(),
  enabled: z.boolean(),
  position: z.number().int().min(0).max(1_000_000),
  target: groupSchema,
});

const federatedTargetCurationsSchema = federatedTargetCurationSchema.array();

type FederatedTargetCuration = z.infer<typeof federatedTargetCurationSchema>;

interface UpdateCurationParams {
  id: string;
  enabled?: boolean;
  position?: number;
}

const responseError = async (response: Response, fallback: string): Promise<never> => {
  const body = await response.json().catch(() => ({})) as { error?: unknown };
  throw new Error(typeof body.error === 'string' ? body.error : fallback);
};

const useFederatedTargetCurations = (enabled = true) => {
  const api = useApi();

  const query = useQuery<ReadonlyArray<FederatedTargetCuration>>({
    queryKey,
    enabled,
    placeholderData: [],
    queryFn: async () => {
      const response = await api.get('/api/v1/pleroma/admin/federation/curated_groups');
      if (!response.ok) return responseError(response, 'Featured Groups could not be loaded.');
      return federatedTargetCurationsSchema.parse(await response.json());
    },
  });

  const create = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await api.post('/api/v1/pleroma/admin/federation/curated_groups', { identifier });
      if (!response.ok) return responseError(response, 'That remote Group could not be featured.');
      return federatedTargetCurationSchema.parse(await response.json());
    },
    retry: false,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...attrs }: UpdateCurationParams) => {
      const response = await api.patch(`/api/v1/pleroma/admin/federation/curated_groups/${id}`, attrs);
      if (!response.ok) return responseError(response, 'The featured Group could not be updated.');
      return federatedTargetCurationSchema.parse(await response.json());
    },
    retry: false,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/v1/pleroma/admin/federation/curated_groups/${id}`);
      if (!response.ok) return responseError(response, 'The featured Group could not be removed.');
    },
    retry: false,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    ...query,
    addCuration: create.mutateAsync,
    isCreating: create.isPending,
    updateCuration: update.mutateAsync,
    isUpdating: update.isPending,
    removeCuration: remove.mutateAsync,
    isRemoving: remove.isPending,
  };
};

export { useFederatedTargetCurations, type FederatedTargetCuration };

/* end of useFederatedTargetCurations.ts */
