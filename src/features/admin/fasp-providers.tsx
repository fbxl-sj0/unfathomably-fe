/*
  Project: Unfathomably FE
  ------------------------

  File: fasp-providers.tsx

  Purpose:

    Give instance administrators a deliberate trust workflow for Fediverse
    Auxiliary Service Providers (FASPs).

  Responsibilities:

    - display pending provider registrations and key fingerprints
    - approve or reject provider identities
    - refresh signed provider information
    - activate only discovery capabilities supported by the backend
    - explain the privacy boundary before a capability is enabled

  This file intentionally does NOT contain:

    - FASP message-signature verification
    - provider private-key handling
    - automatic capability activation
*/

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import toast from '@/toast.tsx';

interface FaspCapability {
  id: string;
  version: string;
}

interface FaspPrivacyPolicy {
  language: string;
  url: string;
}

interface FaspProviderInfo {
  capabilities: FaspCapability[];
  name?: string;
  privacy_policy: FaspPrivacyPolicy[];
}

interface FaspRegistration {
  active_capabilities: FaspCapability[];
  base_url: string;
  id: number;
  local_fingerprint: string;
  name: string;
  provider_fingerprint: string;
  provider_info: FaspProviderInfo;
  state: 'accepted' | 'pending' | 'rejected';
}

interface ProviderAction {
  method?: 'delete';
  path: string;
  success: string;
}

const messages = defineMessages({
  approved: { id: 'admin.fasp.approved', defaultMessage: 'Provider identity approved' },
  rejected: { id: 'admin.fasp.rejected', defaultMessage: 'Provider registration rejected' },
  refreshed: { id: 'admin.fasp.refreshed', defaultMessage: 'Signed provider information refreshed' },
  activated: { id: 'admin.fasp.activated', defaultMessage: 'Account discovery activated' },
  deactivated: { id: 'admin.fasp.deactivated', defaultMessage: 'Account discovery disabled' },
  forgotten: { id: 'admin.fasp.forgotten', defaultMessage: 'Rejected provider request removed' },
  error: { id: 'admin.fasp.error', defaultMessage: 'The provider operation could not be completed.' },
});

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const stringValue = (value: unknown): string => typeof value === 'string' ? value : '';

const normalizeCapabilities = (value: unknown): FaspCapability[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const id = stringValue(item.id);
    const version = stringValue(item.version);

    return id && version ? [{ id, version }] : [];
  });
};

const normalizePolicies = (value: unknown): FaspPrivacyPolicy[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];

    const language = stringValue(item.language);
    const url = stringValue(item.url);

    try {
      const parsed = new URL(url);

      return parsed.protocol === 'https:' && language ? [{ language, url: parsed.toString() }] : [];
    } catch {
      return [];
    }
  });
};

const normalizeProviderInfo = (value: unknown): FaspProviderInfo => {
  if (!isRecord(value)) {
    return { capabilities: [], privacy_policy: [] };
  }

  return {
    capabilities: normalizeCapabilities(value.capabilities),
    name: stringValue(value.name) || undefined,
    privacy_policy: normalizePolicies(value.privacy_policy),
  };
};

const normalizeRegistration = (value: unknown): FaspRegistration | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'number' ? value.id : Number(value.id);
  const state = stringValue(value.state);
  const baseUrl = stringValue(value.base_url);

  if (
    !Number.isSafeInteger(id)
    || id <= 0
    || !['accepted', 'pending', 'rejected'].includes(state)
    || !baseUrl.startsWith('https://')
  ) {
    return null;
  }

  return {
    active_capabilities: normalizeCapabilities(value.active_capabilities),
    base_url: baseUrl,
    id,
    local_fingerprint: stringValue(value.local_fingerprint),
    name: stringValue(value.name) || baseUrl,
    provider_fingerprint: stringValue(value.provider_fingerprint),
    provider_info: normalizeProviderInfo(value.provider_info),
    state: state as FaspRegistration['state'],
  };
};

const normalizeRegistrations = (value: unknown): FaspRegistration[] => {
  if (!isRecord(value) || !Array.isArray(value.registrations)) return [];

  return value.registrations.flatMap((item) => {
    const registration = normalizeRegistration(item);
    return registration ? [registration] : [];
  });
};

const hasCapability = (
  capabilities: FaspCapability[],
  id: string,
  version: string,
): boolean => capabilities.some((capability) => (
  capability.id === id && capability.version === version
));

const stateTheme = (state: FaspRegistration['state']): string => {
  switch (state) {
    case 'accepted':
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300';
    case 'rejected':
      return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300';
    default:
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 black:bg-primary-900/30 black:text-primary-300';
  }
};

interface FaspProviderCardProps {
  busy: boolean;
  onAction: (action: ProviderAction) => void;
  registration: FaspRegistration;
}

