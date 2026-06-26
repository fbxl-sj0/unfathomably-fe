/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/sources/source-items-preview.test.tsx

  Purpose:

    Prove remote feed preview failures produce a useful UI state instead of
    looking like an empty feed or escalating into a generic application error.

  Responsibilities:

    * render the friendly unavailable message for failed preview queries
    * keep the test independent from network requests

  This file intentionally does NOT contain:

    * backend API mocks
    * feed follow state
    * native item card layout assertions
*/

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSourceItems } from '@/api/hooks/sources/useSourceItems.ts';

import type { Source } from '@/schemas/source.ts';

import SourceItemsPreview from './source-items-preview.tsx';

const dispatchMock = vi.hoisted(() => vi.fn());
const importFetchedStatusesMock = vi.hoisted(() => vi.fn((statuses) => ({
  statuses,
  type: 'STATUSES_IMPORTED_FOR_TEST',
})));

vi.mock('@/api/hooks/sources/useSourceItems.ts', () => ({
  useSourceItems: vi.fn(),
}));

vi.mock('@/actions/importer/index.ts', () => ({
  importFetchedStatuses: importFetchedStatusesMock,
}));

vi.mock('@/containers/status-container.tsx', () => ({
  default: ({ id }: { id: string }) => <div data-testid='source-status-preview'>status {id}</div>,
}));

vi.mock('@/hooks/useAppDispatch.ts', () => ({
  useAppDispatch: () => dispatchMock,
}));

const useSourceItemsMock = vi.mocked(useSourceItems);

describe('SourceItemsPreview', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    importFetchedStatusesMock.mockClear();
  });

  it('shows a friendly unavailable state when the preview query fails', () => {
    useSourceItemsMock.mockReturnValue({
      data: {
        items: [],
        next: null,
        total_items: null,
      },
      isError: true,
      isFetching: false,
    } as unknown as ReturnType<typeof useSourceItems>);

    render(
      <IntlProvider locale='en'>
        <SourceItemsPreview source={sourceFixture} />
      </IntlProvider>,
    );

    expect(screen.getByText(/native preview is unavailable/i)).toBeInTheDocument();
  });

  it('imports and renders returned statuses with normal status controls available', () => {
    const status = {
      id: 'status-1',
      account: { id: 'account-1' },
    };

    useSourceItemsMock.mockReturnValue({
      data: {
        items: [
          {
            id: 'https://microblog.example.test/posts/1',
            type: 'Note',
            title: 'A source post',
            summary: 'Source post summary',
            url: 'https://microblog.example.test/posts/1',
            media_url: null,
            media_type: null,
            attributed_to: null,
            published: null,
            platform: 'mastodon',
            platform_label: 'Mastodon',
            platform_family: 'microblog',
            platform_confidence: 'software',
            thumbnail_url: null,
            duration: null,
            event_start: null,
            location: null,
            comments_count: null,
            source_kind: 'actor_feed',
            source_kind_label: 'Actor feed',
            capabilities: ['follow', 'preview'],
            render_hint: {
              layout: 'status',
              primary_action: 'reply',
            },
            status,
          },
        ],
        next: null,
        total_items: 1,
      },
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof useSourceItems>);

    render(
      <IntlProvider locale='en'>
        <SourceItemsPreview source={sourceFixture} />
      </IntlProvider>,
    );

    expect(importFetchedStatusesMock).toHaveBeenCalledWith([status]);
    expect(dispatchMock).toHaveBeenCalledWith({
      statuses: [status],
      type: 'STATUSES_IMPORTED_FOR_TEST',
    });
    expect(screen.getByTestId('source-status-preview')).toHaveTextContent('status status-1');
  });
});

const sourceFixture = {
  id: 'source-1',
  source_profile: 'blog_publisher',
} as Source;

/* end of src/features/sources/source-items-preview.test.tsx */
