import { useMutation } from '@tanstack/react-query';

import { fetchRelationshipsFail, fetchRelationshipsSuccess } from '@/actions/accounts.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useLoggedIn } from '@/hooks/useLoggedIn.ts';
import { getAccessToken } from '@/utils/auth.ts';

const useFetchRelationships = () => {
  const api = useApi();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useLoggedIn();
  const accessToken = useAppSelector(getAccessToken);

  return useMutation({
    mutationFn: ({ accountIds }: { accountIds: string[]}) => {
      if (!isLoggedIn || !accessToken || accountIds.length === 0) {
        return Promise.resolve(null);
      }

      const ids = accountIds.map((id) => `id[]=${encodeURIComponent(id)}`).join('&');

      return api.get(`/api/v1/accounts/relationships?${ids}`);
    },
    async onSuccess(response) {
      if (!response) return;

      dispatch(fetchRelationshipsSuccess(await response.json()));
    },
    onError(error) {
      dispatch(fetchRelationshipsFail(error));
    },
  });
};

export { useFetchRelationships };
