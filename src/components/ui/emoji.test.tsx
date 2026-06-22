import { describe, expect, it } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import Emoji from './emoji.tsx';

describe('<Emoji />', () => {
  it('renders a simple emoji glyph', () => {
    render(<Emoji emoji={'\u{1f600}'} />);

    expect(screen.getByText('\u{1f600}')).toBeInTheDocument();
  });

  // https://emojipedia.org/emoji-flag-sequence/
  it('renders a sequence emoji glyph', () => {
    render(<Emoji emoji={'\u{1f1fa}\u{1f1f8}'} />);

    expect(screen.getByText('\u{1f1fa}\u{1f1f8}')).toBeInTheDocument();
  });
});
