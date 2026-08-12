import { selectAccount } from '@/selectors/index.ts';
import toast from '@/toast.tsx';
import { isLoggedIn } from '@/utils/auth.ts';

import api from '../api/index.ts';

import { importFetchedAccounts } from './importer/index.ts';

import type { AppDispatch, RootState } from '@/store.ts';
import type { APIEntity } from '@/types/entities.ts';

import {
  LIST_FETCH_REQUEST,
  LIST_FETCH_SUCCESS,
  LIST_FETCH_FAIL,
  LISTS_FETCH_REQUEST,
  LISTS_FETCH_SUCCESS,
  LISTS_FETCH_FAIL,
  LIST_EDITOR_TITLE_CHANGE,
  LIST_EDITOR_EMOJI_CHANGE,
  LIST_EDITOR_EXCLUSIVE_CHANGE,
  LIST_EDITOR_RESET,
  LIST_EDITOR_SETUP,
  LIST_CREATE_REQUEST,
  LIST_CREATE_SUCCESS,
  LIST_CREATE_FAIL,
  LIST_UPDATE_REQUEST,
  LIST_UPDATE_SUCCESS,
  LIST_UPDATE_FAIL,
  LIST_DELETE_REQUEST,
  LIST_DELETE_SUCCESS,
  LIST_DELETE_FAIL,
  LIST_ACCOUNTS_FETCH_REQUEST,
  LIST_ACCOUNTS_FETCH_SUCCESS,
  LIST_ACCOUNTS_FETCH_FAIL,
  LIST_EDITOR_SUGGESTIONS_CHANGE,
  LIST_EDITOR_SUGGESTIONS_READY,
  LIST_EDITOR_SUGGESTIONS_CLEAR,
  LIST_EDITOR_ADD_REQUEST,
  LIST_EDITOR_ADD_SUCCESS,
  LIST_EDITOR_ADD_FAIL,
  LIST_EDITOR_REMOVE_REQUEST,
  LIST_EDITOR_REMOVE_SUCCESS,
  LIST_EDITOR_REMOVE_FAIL,
  LIST_ADDER_RESET,
  LIST_ADDER_SETUP,
  LIST_ADDER_LISTS_FETCH_REQUEST,
  LIST_ADDER_LISTS_FETCH_SUCCESS,
  LIST_ADDER_LISTS_FETCH_FAIL,
} from '@/action-types/lists.ts';

export const fetchList = (id: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {

  if (!isLoggedIn(getState)) return;

  if (getState().lists.get(String(id))) {
    return;
  }

  dispatch(fetchListRequest(id));

  api(getState).get(`/api/v1/lists/${id}`)
    .then((response) => response.json()).then((data) => dispatch(fetchListSuccess(data)))
    .catch(err => dispatch(fetchListFail(id, err)));
};

const fetchListRequest = (id: string | number) => ({
  type: LIST_FETCH_REQUEST,
  id,
});

const fetchListSuccess = (list: APIEntity) => ({
  type: LIST_FETCH_SUCCESS,
  list,
});

const fetchListFail = (id: string | number, error: unknown) => ({
  type: LIST_FETCH_FAIL,
  id,
  error,
});

const fetchLists = () => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(fetchListsRequest());

  api(getState).get('/api/v1/lists')
    .then((response) => response.json()).then((data) => dispatch(fetchListsSuccess(data)))
    .catch(err => dispatch(fetchListsFail(err)));
};

const fetchListsRequest = () => ({
  type: LISTS_FETCH_REQUEST,
});

const fetchListsSuccess = (lists: APIEntity[]) => ({
  type: LISTS_FETCH_SUCCESS,
  lists,
});

const fetchListsFail = (error: unknown) => ({
  type: LISTS_FETCH_FAIL,
  error,
});

