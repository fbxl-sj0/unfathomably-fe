/*
  Project: Unfathomably FE
  File: features/auth-login/components/password-indicator.test.tsx

  Purpose:
    Verify the signup password requirement indicator.

  Responsibilities:
    Check the visible requirements and the validity callback used by the
    registration form.

  This file intentionally does NOT contain:
    Registration API tests or backend password policy tests.
*/

import { describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/jest/test-helpers.tsx';

import PasswordIndicator from './password-indicator.tsx';

describe('<PasswordIndicator />', () => {
  it('reports invalid and valid passwords', async () => {
    const onChange = vi.fn();
    const { unmount } = render(<PasswordIndicator password='abc' onChange={onChange} />);

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    unmount();
    render(<PasswordIndicator password='Abcdefgh' onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(true);
      expect(screen.getAllByTestId('svg-icon-loader')).toHaveLength(3);
      screen.getAllByTestId('svg-icon-loader').forEach((icon) => {
        expect(icon).toHaveClass('text-success-500');
      });
    });
  });
});

/* end of features/auth-login/components/password-indicator.test.tsx */
