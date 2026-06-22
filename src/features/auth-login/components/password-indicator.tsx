/*
  Project: Unfathomably FE
  File: features/auth-login/components/password-indicator.tsx

  Purpose:
    Show signup password requirements before the user submits the form.

  Responsibilities:
    Validate the visible password rules, render their current state, and report
    the combined validity to the registration form.

  This file intentionally does NOT contain:
    Account creation, password storage, or backend error handling.
*/

import { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import ValidationCheckmark from '@/components/validation-checkmark.tsx';
import Stack from '@/components/ui/stack.tsx';

const MINIMUM_PASSWORD_LENGTH = 8;

const messages = defineMessages({
  lowercase: { id: 'registration.password_requirements.lowercase', defaultMessage: 'One lowercase letter' },
  minimumLength: { id: 'registration.password_requirements.minimum_length', defaultMessage: 'At least {count} characters' },
  uppercase: { id: 'registration.password_requirements.uppercase', defaultMessage: 'One uppercase letter' },
});

interface IPasswordIndicator {
  /** Called whenever the combined password validity changes. */
  onChange: (isValid: boolean) => void;
  /** Current password field value. */
  password: string;
}

/** Displays backend password rules in the registration form. */
const PasswordIndicator: React.FC<IPasswordIndicator> = ({ onChange, password }) => {
  const intl = useIntl();

  const hasMinimumLength = password.length >= MINIMUM_PASSWORD_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasValidPassword = hasMinimumLength && hasUppercase && hasLowercase;

  useEffect(() => {
    onChange(hasValidPassword);
  }, [hasValidPassword, onChange]);

  return (
    <Stack space={1} data-testid='password-indicator'>
      <ValidationCheckmark
        isValid={hasMinimumLength}
        text={intl.formatMessage(messages.minimumLength, { count: MINIMUM_PASSWORD_LENGTH })}
      />

      <ValidationCheckmark
        isValid={hasUppercase}
        text={intl.formatMessage(messages.uppercase)}
      />

      <ValidationCheckmark
        isValid={hasLowercase}
        text={intl.formatMessage(messages.lowercase)}
      />
    </Stack>
  );
};

export default PasswordIndicator;

/* end of features/auth-login/components/password-indicator.tsx */
