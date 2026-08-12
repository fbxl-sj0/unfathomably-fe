/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/api/MastodonClient.test.ts

  Purpose:

    Prove that API credentials remain bound to the configured backend origin.

  Responsibilities:

    * cover relative and absolute same-origin API requests
    * prevent bearer-token leakage to remote media or object storage
    * prevent caller-supplied authorization from bypassing the origin boundary

  This file intentionally does NOT contain:

    * live network requests
    * OAuth token acquisition
    * browser redirect integration tests
*/

import { describe, expect, it, vi } from 'vitest';

import { MastodonClient } from './MastodonClient.ts';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const successfulFetch = () => vi.fn<FetchLike>(async () => new Response('{}', {
  status: 200,
  headers: { 'content-type': 'application/json' },
}));

describe('MastodonClient credential origin boundary', () => {
  it('attaches its bearer token to relative and absolute same-origin requests', async () => {
    const fetch = successfulFetch();
    const client = new MastodonClient('https://social.example', 'secret-token', fetch);

    await client.get('/api/v1/instance');
    await client.get('https://social.example/api/v1/accounts/verify_credentials');

    for (const [request] of fetch.mock.calls) {
      expect((request as Request).headers.get('Authorization')).toBe('Bearer secret-token');
    }
  });

  it('does not attach bearer or caller-supplied authorization to another origin', async () => {
    const fetch = successfulFetch();
    const client = new MastodonClient('https://social.example', 'secret-token', fetch);

    await client.get('https://media.example/object/video.mp4', {
      headers: { Authorization: 'Bearer caller-token' },
    });

    const request = fetch.mock.calls[0][0] as Request;
    expect(request.url).toBe('https://media.example/object/video.mp4');
    expect(request.headers.has('Authorization')).toBe(false);
  });

  it('does not trust a hostname that merely starts with the backend hostname', async () => {
    const fetch = successfulFetch();
    const client = new MastodonClient('https://social.example', 'secret-token', fetch);

    await client.get('https://social.example.attacker.test/api/v1/instance');

    const request = fetch.mock.calls[0][0] as Request;
    expect(request.headers.has('Authorization')).toBe(false);
  });
});

/* end of src/api/MastodonClient.test.ts */
