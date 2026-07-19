/*
 * Unfathomably FE
 * ----------------
 *
 * File: invites.tsx
 *
 * Purpose:
 *   Provide administrators with a complete invite-token workflow inside the
 *   maintained Unfathomably dashboard.
 *
 * Responsibilities:
 *   - create bounded and optionally expiring invite links
 *   - copy registration links
 *   - send invitations through the configured mailer
 *   - display and revoke existing invite tokens
 *
 * This file intentionally does not change registration or mailer settings.
 */

import { FormattedDate, FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useState } from 'react';

import { openModal } from '@/actions/modals.ts';
import { HTTPError } from '@/api/HTTPError.ts';
import { useInvites } from '@/api/hooks/admin/useInvites.ts';
import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import Form from '@/components/ui/form.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import toast from '@/toast.tsx';

import type { InviteToken } from '@/api/hooks/admin/useInvites.ts';

const messages = defineMessages({
  heading: { id: 'column.admin.invites', defaultMessage: 'Invites' },
  copied: { id: 'admin.invites.copied', defaultMessage: 'Invite link copied' },
  copyFailed: { id: 'admin.invites.copy_failed', defaultMessage: 'The invite link could not be copied.' },
  created: { id: 'admin.invites.created', defaultMessage: 'Invite created' },
  emailSent: { id: 'admin.invites.email_sent', defaultMessage: 'Invitation email sent' },
  revokeConfirm: { id: 'admin.invites.revoke.confirm', defaultMessage: 'Revoke' },
  revokeHeading: { id: 'admin.invites.revoke.heading', defaultMessage: 'Revoke invite' },
  revokeMessage: { id: 'admin.invites.revoke.message', defaultMessage: 'This registration link will stop working immediately. Revoke it?' },
  revoked: { id: 'admin.invites.revoked', defaultMessage: 'Invite revoked' },
});

const inviteLink = (token: string) => `${window.location.origin}/invite/${encodeURIComponent(token)}`;

