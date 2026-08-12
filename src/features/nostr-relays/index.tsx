/*
 * Unfathomably FE
 * File: index.tsx
 * Purpose: Load, edit, sign, and publish a user's NIP-65 relay preferences.
 * This file intentionally does not retain secret keys or implement relay I/O.
 */

import { useEffect, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import Form from '@/components/ui/form.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useConnectedNostr } from '@/contexts/nostr-context.tsx';
import { useNostrReq } from '@/features/nostr/hooks/useNostrReq.ts';
import { useSigner } from '@/hooks/nostr/useSigner.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import RelayEditor, { RelayData } from './components/relay-editor.tsx';

const messages = defineMessages({
  invalidRelay: { id: 'nostr_relays.invalid', defaultMessage: 'Relay addresses must begin with ws:// or wss://.' },
  saveFailed: { id: 'nostr_relays.save_failed', defaultMessage: 'Relay preferences could not be saved. Please try again.' },
  saved: { id: 'nostr_relays.saved', defaultMessage: 'Relay preferences saved.' },
  title: { id: 'nostr_relays.title', defaultMessage: 'Relays' },
});

const NostrRelays = () => {
  const intl = useIntl();
  const { account } = useOwnAccount();
  const { relay } = useConnectedNostr();
  const { signer } = useSigner();

  const { events } = useNostrReq(
    account?.nostr?.pubkey
      ? [{ kinds: [10002], authors: [String(account.nostr.pubkey)], limit: 1 }]
      : [],
  );

  const [relays, setRelays] = useState<RelayData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const latestEvent = events.reduce((latest, event) => (
      !latest || event.created_at > latest.created_at ? event : latest
    ), events[0]);
    const tags = latestEvent?.tags ?? [];
    const data = tags
      .filter(tag => tag[0] === 'r' && typeof tag[1] === 'string')
      .slice(0, 8)
      .map((tag): RelayData => ({
        url: tag[1],
        marker: tag[2] === 'read' || tag[2] === 'write' ? tag[2] : undefined,
      }));

    if (!latestEvent && relay?.socket.url) {
      data.push({ url: relay.socket.url, marker: undefined });
    }

    setRelays(data);
  }, [events, relay]);

  const handleSubmit = async (): Promise<void> => {
    if (!signer || !relay) return;

    setIsLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const normalizedRelays = new Map<string, RelayData>();

      for (const preference of relays) {
        const url = new URL(preference.url.trim());

        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
          throw new Error('invalid_relay');
        }

        normalizedRelays.set(url.toString(), {
          url: url.toString(),
          marker: preference.marker,
        });
      }

      const preferences = Array.from(normalizedRelays.values()).slice(0, 8);
      const event = await signer.signEvent({
        kind: 10002,
        tags: preferences.map(preference => (
          preference.marker
            ? ['r', preference.url, preference.marker]
            : ['r', preference.url]
        )),
        content: '',
        created_at: Math.floor(Date.now() / 1000),
      });

      await relay.event(event, { signal: AbortSignal.timeout(3000) });

      setRelays(preferences);
      setMessage(intl.formatMessage(messages.saved));
    } catch (e) {
      setError(intl.formatMessage(
        e instanceof Error && e.message === 'invalid_relay'
          ? messages.invalidRelay
          : messages.saveFailed,
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Column label={intl.formatMessage(messages.title)}>
      <Form onSubmit={handleSubmit}>
        <Stack space={4}>
          <Text theme='muted' size='sm'>
            <FormattedMessage
              id='nostr_relays.help'
              defaultMessage='Choose 2 to 4 relays for a healthy network view. This server opens the external connections; your browser stays connected only to this site. Read relays supply profiles, posts, and groups. Write relays receive your public activity. You can add up to 8.'
            />
          </Text>

          <RelayEditor relays={relays} setRelays={setRelays} />

          {error && <Text size='sm' className='text-danger-600'>{error}</Text>}
          {message && <Text theme='muted' size='sm'>{message}</Text>}

          <FormActions>
            <Button to='/settings' theme='tertiary'>
              <FormattedMessage id='common.cancel' defaultMessage='Cancel' />
            </Button>

            <Button theme='primary' type='submit' disabled={isLoading || !signer || !relay}>
              <FormattedMessage id='edit_profile.save' defaultMessage='Save' />
            </Button>
          </FormActions>
        </Stack>
      </Form>
    </Column>
  );
};

export default NostrRelays;

/* end of index.tsx */
