/*
  Unfathomably Frontend
  ---------------------

  File: useTargetSearch.test.ts

  Purpose:

    Prove that Worlds target discovery preserves the backend pagination
    contract while safely filtering malformed group and source rows.

  Responsibilities:

    * keep initial searches in a loading state until their response settles
    * advance pagination by server rows rather than client-accepted rows
    * distinguish malformed discovery responses from valid empty searches

  This file intentionally does NOT contain:

    * backend actor classification tests
    * rendered Worlds page assertions
    * live network requests
*/

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTargetSearch } from './useTargetSearch.ts';

const mocks = vi.hoisted(() => {
  const get = vi.fn();

  return {
    api: { get },
    get,
  };
});

vi.mock('@/hooks/useApi.ts', () => ({
  useApi: () => mocks.api,
}));

const sourceTarget = (id: number) => ({
  id,
  target_type: 'source',
});

const jsonResponse = (data: unknown) => ({
  json: async () => data,
});

describe('useTargetSearch()', () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  it('waits for the first query response before reporting a settled result', async () => {
    mocks.get.mockResolvedValueOnce(jsonResponse([sourceTarget(1)]));

    const { result } = renderHook(() => useTargetSearch('native'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetched).toBe(false);

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.count).toBe(1);
    expect(result.current.isError).toBe(false);
  });

  it('uses the server row count as the next offset when a row cannot be parsed', async () => {
    const firstPage = Array.from({ length: 23 }, (_, index) => sourceTarget(index + 1));
    firstPage.splice(7, 0, { target_type: 'source' } as ReturnType<typeof sourceTarget>);

    mocks.get
      .mockResolvedValueOnce(jsonResponse(firstPage))
      .mockResolvedValueOnce(jsonResponse([sourceTarget(25)]));

    const { result } = renderHook(() => useTargetSearch('native'));

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    expect(result.current.count).toBe(23);
    expect(result.current.isError).toBe(false);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(mocks.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/discovery/targets',
      expect.objectContaining({
        searchParams: expect.objectContaining({ offset: 24 }),
      }),
    );
    expect(result.current.count).toBe(24);
  });

  it('reports a page that contains no usable target rows', async () => {
    mocks.get.mockResolvedValueOnce(jsonResponse([{ target_type: 'source' }]));

    const { result } = renderHook(() => useTargetSearch('native'));

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(result.current.count).toBe(0);
    expect(result.current.isError).toBe(true);
  });

  it('reports an invalid discovery envelope instead of treating it as empty', async () => {
    mocks.get.mockResolvedValueOnce(jsonResponse([{ target_type: 'unexpected' }]));

    const { result } = renderHook(() => useTargetSearch('native'));

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(result.current.count).toBe(0);
    expect(result.current.isError).toBe(true);
  });

  it('keeps Worlds target searches in the selected native family', async () => {
    mocks.get.mockResolvedValueOnce(jsonResponse([]));

    const { result } = renderHook(() => useTargetSearch('trail', {
      nativeFamily: 'routes',
      nativeMode: true,
    }));

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/discovery/targets',
      expect.objectContaining({
        searchParams: expect.objectContaining({
          family: 'routes',
          mode: 'native',
          q: 'trail',
        }),
      }),
    );
  });
});

/* end of useTargetSearch.test.ts */