const Invites: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const [maxUse, setMaxUse] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [newInvite, setNewInvite] = useState<InviteToken>();

  const {
    data: invites = [],
    isLoading,
    createInvite,
    isCreating,
    revokeInvite,
    isRevoking,
    sendEmailInvite,
    isSendingEmail,
  } = useInvites();

  const showError = (error: Error) => toast.showAlertForError(error as HTTPError);

  const handleCreate = () => {
    createInvite({
      max_use: Math.max(1, maxUse),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    }, {
      onSuccess: (invite) => {
        setNewInvite(invite);
        toast.success(messages.created);
      },
      onError: showError,
    });
  };

  const handleEmail = () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) return;

    sendEmailInvite({
      email: trimmedEmail,
      ...(trimmedName ? { name: trimmedName } : {}),
    }, {
      onSuccess: () => {
        setEmail('');
        setName('');
        toast.success(messages.emailSent);
      },
      onError: showError,
    });
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink(token));
      toast.success(messages.copied);
    } catch {
      toast.error(messages.copyFailed);
    }
  };

  const handleRevoke = (token: string) => {
    dispatch(openModal('CONFIRM', {
      heading: intl.formatMessage(messages.revokeHeading),
      message: intl.formatMessage(messages.revokeMessage),
      confirm: intl.formatMessage(messages.revokeConfirm),
      onConfirm: () => revokeInvite(token, {
        onSuccess: () => toast.success(messages.revoked),
        onError: showError,
      }),
    }));
  };

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      <Stack space={6} className='p-4'>
        <section className='rounded-lg bg-gray-100 p-4 dark:bg-primary-800'>
          <Stack space={4}>
            <Stack space={1}>
              <Text size='lg' weight='bold'>
                <FormattedMessage id='admin.invites.create.heading' defaultMessage='Create an invite link' />
              </Text>
              <Text theme='muted' size='sm'>
                <FormattedMessage id='admin.invites.create.hint' defaultMessage='Limit how many accounts can use the link and optionally set an expiry date.' />
              </Text>
            </Stack>

            <Form onSubmit={handleCreate}>
              <HStack space={4} alignItems='bottom' wrap>
                <FormGroup labelText={<FormattedMessage id='admin.invites.max_use' defaultMessage='Maximum uses' />}>
                  <Input
                    min={1}
                    type='number'
                    value={maxUse}
                    onChange={(event) => setMaxUse(Math.max(1, Number(event.target.value) || 1))}
                    required
                  />
                </FormGroup>

                <FormGroup
                  labelText={<FormattedMessage id='admin.invites.expires_at' defaultMessage='Expires on' />}
                  hintText={<FormattedMessage id='admin.invites.expires_at.optional' defaultMessage='Optional' />}
                >
                  <Input type='date' value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
                </FormGroup>

                <Button theme='primary' type='submit' disabled={isCreating}>
                  <FormattedMessage id='admin.invites.create.action' defaultMessage='Create invite' />
                </Button>
              </HStack>
            </Form>

            {newInvite && (
              <Stack space={2} className='rounded-md border border-solid border-primary-300 bg-white p-3 dark:border-primary-700 dark:bg-gray-900'>
                <Text size='sm' weight='medium'>
                  <FormattedMessage id='admin.invites.new_link' defaultMessage='New invite link' />
                </Text>
                <Text size='sm' className='break-all'>{inviteLink(newInvite.token)}</Text>
                <Button className='sm:w-fit' onClick={() => handleCopy(newInvite.token)}>
                  <FormattedMessage id='admin.invites.copy' defaultMessage='Copy link' />
                </Button>
              </Stack>
            )}
          </Stack>
        </section>

        <section className='rounded-lg bg-gray-100 p-4 dark:bg-primary-800'>
          <Stack space={4}>
            <Stack space={1}>
              <Text size='lg' weight='bold'>
                <FormattedMessage id='admin.invites.email.heading' defaultMessage='Invite by email' />
              </Text>
              <Text theme='muted' size='sm'>
                <FormattedMessage id='admin.invites.email.hint' defaultMessage='Requires closed registrations, invitations enabled, and a working mailer.' />
              </Text>
            </Stack>

            <Form onSubmit={handleEmail}>
              <FormGroup labelText={<FormattedMessage id='admin.invites.email' defaultMessage='Email address' />}>
                <Input type='email' value={email} onChange={(event) => setEmail(event.target.value)} required />
              </FormGroup>
              <FormGroup
                labelText={<FormattedMessage id='admin.invites.name' defaultMessage='Name' />}
                hintText={<FormattedMessage id='admin.invites.name.optional' defaultMessage='Optional' />}
              >
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </FormGroup>
              <FormActions>
                <Button theme='primary' type='submit' disabled={isSendingEmail || !email.trim()}>
                  <FormattedMessage id='admin.invites.email.action' defaultMessage='Send invitation' />
                </Button>
              </FormActions>
            </Form>
          </Stack>
        </section>

        <section>
          <Stack space={3}>
            <Text size='lg' weight='bold'>
              <FormattedMessage id='admin.invites.existing.heading' defaultMessage='Existing invite links' />
            </Text>

            {isLoading && (
              <Text theme='muted'><FormattedMessage id='admin.invites.loading' defaultMessage='Loading invites...' /></Text>
            )}
            {!isLoading && invites.length === 0 && (
              <Text theme='muted'><FormattedMessage id='admin.invites.empty' defaultMessage='No invite links have been created.' /></Text>
            )}
            {!isLoading && invites.map((invite) => (
              <Stack key={invite.id} space={2} className='rounded-lg border border-solid border-gray-200 p-4 dark:border-gray-800'>
                <Text size='sm' className='break-all'>{inviteLink(invite.token)}</Text>
                <HStack space={4} wrap>
                  <Text size='sm' theme='muted'>
                    <FormattedMessage
                      id='admin.invites.usage'
                      defaultMessage='{uses} of {maximum} uses'
                      values={{ uses: invite.uses, maximum: invite.max_use ?? intl.formatMessage({ id: 'admin.invites.unlimited', defaultMessage: 'unlimited' }) }}
                    />
                  </Text>
                  <Text size='sm' theme='muted'>
                    {invite.expires_at ? (
                      <FormattedMessage
                        id='admin.invites.expiry'
                        defaultMessage='Expires {date}'
                        values={{ date: <FormattedDate value={invite.expires_at} year='numeric' month='short' day='2-digit' /> }}
                      />
                    ) : (
                      <FormattedMessage id='admin.invites.no_expiry' defaultMessage='No expiry' />
                    )}
                  </Text>
                  <Text size='sm' weight='medium'>
                    {invite.used
                      ? <FormattedMessage id='admin.invites.used' defaultMessage='Used' />
                      : <FormattedMessage id='admin.invites.active' defaultMessage='Active' />}
                  </Text>
                </HStack>
                <HStack space={2} justifyContent='end'>
                  <Button onClick={() => handleCopy(invite.token)}>
                    <FormattedMessage id='admin.invites.copy' defaultMessage='Copy link' />
                  </Button>
                  <Button theme='danger' disabled={isRevoking} onClick={() => handleRevoke(invite.token)}>
                    <FormattedMessage id='admin.invites.revoke' defaultMessage='Revoke' />
                  </Button>
                </HStack>
              </Stack>
            ))}
          </Stack>
        </section>

        <FormActions>
          <Button to='/soapbox/admin' theme='tertiary'>
            <FormattedMessage id='admin.invites.back' defaultMessage='Back to dashboard' />
          </Button>
        </FormActions>
      </Stack>
    </Column>
  );
};

export default Invites;

/* end of invites.tsx */