const submitListEditor = (shouldReset?: boolean) => (dispatch: AppDispatch, getState: () => RootState) => {
  const listEditor = getState().listEditor;
  const listId = listEditor.listId!;
  const title = listEditor.title.trim();
  const exclusive = listEditor.exclusive;

  if (!title) return;

  if (listId === null) {
    dispatch(createList(title, exclusive, shouldReset));
  } else {
    dispatch(updateList(listId, title, exclusive, shouldReset));
  }
};

const setupListEditor = (listId: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {
  const list = getState().lists.get(String(listId));

  dispatch({
    type: LIST_EDITOR_SETUP,
    listId: String(listId),
    list,
  });

  if (!list) {
    dispatch(fetchList(listId));
  }

  dispatch(fetchListAccounts(listId));
};

const changeListEditorTitle = (value: string) => ({
  type: LIST_EDITOR_TITLE_CHANGE,
  value,
});

const changeListEditorEmoji = (value: string) => ({
  type: LIST_EDITOR_EMOJI_CHANGE,
  value,
});

const changeListEditorExclusive = (value: boolean) => ({
  type: LIST_EDITOR_EXCLUSIVE_CHANGE,
  value,
});

const listParams = (title: string, exclusive: boolean) => ({
  title,
  exclusive,
});

const createList = (title: string, exclusive = false, shouldReset?: boolean) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(createListRequest());

  api(getState).post('/api/v1/lists', listParams(title, exclusive)).then((response) => response.json()).then((data) => {
    dispatch(createListSuccess(data));

    if (shouldReset) {
      dispatch(resetListEditor());
    }
  }).catch(err => dispatch(createListFail(err)));
};

const createListRequest = () => ({
  type: LIST_CREATE_REQUEST,
});

const createListSuccess = (list: APIEntity) => ({
  type: LIST_CREATE_SUCCESS,
  list,
});

const createListFail = (error: unknown) => ({
  type: LIST_CREATE_FAIL,
  error,
});

const updateList = (id: string | number, title: string, exclusive = false, shouldReset?: boolean) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(updateListRequest(id));

  api(getState).put(`/api/v1/lists/${id}`, listParams(title, exclusive)).then((response) => response.json()).then((data) => {
    dispatch(updateListSuccess(data));

    if (shouldReset) {
      dispatch(resetListEditor());
    }
  }).catch(err => dispatch(updateListFail(id, err)));
};

const updateListRequest = (id: string | number) => ({
  type: LIST_UPDATE_REQUEST,
  id,
});

const updateListSuccess = (list: APIEntity) => ({
  type: LIST_UPDATE_SUCCESS,
  list,
});

const updateListFail = (id: string | number, error: unknown) => ({
  type: LIST_UPDATE_FAIL,
  id,
  error,
});

const resetListEditor = () => ({
  type: LIST_EDITOR_RESET,
});

const deleteList = (id: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(deleteListRequest(id));

  api(getState).delete(`/api/v1/lists/${id}`)
    .then(() => dispatch(deleteListSuccess(id)))
    .catch(err => dispatch(deleteListFail(id, err)));
};

const deleteListRequest = (id: string | number) => ({
  type: LIST_DELETE_REQUEST,
  id,
});

const deleteListSuccess = (id: string | number) => ({
  type: LIST_DELETE_SUCCESS,
  id,
});

const deleteListFail = (id: string | number, error: unknown) => ({
  type: LIST_DELETE_FAIL,
  id,
  error,
});

const fetchListAccounts = (listId: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(fetchListAccountsRequest(listId));

  api(getState).get(`/api/v1/lists/${listId}/accounts`, { searchParams: { limit: 0 } }).then((response) => response.json()).then((data) => {
    dispatch(importFetchedAccounts(data));
    dispatch(fetchListAccountsSuccess(listId, data, null));
  }).catch(err => dispatch(fetchListAccountsFail(listId, err)));
};

const fetchListAccountsRequest = (id: string | number) => ({
  type: LIST_ACCOUNTS_FETCH_REQUEST,
  id,
});

