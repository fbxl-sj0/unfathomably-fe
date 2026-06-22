/*
  Project: Unfathomably FE
  File: features/auth-login/components/registration-form.test.tsx

  Purpose:
    Verify registration form behavior around backend-specific password rules.

  Responsibilities:
    Ensure Truth-style password requirements gate submission while ordinary
    backends keep the existing signup form behavior.

  This file intentionally does NOT contain:
    Registration API tests or captcha rendering tests.
*/

import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@/jest/test-helpers.tsx';
import { buildInstance } from '@/jest/factory.ts';

import RegistrationForm from './registration-form.tsx';

const expectNoDuplicateFormFieldIds = (container: HTMLElement) => {
  const forms = Array.from(container.querySelectorAll('form'));

  forms.forEach((form) => {
    const ids = Array.from(form.querySelectorAll('input[id], select[id], textarea[id]'))
      .map((field) => field.getAttribute('id'))
      .filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates).toEqual([]);
  });
};

vi.mock('@/features/auth-login/components/captcha.tsx', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const { Map: ImmutableMap } = await vi.importActual<typeof import('immutable')>('immutable');
  type CaptchaMap = { get: (key: string) => unknown };

  return {
    default: function CaptchaMock({ onFetch }: { onFetch?: (captcha: CaptchaMap) => void }) {
      const onFetchRef = React.useRef(onFetch);
      onFetchRef.current = onFetch;

      React.useEffect(() => {
        onFetchRef.current?.(ImmutableMap({ type: 'none' }));
      }, []);

      return null;
    },
  };
});

describe('<RegistrationForm />', () => {
  it('requires valid password rules for TruthSocial signup', async () => {
    const store = {
      instance: buildInstance({
        registrations: { enabled: true },
        version: '3.4.1 (compatible; TruthSocial 1.0.0)',
      }),
    };

    render(<RegistrationForm />, undefined, store);

    const signUpButton = screen.getByRole('button', { name: 'Sign up' });

    expect(screen.getByTestId('password-indicator')).toBeInTheDocument();
    expect(signUpButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: {
        name: 'password',
        value: 'Abcdefgh',
      },
    });

    await waitFor(() => {
      expect(signUpButton).not.toBeDisabled();
    });
  });

  it('keeps the default signup button behavior for Pleroma', async () => {
    const store = {
      instance: buildInstance({
        registrations: { enabled: true },
        version: '2.7.2 (compatible; Pleroma 2.4.50)',
      }),
    };

    render(<RegistrationForm />, undefined, store);

    expect(screen.queryByTestId('password-indicator')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).not.toBeDisabled();
    });
  });

  it('labels signup fields and avoids duplicate form field ids', async () => {
    const { container } = render(<RegistrationForm />);

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password (again)')).toBeInTheDocument();

    expectNoDuplicateFormFieldIds(container);
  });
});

/* end of features/auth-login/components/registration-form.test.tsx */
