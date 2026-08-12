import api from '../api/index.ts';

import { importFetchedStatus } from './importer/index.ts';

import type { AppDispatch, RootState } from '@/store.ts';
import type { APIEntity } from '@/types/entities.ts';

const setAcceptedAnswer = (statusId: string, accepted: boolean) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const action = accepted ? 'accept_answer' : 'unaccept_answer';
    const response = await api(getState).post(`/api/v1/statuses/${statusId}/${action}`);
    const status = await response.json() as APIEntity;

    dispatch(importFetchedStatus(status));

    return status;
  };

export { setAcceptedAnswer };
