import { List as ImmutableList } from 'immutable';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import EmojiSelector from './emoji-selector.tsx';

const allowedEmoji = [
  '\u{1f44d}',
  '\u{2764}\u{fe0f}',
  '\u{1f914}',
  '\u{1f606}',
  '\u{1f62e}',
  '\u{1f621}',
  '\u{1f622}',
  '\u{1f60f}',
  '\u{1f1eb}',
];

vi.mock('@/hooks/useAppDispatch.ts', () => ({
  useAppDispatch: () => vi.fn(),
}));

vi.mock('@/hooks/useFeatures.ts', () => ({
  useFeatures: () => ({ customEmojiReacts: true }),
}));

vi.mock('@/hooks/useFrequentlyUsedEmojis.ts', () => ({
  useFrequentlyUsedEmojis: () => ['joy'],
}));

vi.mock('@/hooks/useSoapboxConfig.ts', () => ({
  useSoapboxConfig: () => ({ allowedEmoji: ImmutableList(allowedEmoji) }),
}));

describe('<EmojiSelector />', () => {
  it('shows the configured reaction list before recent emoji', () => {
    render(
      <EmojiSelector
        referenceElement={null}
        onReact={vi.fn()}
        visible
      />,
    );

    const buttons = screen.getAllByRole('button');
    const reactionButtons = buttons.slice(0, allowedEmoji.length);

    expect(reactionButtons.map(button => button.textContent)).toEqual(allowedEmoji);
    expect(buttons.map(button => button.textContent)).not.toContain('\u{1f602}');
  });
});
