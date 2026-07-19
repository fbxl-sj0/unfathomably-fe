/*
  Project: Unfathomably FE
  File: components/quote-authorization-controls.tsx

  Purpose:
    Present quote approval and revocation controls to the quoted author.

  Responsibilities:
    Explain the current lifecycle state and submit explicit author decisions.

  This file intentionally does NOT contain:
    Relationship policy calculations or optimistic quote-count changes.
*/

import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { updateQuoteAuthorization } from '@/actions/quote-authorizations.ts';
import Button from '@/components/ui/button.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import toast from '@/toast.tsx';

interface IQuoteAuthorizationControls {
  statusId: string;
  state: 'pending' | 'accepted' | 'rejected' | 'revoked';
  manageable?: boolean;
}

const messages = defineMessages({
  approveFailed: {
    id: 'status.quote.approve_failed',
    defaultMessage: 'The quote could not be approved.',
  },
  changeFailed: {
    id: 'status.quote.change_failed',
    defaultMessage: 'The quote authorization could not be changed.',
  },
});

const QuoteAuthorizationControls: React.FC<IQuoteAuthorizationControls> = ({
  statusId,
  state,
  manageable = false,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const [busy, setBusy] = useState(false);

  const decide = async (decision: 'approve' | 'reject') => {
    setBusy(true);

    try {
      await dispatch(updateQuoteAuthorization(statusId, decision));
    } catch {
      toast.error(
        decision === 'approve'
          ? intl.formatMessage(messages.approveFailed)
          : intl.formatMessage(messages.changeFailed),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!manageable && state === 'accepted') return null;

  return (
    <Stack className='rounded-md border border-solid border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800' space={2}>
      <Text size='sm' theme='muted'>
        {state === 'pending' && (
          <FormattedMessage id='status.quote.pending' defaultMessage="This quote is waiting for the quoted author's approval." />
        )}
        {state === 'rejected' && (
          <FormattedMessage id='status.quote.rejected' defaultMessage='The quoted author declined this quote.' />
        )}
        {state === 'revoked' && (
          <FormattedMessage id='status.quote.revoked' defaultMessage='The quoted author revoked this quote authorization.' />
        )}
        {state === 'accepted' && manageable && (
          <FormattedMessage id='status.quote.accepted' defaultMessage='You authorized this quote.' />
        )}
      </Text>

      {manageable && state === 'pending' && (
        <HStack space={2}>
          <Button
            theme='primary'
            text={<FormattedMessage id='status.quote.approve' defaultMessage='Approve quote' />}
            disabled={busy}
            onClick={() => decide('approve')}
          />
          <Button
            theme='secondary'
            text={<FormattedMessage id='status.quote.reject' defaultMessage='Reject quote' />}
            disabled={busy}
            onClick={() => decide('reject')}
          />
        </HStack>
      )}

      {manageable && state === 'accepted' && (
        <Button
          theme='secondary'
          text={<FormattedMessage id='status.quote.revoke' defaultMessage='Revoke quote' />}
          disabled={busy}
          onClick={() => decide('reject')}
        />
      )}
    </Stack>
  );
};

export default QuoteAuthorizationControls;

/* end of components/quote-authorization-controls.tsx */
