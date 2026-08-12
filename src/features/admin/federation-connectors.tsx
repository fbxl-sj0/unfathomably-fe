/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/admin/federation-connectors.tsx

  Purpose:

    Let an administrator establish and monitor explicit specialised
    federation connections without turning them into public discovery data.

  Responsibilities:

    * submit one administrator-approved marketplace instance connection
    * present the Follow lifecycle without exposing it to ordinary users
    * remove connector delivery configuration safely

  This file intentionally does NOT contain:

    * peer crawling or peer-directory discovery
    * automatic connection attempts
    * user-facing marketplace search controls
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { HTTPError } from '@/api/HTTPError.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import toast from '@/toast.tsx';

interface MarketplacePeer {
  actor: string;
  connected: boolean;
  enabled: boolean;
  id: string;
  scope: Record<string, unknown>;
  status: 'active' | 'disabled' | 'pending' | 'unavailable';
}

interface MarketplaceConnectorResponse {
  peers: MarketplacePeer[];
  service_actor: string;
}

const messages = defineMessages({
  connected: { id: 'admin.federation_connectors.marketplace.connected', defaultMessage: 'Marketplace connection request sent' },
  disconnected: { id: 'admin.federation_connectors.marketplace.disconnected', defaultMessage: 'Marketplace delivery connection removed' },
  invalidUrl: { id: 'admin.federation_connectors.marketplace.invalid_url', defaultMessage: 'Enter an HTTPS instance URL or its /users/instance actor URL' },
});