const fetchListAccountsSuccess = (id: string | number, accounts: APIEntity[], next: string | null) => ({
  type: LIST_ACCOUNTS_FETCH_SUCCESS,
  id,
  accounts,
  next,
});

const fetchListAccountsFail = (id: string | number, error: unknown) => ({
  type: LIST_ACCOUNTS_FETCH_FAIL,
  id,
  error,
});

const fetchListSuggestions = (q: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  const query = q.trim();

  if (!query) {
    dispatch(clearListSuggestions());
    return;
  }

  const searchParams = {
    q: query,
    resolve: false,
    limit: 4,
    following: true,
  };

  api(getState).get('/api/v1/accounts/search', { searchParams }).then((response) => response.json()).then((data) => {
    dispatch(importFetchedAccounts(data));
    dispatch(fetchListSuggestionsReady(q, data));
  }).catch(error => toast.showAlertForError(error));
};

const fetchListSuggestionsReady = (query: string, accounts: APIEntity[]) => ({
  type: LIST_EDITOR_SUGGESTIONS_READY,
  query,
  accounts,
});

const clearListSuggestions = () => ({
  type: LIST_EDITOR_SUGGESTIONS_CLEAR,
});

const changeListSuggestions = (value: string) => ({
  type: LIST_EDITOR_SUGGESTIONS_CHANGE,
  value,
});

const addToListEditor = (accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(addToList(getState().listEditor.listId!, accountId));
};

const addToList = (listId: string | number, accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(addToListRequest(listId, accountId));

  api(getState).post(`/api/v1/lists/${listId}/accounts`, { account_ids: [accountId] })
    .then(() => dispatch(addToListSuccess(listId, accountId)))
    .catch(err => dispatch(addToListFail(listId, accountId, err)));
};

const addToListRequest = (listId: string | number, accountId: string) => ({
  type: LIST_EDITOR_ADD_REQUEST,
  listId,
  accountId,
});

const addToListSuccess = (listId: string | number, accountId: string) => ({
  type: LIST_EDITOR_ADD_SUCCESS,
  listId,
  accountId,
});

const addToListFail = (listId: string | number, accountId: string, error: APIEntity) => ({
  type: LIST_EDITOR_ADD_FAIL,
  listId,
  accountId,
  error,
});

const removeFromListEditor = (accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(removeFromList(getState().listEditor.listId!, accountId));
};

const removeFromList = (listId: string | number, accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(removeFromListRequest(listId, accountId));

  const data = new FormData();
  data.append('account_ids[]', accountId);

  api(getState).request('DELETE', `/api/v1/lists/${listId}/accounts`, data)
    .then(() => dispatch(removeFromListSuccess(listId, accountId)))
    .catch(err => dispatch(removeFromListFail(listId, accountId, err)));
};

const removeFromListRequest = (listId: string | number, accountId: string) => ({
  type: LIST_EDITOR_REMOVE_REQUEST,
  listId,
  accountId,
});

const removeFromListSuccess = (listId: string | number, accountId: string) => ({
  type: LIST_EDITOR_REMOVE_SUCCESS,
  listId,
  accountId,
});

const removeFromListFail = (listId: string | number, accountId: string, error: unknown) => ({
  type: LIST_EDITOR_REMOVE_FAIL,
  listId,
  accountId,
  error,
});

const resetListAdder = () => ({
  type: LIST_ADDER_RESET,
});

const setupListAdder = (accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch({
    type: LIST_ADDER_SETUP,
    account: selectAccount(getState(), accountId),
  });
  dispatch(fetchLists());
  dispatch(fetchAccountLists(accountId));
};

const fetchAccountLists = (accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (!isLoggedIn(getState)) return;

  dispatch(fetchAccountListsRequest(accountId));

  api(getState).get(`/api/v1/accounts/${accountId}/lists`)
    .then((response) => response.json()).then((data) => dispatch(fetchAccountListsSuccess(accountId, data)))
    .catch(err => dispatch(fetchAccountListsFail(accountId, err)));
};

