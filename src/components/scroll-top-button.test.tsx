import { defineMessages } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, render, screen } from '@/jest/test-helpers.tsx';

import ScrollTopButton from './scroll-top-button.tsx';

const messages = defineMessages({
  queue: { id: 'status_list.queue_label', defaultMessage: 'Click to see {count} new {count, plural, one {post} other {posts}}' },
});

const setDocumentScrollTop = (scrollTop: number) => {
  Object.defineProperty(document, 'scrollingElement', {
    configurable: true,
    value: { scrollTop },
  });
};

afterEach(() => {
  vi.useRealTimers();
  delete (document as any).scrollingElement;
});

describe('<ScrollTopButton />', () => {
  it('stays hidden when there are no queued posts', () => {
    vi.useFakeTimers();
    setDocumentScrollTop(500);

    render(
      <ScrollTopButton
        onClick={() => {}}
        count={0}
        message={messages.queue}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a singular queued-post message after scrolling past the threshold', () => {
    vi.useFakeTimers();
    setDocumentScrollTop(500);

    render(
      <ScrollTopButton
        onClick={() => {}}
        count={1}
        message={messages.queue}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('button')).toHaveTextContent('Click to see 1 new post');
  });

  it('renders a plural queued-post message after scrolling past the threshold', () => {
    vi.useFakeTimers();
    setDocumentScrollTop(500);

    render(
      <ScrollTopButton
        onClick={() => {}}
        count={9999999}
        message={messages.queue}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('button')).toHaveTextContent('Click to see 9999999 new posts');
  });
});