const MarketplaceConnectors: React.FC = () => {
  const api = useApi();
  const intl = useIntl();
  const queryClient = useQueryClient();
  const { account } = useOwnAccount();
  const [actor, setActor] = useState('');

  const connectorQuery = useQuery({
    queryKey: ['admin', 'federation-connectors', 'marketplace'],
    queryFn: async (): Promise<MarketplaceConnectorResponse> => {
      const response = await api.get('/api/v1/pleroma/admin/federation_connectors/marketplace');
      return response.json() as Promise<MarketplaceConnectorResponse>;
    },
    enabled: Boolean(account?.admin),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'federation-connectors', 'marketplace'] });

  const connectMutation = useMutation({
    mutationFn: async (actorUrl: string): Promise<MarketplacePeer> => {
      const response = await api.post('/api/v1/pleroma/admin/federation_connectors/marketplace', { actor: actorUrl });
      return response.json() as Promise<MarketplacePeer>;
    },
    onSuccess: () => {
      setActor('');
      refresh();
      toast.success(intl.formatMessage(messages.connected));
    },
    onError: (error) => toast.showAlertForError(error as HTTPError),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/v1/pleroma/admin/federation_connectors/marketplace/${id}`);
    },
    onSuccess: () => {
      refresh();
      toast.success(intl.formatMessage(messages.disconnected));
    },
    onError: (error) => toast.showAlertForError(error as HTTPError),
  });

  const submit = (event: React.FormEvent<Element>) => {
    event.preventDefault();

    const actorUrl = actor.trim();

    try {
      const url = new URL(actorUrl);

      if (url.protocol !== 'https:') throw new TypeError('Unsupported connector protocol');
    } catch {
      toast.error(intl.formatMessage(messages.invalidUrl));
      return;
    }

    connectMutation.mutate(actorUrl);
  };

  if (!account?.admin) return null;

  return (
    <Stack space={5} className='p-4 sm:p-6'>
      <Stack space={1}>
        <Text size='xl' weight='bold'><FormattedMessage id='admin.federation_connectors.heading' defaultMessage='Specialised federation' /></Text>
        <Text size='sm' theme='muted'>
          <FormattedMessage id='admin.federation_connectors.summary' defaultMessage='Connect services whose federation model is instance-to-instance rather than a normal account follow.' />
        </Text>
      </Stack>

      <Stack space={3} className='rounded-xl border border-solid border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-900/20 black:border-primary-800 black:bg-primary-900/20'>
        <Text weight='semibold'><FormattedMessage id='admin.federation_connectors.marketplace.heading' defaultMessage='Marketplace replication' /></Text>
        <Text size='sm' theme='muted'>
          <FormattedMessage id='admin.federation_connectors.marketplace.explanation' defaultMessage='This sends one Follow request from the dedicated instance actor. Only fresh, public marketplace offers are delivered after the remote operator accepts. No peers are crawled and no listing history is backfilled.' />
        </Text>
        <Text size='sm' theme='muted'>
          <FormattedMessage id='admin.federation_connectors.marketplace.actor' defaultMessage='Local service actor: {actor}' values={{ actor: connectorQuery.data?.service_actor || 'https://.../users/instance' }} />
        </Text>
      </Stack>

      <Form onSubmit={submit}>
        <FormGroup
          labelText={<FormattedMessage id='admin.federation_connectors.marketplace.url' defaultMessage='Flohmarkt instance or actor URL' />}
          hintText={<FormattedMessage id='admin.federation_connectors.marketplace.url_hint' defaultMessage="Use an HTTPS instance URL or its canonical /users/instance actor URL. Obtain the operator's agreement before connecting." />}
        >
          <Input
            type='url'
            value={actor}
            placeholder='https://market.example'
            disabled={connectMutation.isPending}
            required
            onChange={(event) => setActor(event.target.value)}
          />
        </FormGroup>
        <FormActions>
          <Button type='submit' theme='primary' disabled={connectMutation.isPending || !actor.trim()}>
            <FormattedMessage id='admin.federation_connectors.marketplace.connect' defaultMessage='Request connection' />
          </Button>
        </FormActions>
      </Form>

      <Stack space={3}>
        <Text weight='semibold'><FormattedMessage id='admin.federation_connectors.marketplace.connections' defaultMessage='Configured marketplaces' /></Text>
        {connectorQuery.isFetching ? <Text size='sm' theme='muted'><FormattedMessage id='admin.federation_connectors.loading' defaultMessage='Loading connections...' /></Text> : null}
        {!connectorQuery.isFetching && connectorQuery.data?.peers.length === 0 ? (
          <Text size='sm' theme='muted'><FormattedMessage id='admin.federation_connectors.marketplace.empty' defaultMessage='No marketplace instance has been configured.' /></Text>
        ) : null}
        {connectorQuery.data?.peers.map((peer) => (
          <div key={peer.id} className='rounded-lg border border-solid border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-primary-900 black:border-primary-800 black:bg-primary-900/20'>
            <Stack space={2}>
              <Text size='sm' weight='medium' className='break-all'>{peer.actor}</Text>
              <Text size='sm' theme='muted'><ConnectionStatus status={peer.status} /></Text>
              <HStack justifyContent='end' space={2}>
                <Button type='button' theme='secondary' disabled={disconnectMutation.isPending} onClick={() => disconnectMutation.mutate(peer.id)}>
                  <FormattedMessage id='admin.federation_connectors.marketplace.remove' defaultMessage='Disconnect marketplace' />
                </Button>
              </HStack>
            </Stack>
          </div>
        ))}
      </Stack>
    </Stack>
  );
};

const ConnectionStatus: React.FC<{ status: MarketplacePeer['status'] }> = ({ status }) => {
  switch (status) {
    case 'active':
      return <FormattedMessage id='admin.federation_connectors.marketplace.status.active' defaultMessage='Active: new eligible offers can be delivered.' />;
    case 'pending':
      return <FormattedMessage id='admin.federation_connectors.marketplace.status.pending' defaultMessage='Awaiting remote acceptance: no offers are delivered yet.' />;
    case 'disabled':
      return <FormattedMessage id='admin.federation_connectors.marketplace.status.disabled' defaultMessage='Disabled: delivery is turned off.' />;
    default:
      return <FormattedMessage id='admin.federation_connectors.marketplace.status.unavailable' defaultMessage='Unavailable: reconnect only after checking with the remote operator.' />;
  }
};

export default MarketplaceConnectors;

/* end of src/features/admin/federation-connectors.tsx */
