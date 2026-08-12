/*
 * Unfathomably FE
 * File: profile-identity-proofs.tsx
 *
 * Purpose:
 *   Present cryptographically verified linked identities on profiles.
 *
 * Responsibilities:
 *   - render only proofs already accepted by the backend
 *   - keep proof presentation consistent with ordinary profile metadata
 *
 * This file intentionally does not expose signatures or make identity proofs
 * authoritative for account migration, merging, or moderation decisions.
 */

import checkIcon from '@tabler/icons/outline/check.svg';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';

import type { IdentityProof } from '@/schemas/index.ts';

const messages = defineMessages({
  verified: {
    id: 'account.identity_proof.verified',
    defaultMessage: 'Cryptographically verified identity',
  },
  verifiedOn: {
    id: 'account.identity_proof.verified_on',
    defaultMessage: 'Cryptographic identity proof created on {date}',
  },
});

const compactDid = (did: string): string => {
  if (did.length <= 52) return did;

  return `${did.slice(0, 30)}...${did.slice(-16)}`;
};

interface IProfileIdentityProofs {
  identityProofs: IdentityProof[];
}

/** Verified linked identities displayed with ordinary profile metadata. */
const ProfileIdentityProofs: React.FC<IProfileIdentityProofs> = ({ identityProofs }) => {
  const intl = useIntl();

  if (identityProofs.length === 0) return null;

  return (
    <Stack space={1}>
      <Text size='sm' weight='bold'>
        <FormattedMessage id='account.identity_proof.heading' defaultMessage='Verified identities' />
      </Text>

      {identityProofs.map(identityProof => {
        const createdAt = Date.parse(identityProof.proof.created);

        const verificationTitle = Number.isFinite(createdAt)
          ? intl.formatMessage(messages.verifiedOn, {
            date: intl.formatDate(createdAt, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          })
          : intl.formatMessage(messages.verified);

        return (
          <HStack
            key={`${identityProof.subject}:${identityProof.proof.created}`}
            alignItems='center'
            space={2}
          >
            <span
              className='flex-none text-success-500'
              title={verificationTitle}
            >
              <Icon src={checkIcon} />
            </span>

            <Text
              size='sm'
              direction='ltr'
              truncate
              title={identityProof.subject}
            >
              {compactDid(identityProof.subject)}
            </Text>
          </HStack>
        );
      })}
    </Stack>
  );
};

export default ProfileIdentityProofs;

/* end of profile-identity-proofs.tsx */
