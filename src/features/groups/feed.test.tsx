/*
  Project: Unfathomably Frontend Test Suite
  File: src/features/groups/feed.test.tsx

  Purpose:
    Prove the followed-groups feed attaches its aggregate websocket stream.

  Responsibilities:
    Render the feed shell and assert the groups aggregate stream hook is mounted.

  This file intentionally does NOT contain:
    Websocket transport tests, backend fanout tests, or timeline reducer tests.
*/

import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGroupsFeedStream } from '@/api/hooks/index.ts';

import GroupsFeed from './feed.tsx';

import type { ReactNode } from 'react';

const dispatchMock = vi.hoisted(() => vi.fn());

vi.mock('@/actions/timelines.ts', () => ({
  expandGroupsTimeline: vi.fn(() => ({ type: 'EXPAND_GROUPS_TIMELINE_FOR_TEST' })),
}));

vi.mock('@/api/hooks/index.ts', () => ({
  useGroupsFeedStream: vi.fn(),
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
  default: () => <div data-testid='groups-feed-timeline' />,
}));

vi.mock('./components/tab-bar.tsx', () => ({
  default: () => <div data-testid='groups-tab-bar' />,
  TabItems: { GROUP_FEED: 'feed' },
}));

const useGroupsFeedStreamMock = vi.mocked(useGroupsFeedStream);

describe('GroupsFeed', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    useGroupsFeedStreamMock.mockClear();
  });

  it('mounts the followed-groups aggregate stream', () => {
    render(
      <IntlProvider locale='en'>
        <GroupsFeed />
      </IntlProvider>,
    );

    expect(useGroupsFeedStreamMock).toHaveBeenCalledTimes(1);
  });
});

/* end of src/features/groups/feed.test.tsx */
