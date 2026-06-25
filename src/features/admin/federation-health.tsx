/*
  Project: Unfathomably FE
  File: src/features/admin/federation-health.tsx

  Purpose:
    Show admins the current federation queue and remote site health.

  Responsibilities:
    - display remote instance reachability totals
    - display outgoing delivery queue health
    - list the oldest unreachable remote hosts

  This file intentionally does NOT contain:
    - backend query logic
    - instance reachability policy decisions
*/

import refreshIcon from '@tabler/icons/outline/refresh.svg';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { useFederationHealth } from '@/api/hooks/admin/index.ts';
import { dateFormatOptions } from '@/components/relative-timestamp.tsx';
import List, { ListItem } from '@/components/list.tsx';
import Button from '@/components/ui/button.tsx';
import { CardTitle } from '@/components/ui/card.tsx';
import { Column } from '@/components/ui/column.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';

import Indicator from '../developers/components/indicator.tsx';

import type { FederationHealthQueue, FederationHealthRemoteInstance } from '@/schemas/index.ts';

const messages = defineMessages({
  heading: { id: 'column.admin.federation_health', defaultMessage: 'Federation health' },
  refresh: { id: 'admin.federation_health.refresh', defaultMessage: 'Refresh' },
  generatedAt: { id: 'admin.federation_health.generated_at', defaultMessage: 'Updated {date}' },
  never: { id: 'admin.federation_health.never', defaultMessage: 'Never' },
  none: { id: 'admin.federation_health.none', defaultMessage: 'None' },
  remoteSites: { id: 'admin.federation_health.remote_sites', defaultMessage: 'Remote sites' },
  totalInstances: { id: 'admin.federation_health.total_instances', defaultMessage: 'Known sites' },
  reachableInstances: { id: 'admin.federation_health.reachable_instances', defaultMessage: 'Likely reachable' },
  unreachableInstances: { id: 'admin.federation_health.unreachable_instances', defaultMessage: 'Marked unreachable' },
  dormantInstances: { id: 'admin.federation_health.dormant_instances', defaultMessage: 'Dormant sites' },
  outgoingQueue: { id: 'admin.federation_health.outgoing_queue', defaultMessage: 'Outgoing queue' },
  pendingDeliveries: { id: 'admin.federation_health.pending_deliveries', defaultMessage: 'Pending deliveries' },
  blockedDeliveries: { id: 'admin.federation_health.blocked_deliveries', defaultMessage: 'Blocked by unreachable sites' },
  dormantDeliveries: { id: 'admin.federation_health.dormant_deliveries', defaultMessage: 'Blocked by dormant sites' },
  oldestPending: { id: 'admin.federation_health.oldest_pending', defaultMessage: 'Oldest pending delivery' },
  queues: { id: 'admin.federation_health.queues', defaultMessage: 'Queues' },
  queueEmpty: { id: 'admin.federation_health.queue_empty', defaultMessage: 'No jobs are currently recorded.' },
  stateLabel: { id: 'admin.federation_health.state_label', defaultMessage: '{state}: {count}' },
  oldestState: { id: 'admin.federation_health.oldest_state', defaultMessage: 'oldest {date}' },
  unreachableHosts: { id: 'admin.federation_health.unreachable_hosts', defaultMessage: 'Oldest unreachable sites' },
  unreachableEmpty: { id: 'admin.federation_health.unreachable_empty', defaultMessage: 'No unreachable sites are currently recorded.' },
  dormant: { id: 'admin.federation_health.dormant', defaultMessage: 'Dormant' },
  unreachable: { id: 'admin.federation_health.unreachable', defaultMessage: 'Unreachable' },
  unknownSoftware: { id: 'admin.federation_health.unknown_software', defaultMessage: 'Unknown software' },
});

interface IQueueCard {
  queue: FederationHealthQueue;
}

interface IRemoteInstance {
  instance: FederationHealthRemoteInstance;
}

