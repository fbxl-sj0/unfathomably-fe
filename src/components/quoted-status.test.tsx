import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { render, screen, rootState } from '@/jest/test-helpers.tsx';
import { normalizeStatus, normalizeAccount } from '@/normalizers/index.ts';
import { relationshipSchema } from '@/schemas/index.ts';

import QuotedStatus from './quoted-status.tsx';
import QuotedStatusIndicator from './quoted-status-indicator.tsx';

import type { ReducerStatus } from '@/reducers/statuses.ts';

describe('<QuotedStatus />', () => {
  it('renders content', () => {
    const account = normalizeAccount({
      id: '1',
      acct: 'alex',
      url: 'https://soapbox.test/users/alex',
    });

    const status = normalizeStatus({
      id: '1',
      account,
      content: 'hello world',
      contentHtml: 'hello world',
    }) as ReducerStatus;

    const state = rootState/*.accounts.set('1', account)*/;

    render(<QuotedStatus status={status} />, undefined, state);
    screen.getByText(/hello world/i);
    expect(screen.getByTestId('quoted-status')).toHaveTextContent(/hello world/i);
  });

  it('conceals quotes from blocked accounts until explicitly revealed', () => {
    const account = normalizeAccount({
      id: '1',
      acct: 'alex',
      url: 'https://soapbox.test/users/alex',
    });

    const status = normalizeStatus({
      id: '1',
      account,
      content: 'hello world',
      contentHtml: 'hello world',
    }) as ReducerStatus;

    const relationship = relationshipSchema.parse({ id: account.id, blocking: true });

    render(<QuotedStatus status={status} relationship={relationship} />, undefined, rootState);

    expect(screen.queryByText(/hello world/i)).not.toBeInTheDocument();
    screen.getByText(/you blocked @alex/i);

    fireEvent.click(screen.getByRole('button', { name: /show anyway/i }));

    screen.getByText(/hello world/i);
  });

  it('links nested quotes through the local status route', () => {
    const account = normalizeAccount({
      id: '2',
      acct: 'blair@remote.test',
      url: 'https://remote.test/users/blair',
    });

    const status = normalizeStatus({
      id: '22',
      account,
      content: 'nested quote',
      contentHtml: 'nested quote',
    }) as ReducerStatus;

    const state = {
      ...rootState,
      statuses: rootState.statuses.set(status.id, status),
    };

    render(<QuotedStatusIndicator statusId={status.id} />, undefined, state);

    expect(screen.getByRole('link', { name: /view quoted post by @blair@remote\.test/i }))
      .toHaveAttribute('href', '/@blair@remote.test/posts/22');
  });
});
