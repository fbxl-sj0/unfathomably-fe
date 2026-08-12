/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/atproto-link/index.tsx

  Purpose:

    Let a local user authorize posting to one Bluesky identity.

  Responsibilities:

    * create a managed identity on the site's local PDS
    * show the current non-secret AT Protocol link state
    * authorize an existing account through PAR/PKCE/DPoP OAuth
    * submit a one-time app password for server-side session exchange
    * remove stored authorization on request

  This file intentionally does NOT retain credentials, display session tokens,
  contact a PDS directly, or enable full-network ingestion.
*/

import { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import Form from '@/components/ui/form.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Input from '@/components/ui/input.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';
import toast from '@/toast.tsx';

const messages = defineMessages({
  header: { id: 'atproto_link.header', defaultMessage: 'Bluesky account' },
  identifier: { id: 'atproto_link.identifier', defaultMessage: 'Handle or DID' },
  identifierPlaceholder: { id: 'atproto_link.identifier_placeholder', defaultMessage: 'you.bsky.social' },
  appPassword: { id: 'atproto_link.app_password', defaultMessage: 'Bluesky app password' },
  connect: { id: 'atproto_link.connect', defaultMessage: 'Connect account' },
  authorize: { id: 'atproto_link.authorize', defaultMessage: 'Authorize with Bluesky' },
  oauthStarted: { id: 'atproto_link.oauth_started', defaultMessage: 'Continue authorization on your AT Protocol server.' },
  disconnect: { id: 'atproto_link.disconnect', defaultMessage: 'Disconnect' },
  connected: { id: 'atproto_link.connected', defaultMessage: 'Connected as @{handle}' },
  createManaged: { id: 'atproto_link.create_managed', defaultMessage: 'Create @{handle}' },
  createManagedSuccess: { id: 'atproto_link.create_managed_success', defaultMessage: 'Your AT Protocol identity was created.' },
  generatedPassword: { id: 'atproto_link.generated_password', defaultMessage: 'One-time PDS password' },
  connectedSuccess: { id: 'atproto_link.connected_success', defaultMessage: 'Bluesky account connected.' },
  disconnectedSuccess: { id: 'atproto_link.disconnected_success', defaultMessage: 'Bluesky account disconnected.' },
  error: { id: 'atproto_link.error', defaultMessage: 'The Bluesky account could not be updated.' },
});

interface LinkState {
  connected: boolean;
  did?: string;
  handle?: string;
  pds?: string;
  managed?: boolean;
  auth_method?: 'oauth' | 'password';
  oauth_available?: boolean;
  oauth_scope?: string;
  provisioning_available?: boolean;
  suggested_handle?: string;
  account_password?: string;
  password_shown_once?: boolean;
}

const ATProtoLink = () => {
  const api = useApi();
  const intl = useIntl();
  const [link, setLink] = useState<LinkState>({ connected: false });
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('oauth');

    if (status === 'connected') {
      toast.success(intl.formatMessage(messages.connectedSuccess));
      window.history.replaceState({}, '', '/settings/atproto');
    } else if (status === 'failed') {
      toast.error(intl.formatMessage(messages.error));
      window.history.replaceState({}, '', '/settings/atproto');
    }
  }, [intl]);

  useEffect(() => {
    let active = true;

    api.get('/api/v1/atproto/link')
      .then((response) => response.json() as Promise<LinkState>)
      .then((state) => {
        if (active) setLink(state);
      })
      .finally(() => {
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) toast.error(intl.formatMessage(messages.error));
      });

    return () => {
      active = false;
    };
  }, [api, intl]);

  const connect = useCallback(() => {
    setLoading(true);

    api.post('/api/v1/atproto/link', {
      identifier: identifier.trim(),
      app_password: appPassword,
    })
      .then((response) => response.json() as Promise<LinkState>)
      .then((state) => {
        setLink(state);
        setAppPassword('');
        toast.success(intl.formatMessage(messages.connectedSuccess));
      })
      .finally(() => setLoading(false))
      .catch(() => toast.error(intl.formatMessage(messages.error)));
  }, [api, appPassword, identifier, intl]);

  const startOAuth = useCallback(() => {
    setLoading(true);

    api.post('/api/v1/atproto/oauth/start', {
      identifier: identifier.trim(),
    })
      .then((response) => response.json() as Promise<{ authorization_url: string }>)
      .then(({ authorization_url }) => {
        toast.success(intl.formatMessage(messages.oauthStarted));
        window.location.assign(authorization_url);
      })
      .finally(() => setLoading(false))
      .catch(() => toast.error(intl.formatMessage(messages.error)));
  }, [api, identifier, intl]);

  const provision = useCallback(() => {
    setLoading(true);

    api.post('/api/v1/atproto/provision', {})
      .then((response) => response.json() as Promise<LinkState>)
      .then((state) => {
        setLink(state);
        toast.success(intl.formatMessage(messages.createManagedSuccess));
      })
      .finally(() => setLoading(false))
      .catch(() => toast.error(intl.formatMessage(messages.error)));
  }, [api, intl]);

  const disconnect = useCallback(() => {
    setLoading(true);

    api.delete('/api/v1/atproto/link')
      .then((response) => response.json() as Promise<LinkState>)
      .then((state) => {
        setLink(state);
        setIdentifier('');
        setAppPassword('');
        toast.success(intl.formatMessage(messages.disconnectedSuccess));
      })
      .finally(() => setLoading(false))
      .catch(() => toast.error(intl.formatMessage(messages.error)));
  }, [api, intl]);

  return (
    <Column label={intl.formatMessage(messages.header)} backHref='/settings'>
      {link.connected ? (
        <div className='space-y-4'>
          <Text size='lg' weight='medium'>
            <FormattedMessage {...messages.connected} values={{ handle: link.handle || link.did }} />
          </Text>
          <Text theme='muted'>
            {link.managed ? (
              <FormattedMessage
                id='atproto_link.managed_hint'
                defaultMessage='This identity and its signed repository are hosted by this site. Only your own records are stored; remote posts continue to be fetched selectively.'
              />
            ) : (
              <FormattedMessage
                id='atproto_link.connected_hint'
                defaultMessage='New posts, media, edits, deletes, replies, likes, reposts, and quotes can be published to this identity. Your session tokens and OAuth proof key are encrypted on the server.'
              />
            )}
          </Text>

          {link.managed && link.password_shown_once && link.account_password && (
            <FormGroup labelText={intl.formatMessage(messages.generatedPassword)}>
              <Text theme='muted'>
                <FormattedMessage
                  id='atproto_link.generated_password_hint'
                  defaultMessage='Save this password now if you want to sign in through another AT Protocol app. It will not be shown again.'
                />
              </Text>
              <Input type='text' value={link.account_password} readOnly autoComplete='off' />
            </FormGroup>
          )}

          {!link.managed && (
            <Button theme='danger' disabled={loading} onClick={disconnect}>
              {intl.formatMessage(messages.disconnect)}
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-8'>
          {link.provisioning_available && link.suggested_handle && (
            <div className='space-y-4'>
              <Text size='lg' weight='medium'>
                <FormattedMessage
                  id='atproto_link.local_heading'
                  defaultMessage='Create an identity hosted here'
                />
              </Text>
              <Text theme='muted'>
                <FormattedMessage
                  id='atproto_link.local_hint'
                  defaultMessage='Creates only your signed account repository. This site does not run a relay, AppView, or full-network mirror.'
                />
              </Text>
              <Button
                theme='primary'
                disabled={loading}
                onClick={provision}
              >
                {intl.formatMessage(messages.createManaged, { handle: link.suggested_handle })}
              </Button>
            </div>
          )}

          <Form onSubmit={startOAuth}>
            <Text size='lg' weight='medium'>
              <FormattedMessage
                id='atproto_link.external_heading'
                defaultMessage='Connect an existing Bluesky account'
              />
            </Text>
            <Text theme='muted'>
              <FormattedMessage
                id='atproto_link.oauth_hint'
                defaultMessage='Enter your handle, approve the requested posting and media permissions on your AT Protocol server, and return here. This does not subscribe the site to the Bluesky firehose.'
              />
            </Text>

            <FormGroup labelText={intl.formatMessage(messages.identifier)}>
              <Input
                name='identifier'
                value={identifier}
                placeholder={intl.formatMessage(messages.identifierPlaceholder)}
                autoComplete='username'
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </FormGroup>

            <FormActions>
              <Button
                type='submit'
                theme='primary'
                disabled={loading || identifier.trim() === ''}
              >
                {intl.formatMessage(messages.authorize)}
              </Button>
            </FormActions>

            <details className='mt-6'>
              <summary className='cursor-pointer text-sm font-medium'>
                <FormattedMessage
                  id='atproto_link.app_password_fallback'
                  defaultMessage='Use an app password instead'
                />
              </summary>

              <div className='mt-4 space-y-4'>
                <Text theme='muted'>
                  <FormattedMessage
                    id='atproto_link.app_password_hint'
                    defaultMessage='Compatibility option for servers without OAuth. The app password is exchanged once and is never stored by this site.'
                  />
                </Text>

                <FormGroup labelText={intl.formatMessage(messages.appPassword)}>
                  <Input
                    type='password'
                    name='app_password'
                    value={appPassword}
                    autoComplete='off'
                    onChange={(event) => setAppPassword(event.target.value)}
                  />
                </FormGroup>

                <FormActions>
                  <Button
                    type='button'
                    theme='secondary'
                    disabled={loading || identifier.trim() === '' || appPassword === ''}
                    onClick={connect}
                  >
                    {intl.formatMessage(messages.connect)}
                  </Button>
                </FormActions>
              </div>
            </details>
          </Form>
        </div>
      )}
    </Column>
  );
};

export default ATProtoLink;

/* end of src/features/atproto-link/index.tsx */