const FederationHealth: React.FC = () => {
  const intl = useIntl();
  const { data, isLoading, isFetching, refetch } = useFederationHealth();

  const formatNumber = (value?: number) => intl.formatNumber(value ?? 0);
  const formatDate = (value?: string | null) => value ? intl.formatDate(value, dateFormatOptions) : intl.formatMessage(messages.never);

  const queueCards = data?.queues ?? [];
  const unreachableInstances = data?.unreachable_instances ?? [];

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      <Stack space={6}>
        <HStack justifyContent='between' alignItems='center' space={4} wrap>
          <Text theme='muted'>
            {data?.generated_at ? intl.formatMessage(messages.generatedAt, { date: formatDate(data.generated_at) }) : null}
          </Text>

          <Button theme='secondary' icon={refreshIcon} onClick={handleRefresh} disabled={isFetching}>
            <FormattedMessage id='admin.federation_health.refresh' defaultMessage='Refresh' />
          </Button>
        </HStack>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <Stack space={2}>
              <CardTitle title={<FormattedMessage id='admin.federation_health.remote_sites' defaultMessage='Remote sites' />} />

              <List>
                <ListItem label={<FormattedMessage id='admin.federation_health.total_instances' defaultMessage='Known sites' />}>
                  <span>{formatNumber(data?.instances.total)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.reachable_instances' defaultMessage='Likely reachable' />}>
                  <span>{formatNumber(data?.instances.reachable)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.unreachable_instances' defaultMessage='Marked unreachable' />}>
                  <span>{formatNumber(data?.instances.unreachable)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.dormant_instances' defaultMessage='Dormant sites' />}>
                  <span>{formatNumber(data?.instances.dormant)}</span>
                </ListItem>
              </List>
            </Stack>

            <Stack space={2}>
              <CardTitle title={<FormattedMessage id='admin.federation_health.outgoing_queue' defaultMessage='Outgoing queue' />} />

              <List>
                <ListItem label={<FormattedMessage id='admin.federation_health.pending_deliveries' defaultMessage='Pending deliveries' />}>
                  <span>{formatNumber(data?.outgoing.pending)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.blocked_deliveries' defaultMessage='Blocked by unreachable sites' />}>
                  <span>{formatNumber(data?.outgoing.blocked_by_unreachable)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.dormant_deliveries' defaultMessage='Blocked by dormant sites' />}>
                  <span>{formatNumber(data?.outgoing.blocked_by_dormant)}</span>
                </ListItem>

                <ListItem label={<FormattedMessage id='admin.federation_health.oldest_pending' defaultMessage='Oldest pending delivery' />}>
                  <span>{data?.outgoing.oldest_pending_scheduled_at ? formatDate(data.outgoing.oldest_pending_scheduled_at) : intl.formatMessage(messages.none)}</span>
                </ListItem>
              </List>
            </Stack>

            <Stack space={2}>
              <CardTitle title={<FormattedMessage id='admin.federation_health.queues' defaultMessage='Queues' />} />

              {queueCards.length > 0 ? (
                <Stack space={3}>
                  {queueCards.map((queue) => (
                    <QueueCard key={queue.name} queue={queue} />
                  ))}
                </Stack>
              ) : (
                <Text theme='muted'>
                  <FormattedMessage id='admin.federation_health.queue_empty' defaultMessage='No jobs are currently recorded.' />
                </Text>
              )}
            </Stack>

            <Stack space={2}>
              <CardTitle title={<FormattedMessage id='admin.federation_health.unreachable_hosts' defaultMessage='Oldest unreachable sites' />} />

              {unreachableInstances.length > 0 ? (
                <Stack space={3}>
                  {unreachableInstances.map((instance) => (
                    <RemoteInstance key={instance.host} instance={instance} />
                  ))}
                </Stack>
              ) : (
                <Text theme='muted'>
                  <FormattedMessage id='admin.federation_health.unreachable_empty' defaultMessage='No unreachable sites are currently recorded.' />
                </Text>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Column>
  );
};

const QueueCard: React.FC<IQueueCard> = ({ queue }) => {
  const intl = useIntl();

  const formatDate = (value?: string | null) => value ? intl.formatDate(value, dateFormatOptions) : undefined;

  return (
    <div className='rounded-lg bg-gray-100 p-4 dark:bg-primary-800'>
      <Stack space={3}>
        <HStack justifyContent='between' alignItems='center' space={4} wrap>
          <Text weight='semibold'>{queue.name}</Text>
          <Text theme='muted'>{intl.formatNumber(queue.total)}</Text>
        </HStack>

        <HStack space={2} wrap>
          {queue.states.map((state) => (
            <HStack key={`${queue.name}-${state.state}`} alignItems='center' space={2} className='rounded bg-white px-2 py-1 dark:bg-primary-900'>
              <Text tag='span' size='sm'>
                {intl.formatMessage(messages.stateLabel, {
                  state: state.state,
                  count: intl.formatNumber(state.count),
                })}
              </Text>

              {state.oldest_scheduled_at ? (
                <Text tag='span' size='xs' theme='muted'>
                  {intl.formatMessage(messages.oldestState, { date: formatDate(state.oldest_scheduled_at) })}
                </Text>
              ) : null}
            </HStack>
          ))}
        </HStack>
      </Stack>
    </div>
  );
};

const RemoteInstance: React.FC<IRemoteInstance> = ({ instance }) => {
  const intl = useIntl();
  const software = [instance.software_name, instance.software_version].filter(Boolean).join(' ');
  const state = instance.dormant ? 'error' : 'pending';
  const stateLabel = instance.dormant ? intl.formatMessage(messages.dormant) : intl.formatMessage(messages.unreachable);
  const checkedAt = instance.unreachable_since ? intl.formatDate(instance.unreachable_since, dateFormatOptions) : intl.formatMessage(messages.never);

  return (
    <div className='rounded-lg bg-gray-100 p-4 dark:bg-primary-800'>
      <Stack space={2}>
        <HStack alignItems='center' justifyContent='between' space={4} wrap>
          <HStack alignItems='center' space={2}>
            <Indicator state={state} />
            <Text weight='semibold'>{instance.host}</Text>
          </HStack>

          <Text theme='muted' size='sm'>{checkedAt}</Text>
        </HStack>

        <HStack alignItems='center' justifyContent='between' space={4} wrap>
          <Text theme='muted' size='sm'>{software || intl.formatMessage(messages.unknownSoftware)}</Text>
          <Text theme={instance.dormant ? 'danger' : 'muted'} size='sm' weight='medium'>{stateLabel}</Text>
        </HStack>
      </Stack>
    </div>
  );
};

export default FederationHealth;

/* end of src/features/admin/federation-health.tsx */
