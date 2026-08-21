/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/api/hooks/discovery/useWorldObjectState.ts

  Purpose:
    Load a user's private-by-default workflow state for a native object.

  Responsibilities:
    - validate the backend response before exposing it to UI components
    - keep one stable query key per canonical object URI
    - avoid requests until an authenticated user and safe URI are available

  This file intentionally does not publish statuses or infer remote lifecycle
  state.
*/

import { useQuery } from '@tanstack/react-query';
import * as z from '@/zod.ts';

import { useApi } from '@/hooks/useApi.ts';

const dateTimeSchema = z.string().nullable();

export const worldObjectStateSchema = z.object({
  family: z.string(),
  finished_at: dateTimeSchema,
  id: z.string(),
  note: z.string().nullable(),
  object_uri: z.string().url(),
  presentation: z.record(z.string(), z.string()),
  progress: z.number().nonnegative().nullable(),
  progress_total: z.number().positive().nullable(),
  progress_unit: z.string().nullable(),
  public: z.boolean(),
  rating: z.number().int().min(1).max(10).nullable(),
  started_at: dateTimeSchema,
  state: z.string(),
  updated_at: z.string(),
});

export const worldObjectStateResponseSchema = z.object({
  allowed_states: z.array(z.string()),
  state: worldObjectStateSchema.nullable(),
});

export type WorldObjectState = z.infer<typeof worldObjectStateSchema>;
export type WorldObjectStateResponse = z.infer<typeof worldObjectStateResponseSchema>;

export const worldObjectStateQueryKey = (objectUri: string) => ['world-object-state', objectUri] as const;

export const safeWorldObjectUri = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
};

export const useWorldObjectState = (
  objectUri: string,
  family: string,
  enabled: boolean,
  initialData?: WorldObjectStateResponse,
) => {
  const api = useApi();

  return useQuery<WorldObjectStateResponse>({
    queryKey: worldObjectStateQueryKey(objectUri),
    queryFn: async () => {
      const response = await api.get('/api/v1/discovery/native-objects/state', {
        searchParams: { family, object_uri: objectUri },
      });
      return worldObjectStateResponseSchema.parse(await response.json());
    },
    enabled: enabled && safeWorldObjectUri(objectUri),
    initialData,
    staleTime: 30_000,
  });
};

/* end of src/api/hooks/discovery/useWorldObjectState.ts */
