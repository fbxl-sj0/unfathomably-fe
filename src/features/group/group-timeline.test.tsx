/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/group/group-timeline.test.tsx

  Purpose:

    Prove remote group timelines expose the native preview path when the local
    timeline store has no cached statuses yet.

  Responsibilities:

    * render the group preview as a normal page section for remote groups
    * avoid showing a contradictory empty group message below that preview

  This file intentionally does NOT contain:

    * backend API mocks
    * ActivityPub parsing tests
    * full virtual timeline behavior
*/

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGroup, useGroupStream } from '@/api/hooks/index.ts';

import GroupTimeline from './group-timeline.tsx';

import type { ReactNode } from 'react';

const dispatchMock = vi.hoisted(() => vi.fn());
const timelineStatusIds = vi.hoisted(() => ({ size: 0 }));
const featuredStatusIds = vi.hoisted(() => ({ size: 0 }));
const makeGetStatusIdsMock = vi.hoisted(() =>
  vi.fn()
    .mockReturnValueOnce(() => timelineStatusIds)
    .mockReturnValueOnce(() => featuredStatusIds),
);

vi.mock('@/actions/compose.ts', () => ({
  groupCompose: vi.fn((composeId, groupId) => ({ composeId, groupId, type: 'GROUP_COMPOSE_FOR_TEST' })),
  setGroupTimelineVisible: vi.fn(),
  uploadCompose: vi.fn(),
}));

vi.mock('@/actions/timelines.ts', () => ({
  expandGroupFeaturedTimeline: vi.fn((groupId) => ({ groupId, type: 'EXPAND_GROUP_FEATURED_FOR_TEST' })),
  expandGroupTimeline: vi.fn((groupId) => ({ groupId, type: 'EXPAND_GROUP_TIMELINE_FOR_TEST' })),
}));

vi.mock('@/api/hooks/index.ts', () => ({
  useGroup: vi.fn(),
  useGroupStream: vi.fn(),
}));

vi.mock('@/features/compose/components/compose-form.tsx', () => ({
  default: () => <div data-testid='compose-form' />,
}));

vi.mock('@/hooks/useAppDispatch.ts', () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock('@/hooks/useAppSelector.ts', () => ({
  useAppSelector: (selector: (state: { compose: Map<string, unknown> }) => unknown) =>
    selector({ compose: new Map() }),
}));

vi.mock('@/hooks/useDraggedFiles.ts', () => ({
  useDraggedFiles: () => ({ isDraggedOver: false, isDragging: false }),
}));

vi.mock('@/hooks/useOwnAccount.ts', () => ({
  useOwnAccount: () => ({ account: undefined }),
}));

vi.mock('@/selectors/index.ts', () => ({
  makeGetStatusIds: makeGetStatusIdsMock,
}));

vi.mock('./group-preview-items.tsx', () => ({
  default: ({ groupId }: { groupId: string }) => (
    <div data-testid='group-preview-items'>preview {groupId}</div>
  ),
}));

vi.mock('../ui/components/timeline.tsx', () => ({
  default: ({ emptyMessage }: { emptyMessage: ReactNode }) => (
    <div data-testid='group-timeline-empty'>{emptyMessage}</div>
  ),
}));

const useGroupMock = vi.mocked(useGroup);
const useGroupStreamMock = vi.mocked(useGroupStream);

describe('GroupTimeline', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    useGroupStreamMock.mockClear();
    useGroupMock.mockReturnValue({
      group: {
        id: 'group-1',
        locked: false,
        relationship: null,
        target_kind: 'group',
      },
    } as unknown as ReturnType<typeof useGroup>);
  });

  it('shows remote preview items when a remote group has no local timeline statuses', () => {
    render(
      <IntlProvider locale='en'>
        <GroupTimeline params={{ groupId: 'group-1' }} />
      </IntlProvider>,
    );

    expect(screen.getByTestId('group-preview-items')).toHaveTextContent('preview group-1');
    expect(screen.queryByText('There are no posts in this group yet.')).not.toBeInTheDocument();
  });
});

/* end of src/features/group/group-timeline.test.tsx */
