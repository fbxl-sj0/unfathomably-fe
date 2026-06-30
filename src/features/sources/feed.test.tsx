/*
  Project: Unfathomably Frontend Test Suite
  File: src/features/sources/feed.test.tsx

  Purpose:
    Prove the followed-sources feed attaches its aggregate websocket stream.

  Responsibilities:
    Render the feed shell and assert the sources aggregate stream hook is mounted.

  This file intentionally does NOT contain:
    Websocket transport tests, backend fanout tests, or timeline reducer tests.
*/

import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSourcesFeedStream } from '@/api/hooks/index.ts';

import SourcesFeed from './feed.tsx';

import type { ReactNode } from 'react';

const dispatchMock = vi.hoisted(() => vi.fn());

vi.mock('@/actions/timelines.ts', () => ({
  expandSourcesTimeline: vi.fn(() => ({ type: 'EXPAND_SOURCES_TIMELINE_FOR_TEST' })),
}));

vi.mock('@/api/hooks/index.ts', () => ({
  useSourcesFeedStream: vi.fn(),
}));

vi.mock('@/components/pull-to-refresh.tsx', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/stack.tsx', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/text.tsx', () => ({
  default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/hooks/useAppDispatch.ts', () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock('@/hooks/useAppSelector.ts', () => ({
  useAppSelector: (selector: (state: { timelines: Map<string, { next?: string }> }) => unknown) =>
    selector({ timelines: new Map() }),
}));

vi.mock('../ui/components/timeline.tsx', () => ({
  default: () => <div data-testid='sources-feed-timeline' />,
}));

vi.mock('./components/tab-bar.tsx', () => ({
  default: () => <div data-testid='sources-tab-bar' />,
  TabItems: { SOURCE_FEED: 'feed' },
}));

const useSourcesFeedStreamMock = vi.mocked(useSourcesFeedStream);

describe('SourcesFeed', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    useSourcesFeedStreamMock.mockClear();
  });

  it('mounts the followed-sources aggregate stream', () => {
    render(
      <IntlProvider locale='en'>
        <SourcesFeed />
      </IntlProvider>,
    );

    expect(useSourcesFeedStreamMock).toHaveBeenCalledTimes(1);
  });
});

/* end of src/features/sources/feed.test.tsx */
