import { changeComposeVisibility, replyCompose as replyComposeAction } from '@/actions/compose.ts';
import { Entities } from '@/entity-store/entities.ts';
import { selectEntity } from '@/entity-store/selectors.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useGetState } from '@/hooks/useGetState.ts';
import { normalizeStatus } from '@/normalizers/index.ts';
import { Status as StatusEntity } from '@/schemas/index.ts';

import type { Status as LegacyStatus } from '@/types/entities.ts';

interface ReplyComposeOptions {
  visibility?: 'direct' | 'private' | 'public' | 'unlisted';
}

export function useReplyCompose() {
  const getState = useGetState();
  const dispatch = useAppDispatch();

  const replyCompose = (statusId: string, options: ReplyComposeOptions = {}) => {
    let status: undefined|LegacyStatus|StatusEntity = getState().statuses.get(statusId);

    if (status) {
      dispatch(replyComposeAction(status));
      if (options.visibility) dispatch(changeComposeVisibility('compose-modal', options.visibility));
      return;
    }

    status = selectEntity<StatusEntity>(getState(), Entities.STATUSES, statusId);
    if (status) {
      dispatch(replyComposeAction(normalizeStatus(status) as LegacyStatus));
      if (options.visibility) dispatch(changeComposeVisibility('compose-modal', options.visibility));
    }
  };

  return { replyCompose };
}
