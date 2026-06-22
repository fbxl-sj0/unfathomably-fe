/*
  Project: Unfathomably FE
  File: components/hoc/group-lookup-hoc.test.tsx

  Purpose:
    Verify slug-based group route lookup.

  Responsibilities:
    Ensure resolved group ids are passed to legacy group route components while
    existing id-based group routes continue to render.

  This file intentionally does NOT contain:
    Group API hook tests or group page rendering tests.
*/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import withGroupLookup from './group-lookup-hoc.tsx';

const mocks = vi.hoisted(() => ({
  useGroupLookup: vi.fn(),
}));

vi.mock('@/api/hooks/index.ts', () => ({
  useGroupLookup: mocks.useGroupLookup,
}));

vi.mock('@/features/ui/components/column-loading.tsx', () => ({
  default: () => <div data-testid='group-loading' />,
}));

interface IRouteProps {
  params?: {
    groupId?: string;
    groupSlug?: string;
    tab?: string;
  };
}

const Target: React.FC<IRouteProps> = ({ params }) => (
  <div
    data-testid='target'
    data-group-id={params?.groupId}
    data-group-slug={params?.groupSlug}
    data-tab={params?.tab}
  />
);

const Wrapped = withGroupLookup(Target as React.ExoticComponent<IRouteProps>);

describe('withGroupLookup', () => {
  beforeEach(() => {
    mocks.useGroupLookup.mockReset();
    mocks.useGroupLookup.mockReturnValue({ entity: undefined });
  });

  it('renders id-based routes without waiting for lookup data', () => {
    render(<Wrapped params={{ groupId: 'group-1' }} />);

    expect(screen.getByTestId('target')).toHaveAttribute('data-group-id', 'group-1');
    expect(screen.queryByTestId('group-loading')).not.toBeInTheDocument();
    expect(mocks.useGroupLookup).toHaveBeenCalledWith('');
  });

  it('injects the resolved group id for slug-based routes', () => {
    mocks.useGroupLookup.mockReturnValue({ entity: { id: 'group-2' } });

    render(<Wrapped params={{ groupSlug: 'local-news', tab: 'members' }} />);

    expect(mocks.useGroupLookup).toHaveBeenCalledWith('local-news');
    expect(screen.getByTestId('target')).toHaveAttribute('data-group-id', 'group-2');
    expect(screen.getByTestId('target')).toHaveAttribute('data-group-slug', 'local-news');
    expect(screen.getByTestId('target')).toHaveAttribute('data-tab', 'members');
  });

  it('renders a loading column until slug lookup resolves', () => {
    render(<Wrapped params={{ groupSlug: 'local-news' }} />);

    expect(screen.getByTestId('group-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('target')).not.toBeInTheDocument();
  });
});

/* end of components/hoc/group-lookup-hoc.test.tsx */
