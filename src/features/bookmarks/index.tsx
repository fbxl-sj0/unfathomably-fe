/*
  Project: Unfathomably FE
  File: features/bookmarks/index.tsx

  Purpose:
    Render saved statuses and manage Rebased/Pleroma bookmark folders.

  Responsibilities:
    List folders, create/edit/delete folders, filter bookmarks by folder,
    and move bookmarked statuses into a target folder.

  This file intentionally does NOT contain:
    Status card rendering or backend bookmark storage rules.
*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import {
  bookmarkStatus,
  createBookmarkFolder,
  deleteBookmarkFolder,
  listBookmarkFolders,
  updateBookmarkFolder,
} from '@/api/rebased/interop.ts';
import { useBookmarks } from '@/api/hooks/index.ts';
import PureStatusList from '@/components/pure-status-list.tsx';
import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Select from '@/components/ui/select.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { bookmarkFolderSchema, type BookmarkFolder } from '@/schemas/index.ts';

const messages = defineMessages({
  title: { id: 'column.bookmarks', defaultMessage: 'Bookmarks' },
  folderNamePlaceholder: { id: 'bookmarks.folder_name.placeholder', defaultMessage: 'Folder name' },
  folderEmojiPlaceholder: { id: 'bookmarks.folder_emoji.placeholder', defaultMessage: 'Emoji' },
  moveStatusPlaceholder: { id: 'bookmarks.move_status.placeholder', defaultMessage: 'Status id' },
});

const Bookmarks = () => {
  const api = useApi();
  const intl = useIntl();
  const features = useFeatures();

  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderEmoji, setFolderEmoji] = useState('');
  const [moveStatusId, setMoveStatusId] = useState('');
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { bookmarks, isLoading, hasNextPage, fetchNextPage, invalidate } = useBookmarks(selectedFolderId);

  const folderLabel = (folder: BookmarkFolder) => `${folder.emoji ? `${folder.emoji} ` : ''}${folder.name}`;

  const selectedFolder = useMemo(
    () => folders.find(folder => folder.id === selectedFolderId) || null,
    [folders, selectedFolderId],
  );

  const loadFolders = useCallback(async () => {
    if (!features.bookmarkFolders) return;

    try {
      const response = await listBookmarkFolders(api);
      const data = await response.json();
      setFolders(bookmarkFolderSchema.array().parse(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api, features.bookmarkFolders]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    setMoveTargetFolderId(selectedFolderId);
  }, [selectedFolderId]);

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const refresh = () => {
    invalidate?.();
    loadFolders();
  };

  const submitFolder = async () => {
    const name = folderName.trim();

    if (!name) return;

    setIsBusy(true);
    setError(null);

    try {
      const params = {
        name,
        emoji: folderEmoji.trim() || null,
      };

      if (selectedFolder) {
        await updateBookmarkFolder(api, selectedFolder.id, params);
      } else {
        await createBookmarkFolder(api, params);
      }

      setFolderName('');
      setFolderEmoji('');
      setSelectedFolderId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsBusy(false);
    }
  };

  const editFolder = (folder: BookmarkFolder) => {
    setSelectedFolderId(folder.id);
    setFolderName(folder.name);
    setFolderEmoji(folder.emoji || '');
  };

  const removeFolder = async (folder: BookmarkFolder) => {
    setIsBusy(true);
    setError(null);

    try {
      await deleteBookmarkFolder(api, folder.id);

      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null);
      }

      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsBusy(false);
    }
  };

  const moveBookmark = async () => {
    const statusId = moveStatusId.trim();

    if (!statusId) return;

    setIsBusy(true);
    setError(null);

    try {
      await bookmarkStatus(api, statusId, moveTargetFolderId);
      setMoveStatusId('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsBusy(false);
    }
  };

  const folderButton = (folder: BookmarkFolder | null) => {
    const active = (folder?.id || null) === selectedFolderId && folderName === '';

    return (
      <Button
        key={folder?.id || 'all'}
        size='sm'
        theme={active ? 'primary' : 'secondary'}
        onClick={() => {
          setSelectedFolderId(folder?.id || null);
          setFolderName('');
          setFolderEmoji('');
        }}
      >
        {folder ? `${folder.emoji || ''} ${folder.name}`.trim() : <FormattedMessage id='bookmarks.folders.all' defaultMessage='All bookmarks' />}
      </Button>
    );
  };

  return (
    <Column label={intl.formatMessage(messages.title)}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size='2xl' weight='bold' tag='h1'>
            <FormattedMessage id='column.bookmarks' defaultMessage='Bookmarks' />
          </Text>

          <Text theme='muted'>
            <FormattedMessage
              id='bookmarks.subtitle'
              defaultMessage='Keep saved posts tidy with Pleroma/Rebased bookmark folders.'
            />
          </Text>
        </Stack>

        {features.bookmarkFolders && (
          <Stack space={3} className='rounded-lg border border-solid border-gray-200 p-3 dark:border-gray-800'>
            <HStack alignItems='center' space={2} className='flex-wrap'>
              {folderButton(null)}
              {folders.map(folderButton)}
            </HStack>

            <HStack alignItems='center' space={2} className='flex-wrap'>
              <Input
                name='bookmark-folder-name'
                value={folderName}
                onChange={event => setFolderName(event.target.value)}
                placeholder={intl.formatMessage(messages.folderNamePlaceholder)}
              />

              <Input
                name='bookmark-folder-emoji'
                value={folderEmoji}
                onChange={event => setFolderEmoji(event.target.value)}
                placeholder={intl.formatMessage(messages.folderEmojiPlaceholder)}
              />

              <Button disabled={isBusy || !folderName.trim()} onClick={submitFolder}>
                {selectedFolder && folderName ? (
                  <FormattedMessage id='bookmarks.folder.update' defaultMessage='Update folder' />
                ) : (
                  <FormattedMessage id='bookmarks.folder.create' defaultMessage='Create folder' />
                )}
              </Button>
            </HStack>

            {folders.length > 0 && (
              <Stack space={1}>
                {folders.map(folder => (
                  <HStack key={folder.id} alignItems='center' justifyContent='between' space={3}>
                    <Text>{folderLabel(folder)}</Text>

                    <HStack alignItems='center' space={2}>
                      <Button size='sm' theme='tertiary' onClick={() => editFolder(folder)}>
                        <FormattedMessage id='bookmarks.folder.edit' defaultMessage='Edit' />
                      </Button>

                      <Button size='sm' theme='danger' onClick={() => removeFolder(folder)} disabled={isBusy}>
                        <FormattedMessage id='bookmarks.folder.delete' defaultMessage='Delete' />
                      </Button>
                    </HStack>
                  </HStack>
                ))}
              </Stack>
            )}

            <Stack space={2}>
              <Text weight='semibold'>
                <FormattedMessage id='bookmarks.move.heading' defaultMessage='Move a bookmark' />
              </Text>

              <HStack alignItems='center' space={2} className='flex-wrap'>
                <Input
                  name='bookmark-move-status-id'
                  value={moveStatusId}
                  onChange={event => setMoveStatusId(event.target.value)}
                  placeholder={intl.formatMessage(messages.moveStatusPlaceholder)}
                />

                <Select
                  className='rounded-md border border-solid border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900'
                  full={false}
                  name='bookmark-move-target-folder'
                  value={moveTargetFolderId || ''}
                  onChange={event => setMoveTargetFolderId(event.target.value || null)}
                >
                  <option value=''>
                    {intl.formatMessage({ id: 'bookmarks.move.no_folder', defaultMessage: 'No folder' })}
                  </option>

                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folderLabel(folder)}
                    </option>
                  ))}
                </Select>

                <Button disabled={isBusy || !moveStatusId.trim()} onClick={moveBookmark}>
                  <FormattedMessage id='bookmarks.move.submit' defaultMessage='Move' />
                </Button>
              </HStack>
            </Stack>
          </Stack>
        )}

        {error && (
          <Text theme='danger'>
            <FormattedMessage id='bookmarks.error' defaultMessage='Bookmark folders could not be updated: {error}' values={{ error }} />
          </Text>
        )}

        <PureStatusList
          scrollKey={selectedFolderId ? `bookmarked_statuses:${selectedFolderId}` : 'bookmarked_statuses'}
          statuses={bookmarks}
          isLoading={!!isLoading}
          showLoading={!!isLoading && bookmarks.length === 0}
          onLoadMore={handleLoadMore}
          hasMore={!!hasNextPage}
          emptyMessage={<FormattedMessage id='empty_column.bookmarks' defaultMessage="You don't have any bookmarks yet. When you bookmark a post, it will show up here." />}
        />
      </Stack>
    </Column>
  );
};

export default Bookmarks;

/* end of features/bookmarks/index.tsx */
