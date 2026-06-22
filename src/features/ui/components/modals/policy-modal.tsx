/*
  Project: Unfathomably FE
  File: features/ui/components/modals/policy-modal.tsx

  Purpose:
    Ask the user to acknowledge a backend policy update.

  Responsibilities:
    Render a small consent prompt and call the policy acceptance API when the
    user chooses to continue.

  This file intentionally does NOT contain:
    Backend policy fetching details or site-specific legal copy.
*/

import { FormattedMessage } from 'react-intl';

import Modal from '@/components/ui/modal.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAcceptPolicy, usePendingPolicy } from '@/queries/policies.ts';

interface IPolicyModal {
  onClose: (type: string) => void;
}

/** Modal shown when the backend reports a policy that must be accepted. */
const PolicyModal: React.FC<IPolicyModal> = ({ onClose }) => {
  const { data: pendingPolicy } = usePendingPolicy();
  const acceptPolicy = useAcceptPolicy();

  const policyId = pendingPolicy?.pending_policy_id;

  const handleAccept = () => {
    if (!policyId) {
      return;
    }

    acceptPolicy.mutate(policyId, {
      onSuccess() {
        onClose('POLICY');
      },
    });
  };

  if (!policyId) {
    return null;
  }

  return (
    <Modal
      title={<FormattedMessage id='modals.policy.title' defaultMessage='Policy update' />}
      confirmationAction={handleAccept}
      confirmationDisabled={acceptPolicy.isPending}
      confirmationText={<FormattedMessage id='modals.policy.accept' defaultMessage='Accept and continue' />}
      confirmationFullWidth
      skipFocus
      width='sm'
    >
      <Stack space={3}>
        <Text theme='muted'>
          <FormattedMessage
            id='modals.policy.body'
            defaultMessage='This server requires you to accept its latest policy update before continuing.'
          />
        </Text>

        <Text theme='subtle' size='sm'>
          <FormattedMessage
            id='modals.policy.pending_id'
            defaultMessage='Policy: {policyId}'
            values={{ policyId }}
          />
        </Text>
      </Stack>
    </Modal>
  );
};

export default PolicyModal;

/* end of features/ui/components/modals/policy-modal.tsx */
