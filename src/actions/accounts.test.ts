import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAccount, buildInstance } from '@/jest/factory.ts';
import { mockStore, rootState } from '@/jest/test-helpers.tsx';

import { fetchAccountByUsername } from './accounts.ts';

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock('../api/index.ts', () => ({
  default: () => ({
    get: getMock,
  }),
}));

describe('fetchAccountByUsername()', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('uses account lookup for fully-qualified remote accounts', async() => {
    const account = buildAccount({
      acct: 'dwarvenallfather@www.minds.com',
      id: 'remote-account',
      username: 'dwarvenallfather',
      url: 'https://www.minds.com/dwarvenallfather/',
    });

    getMock.mockImplementation((path: string) => {
      if (path === '/api/v1/accounts/lookup') {
        return Promise.resolve({ json: () => Promise.resolve(account) });
      }

      if (path === '/api/v1/accounts/relationships') {
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }

      return Promise.reject(new Error(`Unexpected API path: ${path}`));
    });

    const store = mockStore({
      ...rootState,
      instance: buildInstance({ version: '2.4.50 (compatible; Pleroma 2.4.50)' }),
      me: 'local-account',
    });

    await store.dispatch(fetchAccountByUsername('dwarvenallfather@www.minds.com'));

    expect(getMock).toHaveBeenCalledWith('/api/v1/accounts/lookup', expect.objectContaining({
      searchParams: { acct: 'dwarvenallfather@www.minds.com' },
    }));
    expect(getMock).not.toHaveBeenCalledWith('/api/v1/accounts/dwarvenallfather@www.minds.com');
  });
});
