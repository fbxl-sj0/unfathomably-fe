import { describe, expect, it } from 'vitest';

import { Entities } from '@/entity-store/entities.ts';
import accountFixture from '@/__fixtures__/pleroma-account.json';
import { createTestStore, rootState } from '@/jest/test-helpers.tsx';

import { importFetchedAccount } from './index.ts';

describe('importFetchedAccount', () => {
  const account = accountFixture as any;

  it('preserves known staff fields when an incoming account omits them', () => {
    const store = createTestStore(rootState);
    const partialAccount = {
      ...account,
      pleroma: {
        ...account.pleroma,
      },
    };

    delete partialAccount.pleroma.is_admin;
    delete partialAccount.pleroma.is_moderator;

    store.dispatch(importFetchedAccount(account) as any);
    store.dispatch(importFetchedAccount(partialAccount) as any);

    const cachedAccount = store.getState().entities[Entities.ACCOUNTS]?.store[account.id] as any;

    expect(cachedAccount?.admin).toBe(true);
    expect(cachedAccount?.moderator).toBe(false);
    expect(cachedAccount?.staff).toBe(true);
  });

  it('honors explicit staff field changes', () => {
    const store = createTestStore(rootState);
    const demotedAccount = {
      ...account,
      pleroma: {
        ...account.pleroma,
        is_admin: false,
        is_moderator: false,
      },
    };

    store.dispatch(importFetchedAccount(account) as any);
    store.dispatch(importFetchedAccount(demotedAccount) as any);

    const cachedAccount = store.getState().entities[Entities.ACCOUNTS]?.store[account.id] as any;

    expect(cachedAccount?.admin).toBe(false);
    expect(cachedAccount?.moderator).toBe(false);
    expect(cachedAccount?.staff).toBe(false);
  });
});
