import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';

import Button from '@/components/ui/button.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';

const messages = defineMessages({
  mfaCancelButton: { id: 'column.mfa_cancel', defaultMessage: 'Cancel' },
  mfaSetupButton: { id: 'column.mfa_setup', defaultMessage: 'Proceed to Setup' },
  mfaSetupDoneButton: { id: 'column.mfa_done', defaultMessage: 'I saved these codes' },
});

interface IEnableOtpForm {
  backupCodes: string[];
  displayOtpForm: boolean;
  setupComplete: boolean;
  handleSetupProceedClick: (event: React.MouseEvent) => void;
}

const EnableOtpForm: React.FC<IEnableOtpForm> = ({ backupCodes, displayOtpForm, setupComplete, handleSetupProceedClick }) => {
  const intl = useIntl();
  const history = useHistory();
  let setupInstructions: React.ReactNode = null;
  let setupActions: React.ReactNode = null;

  if (setupComplete) {
    setupInstructions = (
      <Stack space={4}>
        <Text theme='muted'>
          <FormattedMessage id='mfa.setup_warning' defaultMessage="Write these codes down or save them somewhere secure - otherwise you won't see them again. If you lose access to your 2FA app and recovery codes you'll be locked out of your account." />
        </Text>

        <Stack space={3}>
          <Text weight='medium' align='center'>
            <FormattedMessage id='mfa.setup_recoverycodes' defaultMessage='Recovery codes' />
          </Text>

          <div className='grid grid-cols-2 gap-3 rounded-lg text-center'>
            {backupCodes.map((code) => (
              <Text key={code} theme='muted' size='sm'>
                {code}
              </Text>
            ))}
          </div>
        </Stack>
      </Stack>
    );
    setupActions = (
      <FormActions>
        <Button
          theme='primary'
          text={intl.formatMessage(messages.mfaSetupDoneButton)}
          onClick={() => history.push('../auth/edit')}
        />
      </FormActions>
    );
  } else if (!displayOtpForm) {
    setupInstructions = (
      <Text theme='muted'>
        <FormattedMessage id='mfa.setup_description' defaultMessage='Protect your account with a time-based code from an authenticator app.' />
      </Text>
    );
    setupActions = (
      <FormActions>
        <Button
          theme='tertiary'
          text={intl.formatMessage(messages.mfaCancelButton)}
          onClick={() => history.push('../auth/edit')}
        />

        <Button
          theme='primary'
          text={intl.formatMessage(messages.mfaSetupButton)}
          onClick={handleSetupProceedClick}
        />
      </FormActions>
    );
  }

  return (
    <Stack space={4}>
      {setupInstructions}
      {setupActions}
    </Stack>
  );
};

export default EnableOtpForm;
