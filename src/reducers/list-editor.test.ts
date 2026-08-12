/*
  Project: Unfathomably FE
  File: reducers/list-editor.test.ts

  Purpose:
    Verify that asynchronously fetched list properties reach the editor.

  Responsibilities:
    Protect list emoji and exclusive state restoration after an editor opens
    before its list request has completed.

  This file intentionally does NOT contain:
    API request or form interaction tests.
*/

import { describe, expect, it } from 'vitest';

import { LIST_EDITOR_SETUP, LIST_FETCH_SUCCESS } from '@/action-types/lists.ts';

import listEditorReducer from './list-editor.ts';

describe('listEditorReducer', () => {
  it('restores emoji when a list finishes loading', () => {
    const loadingState = listEditorReducer(undefined, {
      type: LIST_EDITOR_SETUP,
      listId: 'list-1',
    });

    const loadedState = listEditorReducer(loadingState, {
      type: LIST_FETCH_SUCCESS,
      list: {
        id: 'list-1',
        title: 'Friends',
        exclusive: true,
        pleroma: { emoji: 'party_blob' },
      },
    });

    expect(loadedState.title).toBe('Friends');
    expect(loadedState.emoji).toBe('party_blob');
    expect(loadedState.exclusive).toBe(true);
  });

  it('clears stale emoji when the loaded list has none', () => {
    const loadingState = listEditorReducer(undefined, {
      type: LIST_EDITOR_SETUP,
      listId: 'list-1',
      list: {
        get: (key: string) => key === 'title' ? 'Old title' : undefined,
        getIn: () => 'old_emoji',
      },
    });

    const loadedState = listEditorReducer(loadingState, {
      type: LIST_FETCH_SUCCESS,
      list: {
        id: 'list-1',
        title: 'Current title',
        exclusive: false,
      },
    });

    expect(loadedState.emoji).toBe('');
  });
});

/* end of reducers/list-editor.test.ts */
