import type { MastodonClient } from '@/api/MastodonClient.ts';

interface RebasedListParams {
  title: string;
  exclusive?: boolean;
}

interface RebasedBookmarkFolderParams {
  name: string;
  emoji?: string | null;
}

type RebasedGroupedNotificationParams = Record<
  string,
  string | number | boolean | string[] | number[] | boolean[] | null | undefined
> & {
  account_id?: string;
  grouped_types?: string[];
  limit?: number;
  max_id?: string;
  min_id?: string;
  since_id?: string;
  types?: string[];
  exclude_types?: string[];
};

const REBASED_INTEROP_PATHS = {
  bookmarks: '/api/v1/bookmarks',
  bookmarkFolders: '/api/v1/pleroma/bookmark_folders',
  lists: '/api/v1/lists',
  groupedNotifications: '/api/v2/notifications',
  groupedNotificationUnreadCount: '/api/v2/notifications/unread_count',
} as const;

const bookmarkStatusPath = (statusId: string) => `/api/v1/statuses/${statusId}/bookmark`;

const updateBookmarkFolderPath = (folderId: string) =>
  `${REBASED_INTEROP_PATHS.bookmarkFolders}/${folderId}`;

function createList(api: MastodonClient, params: RebasedListParams) {
  return api.post(REBASED_INTEROP_PATHS.lists, params);
}

function getBookmarks(api: MastodonClient, folderId?: string | null) {
  return api.get(
    REBASED_INTEROP_PATHS.bookmarks,
    folderId ? { searchParams: { folder_id: folderId } } : {},
  );
}

function bookmarkStatus(api: MastodonClient, statusId: string, folderId?: string | null) {
  return api.post(
    bookmarkStatusPath(statusId),
    folderId ? { folder_id: folderId } : undefined,
  );
}

function listBookmarkFolders(api: MastodonClient) {
  return api.get(REBASED_INTEROP_PATHS.bookmarkFolders);
}

function createBookmarkFolder(api: MastodonClient, params: RebasedBookmarkFolderParams) {
  return api.post(REBASED_INTEROP_PATHS.bookmarkFolders, params);
}

function updateBookmarkFolder(api: MastodonClient, folderId: string, params: RebasedBookmarkFolderParams) {
  return api.patch(updateBookmarkFolderPath(folderId), params);
}

function deleteBookmarkFolder(api: MastodonClient, folderId: string) {
  return api.delete(updateBookmarkFolderPath(folderId));
}

function getGroupedNotifications(api: MastodonClient, params: RebasedGroupedNotificationParams = {}) {
  return api.get(REBASED_INTEROP_PATHS.groupedNotifications, { searchParams: params });
}

function getGroupedNotificationUnreadCount(api: MastodonClient, params: RebasedGroupedNotificationParams = {}) {
  return api.get(REBASED_INTEROP_PATHS.groupedNotificationUnreadCount, { searchParams: params });
}

export {
  REBASED_INTEROP_PATHS,
  bookmarkStatus,
  createBookmarkFolder,
  createList,
  deleteBookmarkFolder,
  getBookmarks,
  getGroupedNotificationUnreadCount,
  getGroupedNotifications,
  listBookmarkFolders,
  updateBookmarkFolder,
};

export type {
  RebasedBookmarkFolderParams,
  RebasedGroupedNotificationParams,
  RebasedListParams,
};
