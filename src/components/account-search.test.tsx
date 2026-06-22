/*
  Project: Unfathomably FE
  File: components/account-search.test.tsx

  Purpose:
    Verify that the shared account search control remains accessible.

  Responsibilities:
    Ensure the hidden label is associated with the autosuggest input.

  This file intentionally does NOT contain:
    Account search API tests.
*/

import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import AccountSearch from './account-search.tsx';

describe('<AccountSearch />', () => {
  it('associates its label with the autosuggest input', () => {
    render(<AccountSearch onSelected={vi.fn()} />);

    expect(screen.getByLabelText('Search for an account')).toHaveAttribute('data-testid', 'autosuggest-input');
  });
});

/* end of components/account-search.test.tsx */
