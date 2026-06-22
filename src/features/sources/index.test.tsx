/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/sources/index.test.tsx

  Purpose:

    Prove source list rows stay collapsed until the user explicitly opens them.

  Responsibilities:

    * keep source previews unmounted by default
    * expose an accessible expand and collapse control

  This file intentionally does NOT contain:

    * source search list pagination tests
    * backend API mocks
    * native item card layout assertions
*/

import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSources } from '@/api/hooks/index.ts';
import { render, screen } from '@/jest/test-helpers.tsx';

import Sources, { SourceListItem } from './index.tsx';

import type { Source } from '@/schemas/index.ts';

vi.mock('@/api/hooks/index.ts', () => ({
  useFollowSource: vi.fn(() => sourceMutationMock),
  useSources: vi.fn(),
  useUnfollowSource: vi.fn(() => sourceMutationMock),
}));

const useSourcesMock = vi.mocked(useSources);

vi.mock('@/components/ui/avatar.tsx', () => ({
  default: () => <div data-testid='source-avatar' />,
}));

vi.mock('./source-items-preview.tsx', () => ({
  default: () => <div data-testid='source-preview' />,
}));

const sourceMutationMock = {
  invalidate: vi.fn(),
  isSubmitting: false,
  mutate: vi.fn(),
};

beforeEach(() => {
  useSourcesMock.mockReturnValue({
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    invalidate: vi.fn(),
    isLoading: false,
    sources: [],
  } as unknown as ReturnType<typeof useSources>);
});

describe('Sources', () => {
  it('labels the source search field', () => {
    render(
      <IntlProvider locale='en'>
        <Sources />
      </IntlProvider>,
    );

    expect(screen.getByLabelText('Search sources or paste an actor URL')).toBeInTheDocument();
  });
});

describe('SourceListItem', () => {
  it('mounts the preview only after the source is expanded', async () => {
    const user = userEvent.setup();

    render(
      <IntlProvider locale='en'>
        <SourceListItem source={sourceFixture} onChanged={vi.fn()} />
      </IntlProvider>,
    );

    const expandButton = screen.getByRole('button', { name: 'Expand source' });

    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('source-preview')).not.toBeInTheDocument();

    await user.click(expandButton);

    const collapseButton = screen.getByRole('button', { name: 'Collapse source' });

    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('source-preview')).toBeInTheDocument();

    await user.click(collapseButton);

    expect(screen.getByRole('button', { name: 'Expand source' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByTestId('source-preview')).not.toBeInTheDocument();
  });
});

const sourceFixture = {
  acct: 'library@audio.example',
  avatar: '',
  capabilities: ['follow library', 'preview tracks'],
  display_name: 'Funkwhale Library',
  domain: 'audio.example',
  id: 'source-1',
  note: '<p>Audio tracks and podcasts</p>',
  platform_family: 'audio',
  platform_label: 'Funkwhale',
  relationship: {
    following: true,
  },
  source_profile: 'library',
  url: 'https://audio.example/library',
} as Source;

/* end of src/features/sources/index.test.tsx */
