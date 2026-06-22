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
  updateBookmarkFolder,
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
  it('creates exclusive lists with the backend-supported payload', async () => {
    const { api, requests } = createRecordingClient();

    await createList(api, { title: 'Quiet list', exclusive: true });

    expect(requests).toEqual([{
      method: 'POST',
      url: 'https://rebased.test/api/v1/lists',
      body: JSON.stringify({ title: 'Quiet list', exclusive: true }),
    }]);
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
});
