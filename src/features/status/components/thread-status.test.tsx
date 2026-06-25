import { render, screen } from '@testing-library/react';
import { Map as ImmutableMap, OrderedSet as ImmutableOrderedSet } from 'immutable';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThreadStatus from './thread-status.tsx';

const mockState = vi.hoisted(() => ({
  current: undefined as any,
}));

vi.mock('@/containers/status-container.tsx', () => ({
  default: ({ id }: { id: string }) => <div data-testid='status-container'>{id}</div>,
}));

vi.mock('@/features/placeholder/components/placeholder-status.tsx', () => ({
  default: () => <div data-testid='placeholder-status' />,
}));

vi.mock('@/hooks/useAppSelector.ts', () => ({
  useAppSelector: (selector: (state: any) => unknown) => selector(mockState.current),
}));

describe('ThreadStatus', () => {
  beforeEach(() => {
    mockState.current = buildState();
  });

  it('renders an incoming connector for statuses that reply to another post', () => {
    mockState.current = buildState({
      inReplyTos: ImmutableMap({ child: 'parent' }),
    });

    renderThreadStatus('child');

    expect(screen.getByTestId('thread-connector-top')).toBeInTheDocument();
  });

  it('renders an outgoing connector for statuses with replies', () => {
    mockState.current = buildState({
      replies: ImmutableMap({ parent: ImmutableOrderedSet(['child']) }),
    });

    renderThreadStatus('parent');

    expect(screen.getByTestId('thread-connector-bottom')).toBeInTheDocument();
  });

  it('renders one connector guide for each visible reply depth', () => {
    mockState.current = buildState({
      inReplyTos: ImmutableMap({
        parent: 'focused',
        child: 'parent',
        grandchild: 'child',
      }),
    });

    renderThreadStatus('grandchild');

    expect(screen.getByTestId('thread-connector')).toHaveAttribute('data-thread-depth', '3');
    expect(screen.getAllByTestId('thread-connector-guide')).toHaveLength(3);
    expect(screen.getByTestId('thread-connector-top')).toBeInTheDocument();
  });

  it('stops counting connector depth when reply data loops', () => {
    mockState.current = buildState({
      inReplyTos: ImmutableMap({
        child: 'parent',
        parent: 'child',
      }),
    });

    renderThreadStatus('child');

    expect(screen.getByTestId('thread-connector')).toHaveAttribute('data-thread-depth', '2');
    expect(screen.getAllByTestId('thread-connector-guide')).toHaveLength(2);
  });

  it('omits connector chrome for isolated statuses', () => {
    renderThreadStatus('standalone');

    expect(screen.queryByTestId('thread-connector')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-container')).toHaveTextContent('standalone');
  });
});

function renderThreadStatus(id: string) {
  render(
    <ThreadStatus
      id={id}
      focusedStatusId='focused'
      onMoveUp={() => undefined}
      onMoveDown={() => undefined}
    />,
  );
}

function buildState(overrides: {
  inReplyTos?: ImmutableMap<string, string>;
  replies?: ImmutableMap<string, ImmutableOrderedSet<string>>;
} = {}) {
  const ids = ['parent', 'child', 'grandchild', 'standalone'];

  return {
    contexts: {
      inReplyTos: overrides.inReplyTos ?? ImmutableMap<string, string>(),
      replies: overrides.replies ?? ImmutableMap<string, ImmutableOrderedSet<string>>(),
    },
    statuses: ImmutableMap(ids.map((id) => [id, { id }])),
  };
}

/* end of src/features/status/components/thread-status.test.tsx */