const FaspProviderCard: React.FC<FaspProviderCardProps> = ({ busy, onAction, registration }) => {
  const intl = useIntl();
  const accountSearchAdvertised = hasCapability(registration.provider_info.capabilities, 'account_search', '0.1');
  const accountSearchEnabled = hasCapability(registration.active_capabilities, 'account_search', '0.1');
  const providerName = registration.provider_info.name || registration.name;

  return (
    <Stack space={4} className='rounded-xl border border-solid border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 black:border-primary-800 black:bg-primary-900/20'>
      <HStack alignItems='start' justifyContent='between' space={3}>
        <Stack space={1}>
          <Text weight='semibold'>{providerName}</Text>
          <a
            className='break-all text-sm text-primary-600 hover:underline dark:text-primary-400'
            href={registration.base_url}
            target='_blank'
            rel='noopener noreferrer'
          >
            {registration.base_url}
          </a>
        </Stack>

        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${stateTheme(registration.state)}`}>
          {registration.state}
        </span>
      </HStack>

      <Stack space={2}>
        <Text size='sm' weight='semibold'>
          <FormattedMessage id='admin.fasp.provider_fingerprint' defaultMessage='Provider SHA-256 fingerprint' />
        </Text>
        <code className='break-all rounded bg-gray-100 p-3 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100 black:bg-black black:text-gray-100'>
          {registration.provider_fingerprint}
        </code>
        <Text size='sm' theme='muted'>
          <FormattedMessage
            id='admin.fasp.fingerprint_help'
            defaultMessage='Before approval, compare this fingerprint with the value published by the provider through a separate trusted channel.'
          />
        </Text>
      </Stack>

      {registration.state === 'pending' && (
        <Stack space={3}>
          <Text size='sm'>
            <FormattedMessage
              id='admin.fasp.pending_help'
              defaultMessage='This request is inert. The provider cannot receive searches or use any capability until you approve its identity and then activate a capability separately.'
            />
          </Text>
          <HStack space={2}>
            <Button
              theme='primary'
              disabled={busy}
              onClick={() => onAction({
                path: `/api/v1/pleroma/admin/fasps/${registration.id}/approve`,
                success: intl.formatMessage(messages.approved),
              })}
            >
              <FormattedMessage id='admin.fasp.approve' defaultMessage='Approve identity' />
            </Button>
            <Button
              theme='danger'
              disabled={busy}
              onClick={() => onAction({
                path: `/api/v1/pleroma/admin/fasps/${registration.id}/reject`,
                success: intl.formatMessage(messages.rejected),
              })}
            >
              <FormattedMessage id='admin.fasp.reject' defaultMessage='Reject' />
            </Button>
          </HStack>
        </Stack>
      )}

      {registration.state === 'accepted' && (
        <Stack space={4}>
          <Stack space={2}>
            <Text size='sm' weight='semibold'>
              <FormattedMessage id='admin.fasp.local_fingerprint' defaultMessage="This server's provider-specific fingerprint" />
            </Text>
            <code className='break-all rounded bg-gray-100 p-3 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100 black:bg-black black:text-gray-100'>
              {registration.local_fingerprint}
            </code>
            <Text size='sm' theme='muted'>
              <FormattedMessage
                id='admin.fasp.local_fingerprint_help'
                defaultMessage='The provider should display this value for its side of the relationship.'
              />
            </Text>
          </Stack>

          <HStack space={2}>
            <Button
              theme='secondary'
              disabled={busy}
              onClick={() => onAction({
                path: `/api/v1/pleroma/admin/fasps/${registration.id}/refresh`,
                success: intl.formatMessage(messages.refreshed),
              })}
            >
              <FormattedMessage id='admin.fasp.refresh' defaultMessage='Refresh signed provider information' />
            </Button>
            <Button
              theme='danger'
              disabled={busy}
              onClick={() => onAction({
                path: `/api/v1/pleroma/admin/fasps/${registration.id}/reject`,
                success: intl.formatMessage(messages.rejected),
              })}
            >
              <FormattedMessage id='admin.fasp.revoke' defaultMessage='Revoke provider' />
            </Button>
          </HStack>

          {registration.provider_info.privacy_policy.length > 0 && (
            <Stack space={2}>
              <Text size='sm' weight='semibold'>
                <FormattedMessage id='admin.fasp.privacy_policies' defaultMessage='Provider privacy policies' />
              </Text>
              <HStack space={3}>
                {registration.provider_info.privacy_policy.map((policy) => (
                  <a
                    key={`${policy.language}:${policy.url}`}
                    className='text-sm text-primary-600 hover:underline dark:text-primary-400'
                    href={policy.url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {policy.language}
                  </a>
                ))}
              </HStack>
            </Stack>
          )}

          <Stack space={3} className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60 black:bg-black'>
            <Text weight='semibold'>
              <FormattedMessage id='admin.fasp.account_discovery' defaultMessage='Account discovery' />
            </Text>
            <Text size='sm'>
              <FormattedMessage
                id='admin.fasp.account_discovery_privacy'
                defaultMessage="When enabled, account-search terms typed by signed-in users may be sent to this provider. Unfathomably does not send the searching user's account identifier, and returned actor URLs still pass through normal local safety and visibility checks."
              />
            </Text>

            {accountSearchAdvertised ? (
              <Button
                theme={accountSearchEnabled ? 'secondary' : 'primary'}
                disabled={busy}
                onClick={() => onAction({
                  method: accountSearchEnabled ? 'delete' : undefined,
                  path: `/api/v1/pleroma/admin/fasps/${registration.id}/capabilities/account_search/0.1/activate`,
                  success: intl.formatMessage(accountSearchEnabled ? messages.deactivated : messages.activated),
                })}
              >
                {accountSearchEnabled ? (
                  <FormattedMessage id='admin.fasp.disable_account_discovery' defaultMessage='Disable account discovery' />
                ) : (
                  <FormattedMessage id='admin.fasp.enable_account_discovery' defaultMessage='Enable account discovery' />
                )}
              </Button>
            ) : (
              <Text size='sm' theme='muted'>
                <FormattedMessage
                  id='admin.fasp.unsupported_account_discovery'
                  defaultMessage='The provider has not advertised the supported account_search 0.1 capability.'
                />
              </Text>
            )}
          </Stack>

          {registration.provider_info.capabilities.length > 0 && (
            <Text size='sm' theme='muted'>
              <FormattedMessage
                id='admin.fasp.advertised_capabilities'
                defaultMessage='Advertised capabilities: {capabilities}'
                values={{
                  capabilities: registration.provider_info.capabilities
                    .map(({ id, version }) => `${id} ${version}`)
                    .join(', '),
                }}
              />
            </Text>
          )}
        </Stack>
      )}

      {registration.state === 'rejected' && (
        <Stack space={3}>
          <Text size='sm' theme='muted'>
            <FormattedMessage
              id='admin.fasp.rejected_help'
              defaultMessage='This provider is rejected and has no active capabilities. Remove the audit entry only if you want the provider to be able to initiate a fresh signed registration.'
            />
          </Text>
          <Button
            theme='secondary'
            disabled={busy}
            onClick={() => onAction({
              method: 'delete',
              path: `/api/v1/pleroma/admin/fasps/${registration.id}`,
              success: intl.formatMessage(messages.forgotten),
            })}
          >
            <FormattedMessage id='admin.fasp.forget' defaultMessage='Forget rejected request' />
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

const FaspProviders: React.FC = () => {
  const api = useApi();
  const intl = useIntl();
  const queryClient = useQueryClient();
  const { account } = useOwnAccount();

  const providersQuery = useQuery({
    queryKey: ['admin', 'fasps'],
    queryFn: async () => {
      const response = await api.get('/api/v1/pleroma/admin/fasps');
      return normalizeRegistrations(await response.json());
    },
    enabled: Boolean(account?.admin),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ method, path }: ProviderAction) => {
      if (method === 'delete') {
        await api.delete(path);
      } else {
        await api.post(path);
      }
    },
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasps'] });
      toast.success(action.success);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.error));
    },
  });

  if (!account?.admin) return null;

  return (
    <Stack space={5}>
      <Stack space={2}>
        <Text size='xl' weight='bold'>
          <FormattedMessage id='admin.fasp.title' defaultMessage='Discovery providers' />
        </Text>
        <Text theme='muted'>
          <FormattedMessage
            id='admin.fasp.subtitle'
            defaultMessage='Review signed FASP relationships and decide which narrowly scoped discovery capabilities this server may use.'
          />
        </Text>
      </Stack>

      <Stack space={2} className='rounded-xl border border-solid border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20 black:border-primary-800 black:bg-primary-900/20'>
        <Text weight='semibold'>
          <FormattedMessage id='admin.fasp.trust_boundary' defaultMessage='Approval and activation are separate trust decisions' />
        </Text>
        <Text size='sm'>
          <FormattedMessage
            id='admin.fasp.trust_boundary_help'
            defaultMessage='A pending registration is inert. Verify the provider fingerprint first, approve the identity, refresh its signed information, read its privacy policy, and only then enable a capability you want.'
          />
        </Text>
      </Stack>

      {providersQuery.isLoading && (
        <Text theme='muted'>
          <FormattedMessage id='admin.fasp.loading' defaultMessage='Loading provider registrations...' />
        </Text>
      )}

      {providersQuery.isError && (
        <Text theme='danger'>
          <FormattedMessage id='admin.fasp.load_error' defaultMessage='Provider registrations could not be loaded.' />
        </Text>
      )}

      {!providersQuery.isLoading && !providersQuery.isError && providersQuery.data?.length === 0 && (
        <Stack space={2} className='rounded-xl border border-dashed border-gray-300 p-5 dark:border-gray-700'>
          <Text weight='semibold'>
            <FormattedMessage id='admin.fasp.empty' defaultMessage='No discovery providers have registered' />
          </Text>
          <Text size='sm' theme='muted'>
            <FormattedMessage
              id='admin.fasp.empty_help'
              defaultMessage='A compatible provider must initiate a signed registration request before it can appear here. Nothing is enabled automatically.'
            />
          </Text>
        </Stack>
      )}

      <Stack space={4}>
        {providersQuery.data?.map((registration) => (
          <FaspProviderCard
            key={registration.id}
            registration={registration}
            busy={actionMutation.isPending}
            onAction={(action) => actionMutation.mutate(action)}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default FaspProviders;

/* end of fasp-providers.tsx */
