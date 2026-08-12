/*
  Project: Unfathomably FE
  File: api/rebased/interop.test.ts

  Purpose:
    Lock down the HTTP contracts used for Pleroma and Rebased extensions.

  Responsibilities:
    Verify request methods, paths, query parameters, and JSON payloads.

  This file intentionally does NOT contain:
    Component behavior or feature detection tests.
*/

import { describe, expect, it, vi } from 'vitest';

import { MastodonClient } from '@/api/MastodonClient.ts';

import {
  bookmarkStatus,
  createBookmarkFolder,
  createList,
  deleteBookmarkFolder,
  getBookmarks,
  getGroupedNotificationUnreadCount,
  getGroupedNotifications,
  listBookmarkFolders,
  pinChat,
  unpinChat,
  updateBookmarkFolder,
  updateList,
} from './interop.ts';

interface RecordedRequest {
  body: string;
  method: string;
  url: string;
}

function createRecordingClient() {
  const requests: RecordedRequest[] = [];

  const fetch = vi.fn(async (request: Request) => {
    requests.push({
      body: await request.clone().text(),
      method: request.method,
      url: request.url,
    });

    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  return {
    api: new MastodonClient('https://rebased.test', 'token', fetch as typeof globalThis.fetch),
    requests,
  };
}

describe('Rebased interop API contract', () => {
  it('creates and updates lists with extension fields intact', async () => {
    const { api, requests } = createRecordingClient();

    await createList(api, { title: 'Quiet list', exclusive: true, emoji: 'quiet' });
    await updateList(api, 'list-1', { title: 'Louder list', exclusive: false, emoji: null });

    expect(requests).toEqual([
      {
        method: 'POST',
        url: 'https://rebased.test/api/v1/lists',
        body: JSON.stringify({ title: 'Quiet list', exclusive: true, emoji: 'quiet' }),
      },
      {
        method: 'PUT',
        url: 'https://rebased.test/api/v1/lists/list-1',
        body: JSON.stringify({ title: 'Louder list', exclusive: false, emoji: null }),
      },
    ]);
  });

  it('uses the Rebased bookmark folder endpoints', async () => {
    const { api, requests } = createRecordingClient();

    await listBookmarkFolders(api);
    await createBookmarkFolder(api, { name: 'Read later', emoji: '📁' });
    await updateBookmarkFolder(api, 'folder-1', { name: 'Now', emoji: null });
    await deleteBookmarkFolder(api, 'folder-1');

    expect(requests).toEqual([
      {
        method: 'GET',
        url: 'https://rebased.test/api/v1/pleroma/bookmark_folders',
        body: '',
      },
      {
        method: 'POST',
        url: 'https://rebased.test/api/v1/pleroma/bookmark_folders',
        body: JSON.stringify({ name: 'Read later', emoji: '📁' }),
      },
      {
        method: 'PATCH',
        url: 'https://rebased.test/api/v1/pleroma/bookmark_folders/folder-1',
        body: JSON.stringify({ name: 'Now', emoji: null }),
      },
      {
        method: 'DELETE',
        url: 'https://rebased.test/api/v1/pleroma/bookmark_folders/folder-1',
        body: '',
      },
    ]);
  });

  it('uses folder-aware bookmark requests', async () => {
    const { api, requests } = createRecordingClient();

    await bookmarkStatus(api, 'status-1', 'folder-1');
    await getBookmarks(api, 'folder-1');

    expect(requests).toEqual([
      {
        method: 'POST',
        url: 'https://rebased.test/api/v1/statuses/status-1/bookmark',
        body: JSON.stringify({ folder_id: 'folder-1' }),
      },
      {
        method: 'GET',
        url: 'https://rebased.test/api/v1/bookmarks?folder_id=folder-1',
        body: '',
      },
    ]);
  });

  it('uses the grouped notifications API paths', async () => {
    const { api, requests } = createRecordingClient();

    await getGroupedNotifications(api, { grouped_types: ['favourite', 'reblog'], limit: 20 });
    await getGroupedNotificationUnreadCount(api);

    expect(requests).toEqual([
      {
        method: 'GET',
        url: 'https://rebased.test/api/v2/notifications?grouped_types%5B%5D=favourite&grouped_types%5B%5D=reblog&limit=20',
        body: '',
      },
      {
        method: 'GET',
        url: 'https://rebased.test/api/v2/notifications/unread_count',
        body: '',
      },
    ]);
  });

  it('uses the advertised Pleroma chat pin endpoints', async () => {
    const { api, requests } = createRecordingClient();

    await pinChat(api, 'chat-1');
    await unpinChat(api, 'chat-1');

    expect(requests).toEqual([
      {
        method: 'POST',
        url: 'https://rebased.test/api/v1/pleroma/chats/chat-1/pin',
        body: '',
      },
      {
        method: 'POST',
        url: 'https://rebased.test/api/v1/pleroma/chats/chat-1/unpin',
        body: '',
      },
    ]);
  });
});

/* end of api/rebased/interop.test.ts */
