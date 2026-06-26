/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/sources/index.test.tsx

  Purpose:

    Prove feed list rows stay collapsed until the user explicitly opens them.

  Responsibilities:

    * keep feed previews unmounted by default
    * expose an accessible expand and collapse control

  This file intentionally does NOT contain:

    * feed search list pagination tests
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

vi.mock('@/components/scrollable-list.tsx', () => ({
  default: (props: { children?: React.ReactNode }) => (
    <div data-testid='sources-list'>
      {props.children}
    </div>
  ),
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
  window.localStorage.clear();
  sourceMutationMock.invalidate.mockClear();
  sourceMutationMock.mutate.mockClear();

  useSourcesMock.mockReturnValue({
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    invalidate: vi.fn(),
    isLoading: false,
    sources: [],
  } as unknown as ReturnType<typeof useSources>);
});

describe('Sources', () => {
  it('labels the feed search field', () => {
    render(
      <IntlProvider locale='en'>
        <Sources />
      </IntlProvider>,
    );

    expect(screen.getByLabelText('Search feeds or paste a feed/actor URL')).toBeInTheDocument();
  });

  it('filters visible feed rows by type and automated actor status', async () => {
    const user = userEvent.setup();

    useSourcesMock.mockReturnValue({
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      invalidate: vi.fn(),
      isLoading: false,
      sources: [
        rssSourceFixture,
        applicationSourceFixture,
        librarySourceFixture,
      ],
    } as unknown as ReturnType<typeof useSources>);

    render(
      <IntlProvider locale='en'>
        <Sources />
      </IntlProvider>,
    );

    expect(screen.getByText('Zero Hedge RSS')).toBeInTheDocument();
    expect(screen.getByText('Build Bot')).toBeInTheDocument();
    expect(screen.getByText('Funkwhale Library')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /RSS/ }));

    expect(screen.getByText('Zero Hedge RSS')).toBeInTheDocument();
    expect(screen.queryByText('Build Bot')).not.toBeInTheDocument();
    expect(screen.queryByText('Funkwhale Library')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /All/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Hide bots and services' }));

    expect(screen.getByText('Zero Hedge RSS')).toBeInTheDocument();
    expect(screen.queryByText('Build Bot')).not.toBeInTheDocument();
    expect(screen.getByText('Funkwhale Library')).toBeInTheDocument();
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

    const expandButton = screen.getByRole('button', { name: 'Expand feed' });

    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('source-preview')).not.toBeInTheDocument();

    await user.click(expandButton);

    const collapseButton = screen.getByRole('button', { name: 'Collapse feed' });

    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('source-preview')).toBeInTheDocument();

    await user.click(collapseButton);

    expect(screen.getByRole('button', { name: 'Expand feed' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByTestId('source-preview')).not.toBeInTheDocument();
  });
});

const sourceFixture = {
  actor_type: 'Person',
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

const rssSourceFixture = {
  ...sourceFixture,
  acct: 'zerohedge@example.com',
  display_name: 'Zero Hedge RSS',
  id: 'source-rss',
  source_profile: 'rss_feed',
  url: 'https://cms.zerohedge.com/fullrss2.xml',
} as Source;

const applicationSourceFixture = {
  ...sourceFixture,
  actor_type: 'Service',
  acct: 'buildbot@example.com',
  display_name: 'Build Bot',
  id: 'source-application',
  source_profile: 'application_source',
  url: 'https://example.com/buildbot',
} as Source;

const librarySourceFixture = {
  ...sourceFixture,
  id: 'source-library',
} as Source;

/* end of src/features/sources/index.test.tsx */
