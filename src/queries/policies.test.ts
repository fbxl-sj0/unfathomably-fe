/*
  Project: Unfathomably FE
  File: queries/policies.test.ts

  Purpose:
    Verify the backend policy acknowledgement API contract.

  Responsibilities:
    Assert request paths, payloads, and response parsing for pending and
    accepted policy updates.

  This file intentionally does NOT contain:
    Modal rendering or React Query hook lifecycle tests.
*/

import { describe, expect, it, vi } from 'vitest';

import { MastodonClient } from '@/api/MastodonClient.ts';

import { acceptPolicy, fetchPendingPolicy } from './policies.ts';

interface RecordedRequest {
  body: string;
  method: string;
  url: string;
}

function createRecordingClient(responseBody: unknown = {}) {
  const requests: RecordedRequest[] = [];

  const fetch = vi.fn(async (request: Request) => {
    requests.push({
      body: await request.clone().text(),
      method: request.method,
      url: request.url,
    });

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  return {
    api: new MastodonClient('https://truth.test', 'token', fetch as typeof globalThis.fetch),
    requests,
  };
}

describe('policy API contract', () => {
  it('fetches the pending policy id', async () => {
    const { api, requests } = createRecordingClient({ pending_policy_id: 'policy-1' });

    await expect(fetchPendingPolicy(api)).resolves.toEqual({ pending_policy_id: 'policy-1' });
    expect(requests).toEqual([{
      body: '',
      method: 'GET',
      url: 'https://truth.test/api/v1/truth/policies/pending',
    }]);
  });

  it('rejects an unexpected pending policy response', async () => {
    const { api } = createRecordingClient({ id: 'policy-1' });

    await expect(fetchPendingPolicy(api)).rejects.toThrow();
  });

  it('accepts a policy id with URL-safe encoding', async () => {
    const { api, requests } = createRecordingClient();

    await acceptPolicy(api, 'policy/with spaces');

    expect(requests).toEqual([{
      body: '{}',
      method: 'PATCH',
      url: 'https://truth.test/api/v1/truth/policies/policy%2Fwith%20spaces/accept',
    }]);
  });
});

/* end of queries/policies.test.ts */
