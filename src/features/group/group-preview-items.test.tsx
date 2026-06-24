/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/group/group-preview-items.test.tsx

  Purpose:

    Prove group previews use normal status rendering when the backend returns
    a hydrated status for a remote group item.

  Responsibilities:

    * render the friendly unavailable state for failed group preview queries
    * import returned status payloads into the Redux status store
    * keep the test independent from network requests

  This file intentionally does NOT contain:

    * backend API mocks
    * group follow state
    * native item card layout assertions
*/

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGroupPreview } from '@/api/hooks/groups/useGroupPreview.ts';

import GroupPreviewItems from './group-preview-items.tsx';

const dispatchMock = vi.hoisted(() => vi.fn());
const importFetchedStatusesMock = vi.hoisted(() => vi.fn((statuses) => ({
  statuses,
  type: 'STATUSES_IMPORTED_FOR_TEST',
})));

vi.mock('@/api/hooks/groups/useGroupPreview.ts', () => ({
  useGroupPreview: vi.fn(),
}));

vi.mock('@/actions/importer/index.ts', () => ({
  importFetchedStatuses: importFetchedStatusesMock,
}));

vi.mock('@/containers/status-container.tsx', () => ({
  default: ({ id }: { id: string }) => <div data-testid='group-status-preview'>status {id}</div>,
}));

vi.mock('@/hooks/useAppDispatch.ts', () => ({
  useAppDispatch: () => dispatchMock,
}));

const useGroupPreviewMock = vi.mocked(useGroupPreview);

describe('GroupPreviewItems', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    importFetchedStatusesMock.mockClear();
  });

  it('shows a friendly unavailable state when the preview query fails', () => {
    useGroupPreviewMock.mockReturnValue({
      data: {
        items: [],
        next: null,
        total_items: null,
      },
      isError: true,
      isFetching: false,
    } as unknown as ReturnType<typeof useGroupPreview>);

    render(
      <IntlProvider locale='en'>
        <GroupPreviewItems groupId='group-1' />
      </IntlProvider>,
    );

    expect(screen.getByText(/remote preview is unavailable/i)).toBeInTheDocument();
  });

  it('imports and renders returned statuses with normal status controls available', () => {
    const status = {
      id: 'status-1',
      account: { id: 'account-1' },
      replies_count: 4,
    };

    useGroupPreviewMock.mockReturnValue({
      data: {
        items: [
          {
            id: 'https://video.example.test/watch/1',
            type: 'Video',
            title: 'A group video',
            summary: 'Group video summary',
            url: 'https://video.example.test/watch/1',
            media_url: null,
            media_type: null,
            attributed_to: null,
            published: null,
            platform: 'peertube',
            platform_label: 'PeerTube',
            platform_family: 'video',
            platform_confidence: 'software',
            thumbnail_url: null,
            duration: null,
            event_start: null,
            location: null,
            comments_count: 4,
            source_kind: 'peertube_channel',
            source_kind_label: 'Channel',
            capabilities: ['follow channel', 'watch videos', 'send replies'],
            render_hint: {
              layout: 'media',
              primary_action: 'watch',
            },
            status,
          },
        ],
        next: null,
        total_items: 1,
      },
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof useGroupPreview>);

    render(
      <IntlProvider locale='en'>
        <GroupPreviewItems groupId='group-1' />
      </IntlProvider>,
    );

    expect(importFetchedStatusesMock).toHaveBeenCalledWith([status]);
    expect(dispatchMock).toHaveBeenCalledWith({
      statuses: [status],
      type: 'STATUSES_IMPORTED_FOR_TEST',
    });
    expect(screen.getByTestId('group-status-preview')).toHaveTextContent('status status-1');
  });
});

/* end of src/features/group/group-preview-items.test.tsx */
