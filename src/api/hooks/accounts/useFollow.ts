import { importEntities } from '@/entity-store/actions.ts';
import { Entities } from '@/entity-store/entities.ts';
import { useTransaction } from '@/entity-store/hooks/index.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useLoggedIn } from '@/hooks/useLoggedIn.ts';
import { relationshipSchema } from '@/schemas/index.ts';

interface FollowOpts {
  reblogs?: boolean;
  notify?: boolean;
  languages?: string[];
}

interface UnfollowOpts {
  wasFollowing?: boolean;
  wasRequested?: boolean;
}

function useFollow() {
  const api = useApi();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useLoggedIn();
  const { transaction } = useTransaction();

  function followEffect(accountId: string) {
    transaction({
      Accounts: {
        [accountId]: (account) => ({
          ...account,
          followers_count: account.followers_count + 1,
        }),
      },
      Relationships: {
        [accountId]: (relationship) => ({
          ...relationship,
          following: true,
        }),
      },
    });
  }

  function unfollowEffect(accountId: string, options: UnfollowOpts = {}) {
    const { wasFollowing = true } = options;

    transaction({
      Accounts: {
        [accountId]: (account) => ({
          ...account,
          followers_count: wasFollowing
            ? Math.max(0, account.followers_count - 1)
            : account.followers_count,
        }),
      },
      Relationships: {
        [accountId]: (relationship) => ({
          ...relationship,
          following: false,
          requested: false,
        }),
      },
    });
  }

  function restoreUnfollowEffect(accountId: string, options: UnfollowOpts = {}) {
    const { wasFollowing = true, wasRequested = false } = options;

    transaction({
      Accounts: {
        [accountId]: (account) => ({
          ...account,
          followers_count: wasFollowing
            ? account.followers_count + 1
            : account.followers_count,
        }),
      },
      Relationships: {
        [accountId]: (relationship) => ({
          ...relationship,
          following: wasFollowing,
          requested: wasRequested,
        }),
      },
    });
  }

  async function follow(accountId: string, options: FollowOpts = {}) {
    if (!isLoggedIn) return;
    followEffect(accountId);

    try {
      const response = await api.post(`/api/v1/accounts/${accountId}/follow`, options);
      const result = relationshipSchema.safeParse(await response.json());
      if (result.success) {
        dispatch(importEntities([result.data], Entities.RELATIONSHIPS));
      }
    } catch (e) {
      unfollowEffect(accountId);
    }
  }

  async function unfollow(accountId: string, options: UnfollowOpts = {}) {
    if (!isLoggedIn) return;
    unfollowEffect(accountId, options);

    try {
      const response = await api.post(`/api/v1/accounts/${accountId}/unfollow`);
      const result = relationshipSchema.safeParse(await response.json());
      if (result.success) {
        dispatch(importEntities([result.data], Entities.RELATIONSHIPS));
      }
    } catch (e) {
      restoreUnfollowEffect(accountId, options);
    }
  }

  return {
    follow,
    unfollow,
    followEffect,
    unfollowEffect,
  };
}

export { useFollow };
