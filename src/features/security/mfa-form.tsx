import { useCallback, useEffect, useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';

import { fetchMfa } from '@/actions/mfa.ts';
import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import securityReducer from '@/reducers/security.ts';
import { injectReducer } from '@/store.ts';

import DisableOtpForm from './mfa/disable-otp-form.tsx';
import EnableOtpForm from './mfa/enable-otp-form.tsx';
import OtpConfirmForm from './mfa/otp-confirm-form.tsx';

injectReducer('security', securityReducer);

/*
Security settings page for user account
Routed to /settings/mfa
Includes following features:
- Set up Multi-factor Auth
*/

const messages = defineMessages({
  heading: { id: 'column.mfa', defaultMessage: 'Multi-Factor Authentication' },
  loadFailed: { id: 'mfa.load_failed', defaultMessage: 'Multi-factor authentication settings could not be loaded.' },
  retry: { id: 'common.retry', defaultMessage: 'Retry' },
});

const MfaForm: React.FC = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [displayOtpForm, setDisplayOtpForm] = useState<boolean>(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const loadMfa = useCallback(() => {
    setLoadState('loading');

    dispatch(fetchMfa())
      .then(() => setLoadState('ready'))
      .catch(() => setLoadState('failed'));
  }, [dispatch]);

  useEffect(() => {
    loadMfa();
  }, [loadMfa]);

  const handleSetupProceedClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setDisplayOtpForm(true);
  };

  const handleSetupConfirmed = (codes: string[]) => {
    setBackupCodes(codes);
    setDisplayOtpForm(false);
    setSetupComplete(true);
  };

  const mfa = useAppSelector((state) => state.security.get('mfa'));

  let content: React.ReactNode;

  if (loadState === 'loading') {
    content = <Spinner />;
  } else if (loadState === 'failed') {
    content = (
      <Stack space={4}>
        <Text theme='muted'>{intl.formatMessage(messages.loadFailed)}</Text>
        <Button theme='primary' text={intl.formatMessage(messages.retry)} onClick={loadMfa} />
      </Stack>
    );
  } else if (setupComplete) {
    content = (
      <EnableOtpForm
        backupCodes={backupCodes}
        displayOtpForm={false}
        setupComplete
        handleSetupProceedClick={handleSetupProceedClick}
      />
    );
  } else if (mfa.getIn(['settings', 'totp'])) {
    content = <DisableOtpForm />;
  } else {
    content = (
      <Stack space={4}>
        <EnableOtpForm
          backupCodes={backupCodes}
          displayOtpForm={displayOtpForm}
          setupComplete={false}
          handleSetupProceedClick={handleSetupProceedClick}
        />
        {displayOtpForm && <OtpConfirmForm onConfirmed={handleSetupConfirmed} />}
      </Stack>
    );
  }

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      {content}
    </Column>
  );
};

export default MfaForm;
