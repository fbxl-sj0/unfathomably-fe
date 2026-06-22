import { OrderedSet as ImmutableOrderedSet } from 'immutable';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@/jest/test-helpers.tsx';

import StatusList from './status-list.tsx';

const suggestionsPrefix = '\u672bsuggestions-';
const pendingPrefix = '\u672bpending-';

vi.mock('@/components/scrollable-list.tsx', async () => {
  const React = await import('react');

  const ScrollableList = React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollIntoView: vi.fn(),
    }));

    return (
      <section
        data-testid='scrollable-list'
        data-has-more={String(props.hasMore)}
        data-is-loading={String(props.isLoading)}
        data-show-loading={String(props.showLoading)}
      >
        <button type='button' onClick={() => props.onLoadMore?.()}>
          load older
        </button>

        {props.children}
      </section>
    );
  });

  return {
    default: ScrollableList,
  };
});

vi.mock('@/containers/status-container.tsx', () => ({
  default: ({ id, featured }: { id: string; featured?: boolean }) => (
    <article data-testid='timeline-row' data-kind={featured ? 'featured' : 'status'}>
      {featured ? `featured ${id}` : `status ${id}`}
    </article>
  ),
}));

vi.mock('@/features/feed-suggestions/feed-suggestions.tsx', () => ({
  default: ({ statusId }: { statusId: string }) => (
    <article data-testid='timeline-row' data-kind='suggestions'>
      suggestions {statusId}
    </article>
  ),
}));

vi.mock('@/features/ui/components/pending-status.tsx', () => ({
  default: ({ idempotencyKey }: { idempotencyKey: string }) => (
    <article data-testid='timeline-row' data-kind='pending'>
      pending {idempotencyKey}
    </article>
  ),
}));

vi.mock('@/hooks/useSoapboxConfig.ts', () => ({
  useSoapboxConfig: () => ({
    feedInjection: true,
  }),
}));

describe('<StatusList /> migration behavior', () => {
  it('assembles featured, normal, pending, and suggestion rows in timeline order', () => {
    render(
      <StatusList
        scrollKey='home_timeline'
        statusIds={ImmutableOrderedSet([
          'regular-1',
          `${pendingPrefix}local-1`,
          `${suggestionsPrefix}regular-2`,
          'regular-3',
        ])}
        featuredStatusIds={ImmutableOrderedSet(['pinned-1'])}
        isLoading={false}
        hasMore={false}
        emptyMessage='No posts'
      />,
    );

    expect(screen.getAllByTestId('timeline-row').map(row => row.textContent)).toEqual([
      'featured pinned-1',
      'status regular-1',
      'pending local-1',
      `suggestions ${suggestionsPrefix}regular-2`,
      'status regular-3',
    ]);
  });

  it('loads older statuses using the explicit last status id', () => {
    const handleLoadMore = vi.fn();

    render(
      <StatusList
        scrollKey='home_timeline'
        statusIds={ImmutableOrderedSet(['regular-1', 'regular-2'])}
        lastStatusId='older-page'
        onLoadMore={handleLoadMore}
        isLoading={false}
        hasMore
        emptyMessage='No posts'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'load older' }));
    expect(handleLoadMore).toHaveBeenCalledWith('older-page');
  });

  it('strips suggestion sentinels before asking for the next page', () => {
    const handleLoadMore = vi.fn();

    render(
      <StatusList
        scrollKey='home_timeline'
        statusIds={ImmutableOrderedSet(['regular-1', `${suggestionsPrefix}regular-2`])}
        onLoadMore={handleLoadMore}
        isLoading={false}
        hasMore
        emptyMessage='No posts'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'load older' }));
    expect(handleLoadMore).toHaveBeenCalledWith('regular-2');
  });

  it('shows the partial-feed message without mounting the virtual list', () => {
    render(
      <StatusList
        scrollKey='home_timeline'
        statusIds={ImmutableOrderedSet()}
        isLoading={false}
        isPartial
        hasMore={false}
        emptyMessage='No posts'
      />,
    );

    expect(screen.queryByTestId('scrollable-list')).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});
