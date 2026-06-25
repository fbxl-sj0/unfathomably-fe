import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@/jest/test-helpers.tsx';

import ScrollableList from './scrollable-list.tsx';

vi.mock('react-virtuoso', async () => {
  const React = await import('react');

  const Virtuoso = React.forwardRef<any, any>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollIntoView: vi.fn(),
      scrollToIndex: vi.fn(),
    }));

    const Header = props.components?.Header;
    const Footer = props.components?.Footer;
    const Item = props.components?.Item ?? 'div';
    const List = props.components?.List ?? 'div';
    const data = props.data ?? [];

    return (
      <div
        data-testid='virtuoso'
        data-initial-index={JSON.stringify(props.initialTopMostItemIndex)}
        data-use-window-scroll={String(props.useWindowScroll)}
      >
        <button type='button' onClick={() => props.endReached?.()}>
          end reached
        </button>

        <button type='button' onClick={() => props.startReached?.()}>
          start reached
        </button>

        <button type='button' onClick={() => props.rangeChanged?.({ startIndex: 1, endIndex: 2 })}>
          range changed
        </button>

        <button type='button' onClick={() => props.isScrolling?.(true)}>
          scrolling
        </button>

        {Header && <Header />}

        <List context={props.context} data-testid='virtuoso-list'>
          {data.map((item: any, index: number) => (
            <Item
              key={index}
              context={props.context}
              data-testid='virtuoso-item'
              data-item-index={index}
            >
              {props.itemContent(index, item)}
            </Item>
          ))}
        </List>

        {Footer && <Footer />}
      </div>
    );
  });

  return {
    Virtuoso,
  };
});

describe('<ScrollableList /> migration behavior', () => {
  it('autoloads the next page when Virtuoso reaches the end', () => {
    const handleLoadMore = vi.fn();
    const handleScroll = vi.fn();
    const handleScrollToTop = vi.fn();

    render(
      <ScrollableList
        scrollKey='migration-autoload'
        hasMore
        onLoadMore={handleLoadMore}
        onScroll={handleScroll}
        onScrollToTop={handleScrollToTop}
      >
        {[
          <div key='one'>first post</div>,
          <div key='two'>second post</div>,
        ]}
      </ScrollableList>,
    );

    expect(screen.getByText('first post')).toBeInTheDocument();
    expect(screen.getByText('second post')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'end reached' }));
    expect(handleLoadMore).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'start reached' }));
    expect(handleScrollToTop).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'scrolling' }));
    expect(handleScroll).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('renders a manual Load more control when autoloadMore is disabled', async () => {
    const user = userEvent.setup();
    const handleLoadMore = vi.fn();

    render(
      <ScrollableList
        scrollKey='migration-manual'
        hasMore
        onLoadMore={handleLoadMore}
      >
        {[<div key='one'>only post</div>]}
      </ScrollableList>,
      undefined,
      {
        settings: {
          autoloadMore: false,
        },
      },
    );

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(handleLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not send empty conditional rows to Virtuoso', () => {
    render(
      <ScrollableList scrollKey='migration-empty-rows'>
        {[
          null,
          false,
          <div key='one'>only measured row</div>,
          undefined,
        ]}
      </ScrollableList>,
    );

    expect(screen.getAllByTestId('virtuoso-item')).toHaveLength(1);
    expect(screen.getByTestId('virtuoso-item')).toHaveStyle({ minHeight: '1px' });
  });

  it('saves and restores the top item for browser back navigation', () => {
    const scrollKey = 'migration-scroll-restore';
    const storageKey = `soapbox:scrollData:${scrollKey}`;

    window.sessionStorage.setItem(storageKey, JSON.stringify({ index: 6, offset: 24 }));

    const { unmount } = render(
      <ScrollableList scrollKey={scrollKey}>
        {[
          <div key='one'>one</div>,
          <div key='two'>two</div>,
          <div key='three'>three</div>,
        ]}
      </ScrollableList>,
    );

    expect(screen.getByTestId('virtuoso')).toHaveAttribute(
      'data-initial-index',
      JSON.stringify({ align: 'start', index: 6, offset: 24 }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'range changed' }));
    unmount();

    expect(JSON.parse(window.sessionStorage.getItem(storageKey)!)).toEqual({ index: 2, offset: 24 });
  });
});