const fetchAccountListsRequest = (id: string) => ({
  type: LIST_ADDER_LISTS_FETCH_REQUEST,
  id,
});

const fetchAccountListsSuccess = (id: string, lists: APIEntity[]) => ({
  type: LIST_ADDER_LISTS_FETCH_SUCCESS,
  id,
  lists,
});

const fetchAccountListsFail = (id: string, err: unknown) => ({
  type: LIST_ADDER_LISTS_FETCH_FAIL,
  id,
  err,
});

const addToListAdder = (listId: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(addToList(listId, getState().listAdder.accountId!));
};

const removeFromListAdder = (listId: string | number) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch(removeFromList(listId, getState().listAdder.accountId!));
};

export {
  LIST_FETCH_REQUEST,
  LIST_FETCH_SUCCESS,
  LIST_FETCH_FAIL,
  LISTS_FETCH_REQUEST,
  LISTS_FETCH_SUCCESS,
  LISTS_FETCH_FAIL,
  LIST_EDITOR_TITLE_CHANGE,
  LIST_EDITOR_EMOJI_CHANGE,
  LIST_EDITOR_EXCLUSIVE_CHANGE,
  LIST_EDITOR_RESET,
  LIST_EDITOR_SETUP,
  LIST_CREATE_REQUEST,
  LIST_CREATE_SUCCESS,
  LIST_CREATE_FAIL,
  LIST_UPDATE_REQUEST,
  LIST_UPDATE_SUCCESS,
  LIST_UPDATE_FAIL,
  LIST_DELETE_REQUEST,
  LIST_DELETE_SUCCESS,
  LIST_DELETE_FAIL,
  LIST_ACCOUNTS_FETCH_REQUEST,
  LIST_ACCOUNTS_FETCH_SUCCESS,
  LIST_ACCOUNTS_FETCH_FAIL,
  LIST_EDITOR_SUGGESTIONS_CHANGE,
  LIST_EDITOR_SUGGESTIONS_READY,
  LIST_EDITOR_SUGGESTIONS_CLEAR,
  LIST_EDITOR_ADD_REQUEST,
  LIST_EDITOR_ADD_SUCCESS,
  LIST_EDITOR_ADD_FAIL,
  LIST_EDITOR_REMOVE_REQUEST,
  LIST_EDITOR_REMOVE_SUCCESS,
  LIST_EDITOR_REMOVE_FAIL,
  LIST_ADDER_RESET,
  LIST_ADDER_SETUP,
  LIST_ADDER_LISTS_FETCH_REQUEST,
  LIST_ADDER_LISTS_FETCH_SUCCESS,
  LIST_ADDER_LISTS_FETCH_FAIL,
  fetchListRequest,
  fetchListSuccess,
  fetchListFail,
  fetchLists,
  fetchListsRequest,
  fetchListsSuccess,
  fetchListsFail,
  submitListEditor,
  setupListEditor,
  changeListEditorTitle,
  changeListEditorEmoji,
  changeListEditorExclusive,
  createList,
  createListRequest,
  createListSuccess,
  createListFail,
  updateList,
  updateListRequest,
  updateListSuccess,
  updateListFail,
  resetListEditor,
  deleteList,
  deleteListRequest,
  deleteListSuccess,
  deleteListFail,
  fetchListAccounts,
  fetchListAccountsRequest,
  fetchListAccountsSuccess,
  fetchListAccountsFail,
  fetchListSuggestions,
  fetchListSuggestionsReady,
  clearListSuggestions,
  changeListSuggestions,
  addToListEditor,
  addToList,
  addToListRequest,
  addToListSuccess,
  addToListFail,
  removeFromListEditor,
  removeFromList,
  removeFromListRequest,
  removeFromListSuccess,
  removeFromListFail,
  resetListAdder,
  setupListAdder,
  fetchAccountLists,
  fetchAccountListsRequest,
  fetchAccountListsSuccess,
  fetchAccountListsFail,
  addToListAdder,
  removeFromListAdder,
};
