import { defineMessages } from 'react-intl';

import toast from '@/toast.tsx';

import api from '../api/index.ts';

import type { RootState } from '@/store.ts';

export const IMPORT_FOLLOWS_REQUEST = 'IMPORT_FOLLOWS_REQUEST';
export const IMPORT_FOLLOWS_SUCCESS = 'IMPORT_FOLLOWS_SUCCESS';
export const IMPORT_FOLLOWS_FAIL    = 'IMPORT_FOLLOWS_FAIL';

export const IMPORT_BLOCKS_REQUEST = 'IMPORT_BLOCKS_REQUEST';
export const IMPORT_BLOCKS_SUCCESS = 'IMPORT_BLOCKS_SUCCESS';
export const IMPORT_BLOCKS_FAIL    = 'IMPORT_BLOCKS_FAIL';

export const IMPORT_MUTES_REQUEST = 'IMPORT_MUTES_REQUEST';
export const IMPORT_MUTES_SUCCESS = 'IMPORT_MUTES_SUCCESS';
export const IMPORT_MUTES_FAIL    = 'IMPORT_MUTES_FAIL';

export const IMPORT_POST_ARCHIVE_REQUEST = 'IMPORT_POST_ARCHIVE_REQUEST';
export const IMPORT_POST_ARCHIVE_SUCCESS = 'IMPORT_POST_ARCHIVE_SUCCESS';
export const IMPORT_POST_ARCHIVE_FAIL    = 'IMPORT_POST_ARCHIVE_FAIL';

type ImportDataActions = {
  type: typeof IMPORT_FOLLOWS_REQUEST
  | typeof IMPORT_FOLLOWS_SUCCESS
  | typeof IMPORT_FOLLOWS_FAIL
  | typeof IMPORT_BLOCKS_REQUEST
  | typeof IMPORT_BLOCKS_SUCCESS
  | typeof IMPORT_BLOCKS_FAIL
  | typeof IMPORT_MUTES_REQUEST
  | typeof IMPORT_MUTES_SUCCESS
  | typeof IMPORT_MUTES_FAIL
  | typeof IMPORT_POST_ARCHIVE_REQUEST
  | typeof IMPORT_POST_ARCHIVE_SUCCESS
  | typeof IMPORT_POST_ARCHIVE_FAIL;
  error?: any;
  config?: any;
}

const messages = defineMessages({
  blocksSuccess: { id: 'import_data.success.blocks', defaultMessage: 'Blocks imported successfully' },
  followersSuccess: { id: 'import_data.success.followers', defaultMessage: 'Followers imported successfully' },
  mutesSuccess: { id: 'import_data.success.mutes', defaultMessage: 'Mutes imported successfully' },
  postArchiveModerated: { id: 'import_data.success.post_archive_moderated', defaultMessage: 'Post archive uploaded for review' },
  postArchiveQueued: { id: 'import_data.success.post_archive_queued', defaultMessage: 'Post archive import queued' },
});

export const importFollows = (params: FormData) =>
  (dispatch: React.Dispatch<ImportDataActions>, getState: () => RootState) => {
    dispatch({ type: IMPORT_FOLLOWS_REQUEST });
    return api(getState)
      .post('/api/pleroma/follow_import', params)
      .then((response) => response.json()).then((data) => {
        toast.success(messages.followersSuccess);
        dispatch({ type: IMPORT_FOLLOWS_SUCCESS, config: data });
      }).catch(error => {
        dispatch({ type: IMPORT_FOLLOWS_FAIL, error });
      });
  };

export const importBlocks = (params: FormData) =>
  (dispatch: React.Dispatch<ImportDataActions>, getState: () => RootState) => {
    dispatch({ type: IMPORT_BLOCKS_REQUEST });
    return api(getState)
      .post('/api/pleroma/blocks_import', params)
      .then((response) => response.json()).then((data) => {
        toast.success(messages.blocksSuccess);
        dispatch({ type: IMPORT_BLOCKS_SUCCESS, config: data });
      }).catch(error => {
        dispatch({ type: IMPORT_BLOCKS_FAIL, error });
      });
  };

export const importMutes = (params: FormData) =>
  (dispatch: React.Dispatch<ImportDataActions>, getState: () => RootState) => {
    dispatch({ type: IMPORT_MUTES_REQUEST });
    return api(getState)
      .post('/api/pleroma/mutes_import', params)
      .then((response) => response.json()).then((data) => {
        toast.success(messages.mutesSuccess);
        dispatch({ type: IMPORT_MUTES_SUCCESS, config: data });
      }).catch(error => {
        dispatch({ type: IMPORT_MUTES_FAIL, error });
      });
  };

export const importPostArchive = (params: FormData) =>
  (dispatch: React.Dispatch<ImportDataActions>, getState: () => RootState) => {
    dispatch({ type: IMPORT_POST_ARCHIVE_REQUEST });

    return api(getState)
      .post('/api/pleroma/post_archive_import', params)
      .then((response) => response.json()).then((data) => {
        if (data?.state === 'awaiting_review') {
          toast.success(messages.postArchiveModerated);
        } else {
          toast.success(messages.postArchiveQueued);
        }

        dispatch({ type: IMPORT_POST_ARCHIVE_SUCCESS, config: data });
      }).catch(error => {
        dispatch({ type: IMPORT_POST_ARCHIVE_FAIL, error });
        toast.showAlertForError(error);
      });
  };
