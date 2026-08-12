import { format as formatSemver } from '@std/semver/format';
import downloadIcon from '@tabler/icons/outline/download.svg';
import externalLinkIcon from '@tabler/icons/outline/external-link.svg';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { getSubscribersCsv, getUnsubscribersCsv, getCombinedCsv } from '@/actions/email-list.ts';
import { useInstanceV1 } from '@/api/hooks/instance/useInstanceV1.ts';
import List, { ListItem } from '@/components/list.tsx';
import { CardTitle } from '@/components/ui/card.tsx';
import IconButton from '@/components/ui/icon-button.tsx';
import Icon from '@/components/ui/icon.tsx';
import Stack from '@/components/ui/stack.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import toast from '@/toast.tsx';
import sourceCode from '@/utils/code.ts';
import { download } from '@/utils/download.ts';
import { parseVersion } from '@/utils/features.ts';

import { DashCounter, DashCounters } from '../components/dashcounter.tsx';
import RegistrationModePicker from '../components/registration-mode-picker.tsx';

const messages = defineMessages({
  csvDownloadFailed: { id: 'admin.dashboard.email_list_download_failed', defaultMessage: 'The email list could not be downloaded' },
});

const Dashboard: React.FC = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { instance } = useInstanceV1();
  const features = useFeatures();
  const { account } = useOwnAccount();

  const handleSubscribersClick: React.MouseEventHandler = e => {
    e.preventDefault();
    dispatch(getSubscribersCsv()).then((response) => response.text()).then((data) => {
      download(data, 'subscribers.csv');
    }).catch(() => toast.error(intl.formatMessage(messages.csvDownloadFailed)));
  };

  const handleUnsubscribersClick: React.MouseEventHandler = e => {
    e.preventDefault();
    dispatch(getUnsubscribersCsv()).then((response) => response.text()).then((data) => {
      download(data, 'unsubscribers.csv');
    }).catch(() => toast.error(intl.formatMessage(messages.csvDownloadFailed)));
  };

  const handleCombinedClick: React.MouseEventHandler = e => {
    e.preventDefault();
    dispatch(getCombinedCsv()).then((response) => response.text()).then((data) => {
      download(data, 'combined.csv');
    }).catch(() => toast.error(intl.formatMessage(messages.csvDownloadFailed)));
  };

  const v = parseVersion(instance?.version ?? '0.0.0');

  const {
    user_count: userCount,
    status_count: statusCount,
    domain_count: domainCount,
  } = instance?.stats ?? {};

  const mau = instance?.pleroma.stats.mau;
  const monthlyActiveShare = (userCount && mau) ? Math.round(mau / userCount * 100) : undefined;

  if (!account) return null;

  return (
    <Stack space={6} className='mt-4'>
      <DashCounters>
        <DashCounter
          count={mau}
          label={<FormattedMessage id='admin.dashcounters.mau_label' defaultMessage='monthly active users' />}
        />
        <DashCounter
          to='/soapbox/admin/users'
          count={userCount}
          label={<FormattedMessage id='admin.dashcounters.user_count_label' defaultMessage='total users' />}
        />
        <DashCounter
          count={monthlyActiveShare}
          label={<FormattedMessage id='admin.dashcounters.monthly_active_share_label' defaultMessage='monthly active share' />}
          percent
        />
        <DashCounter
          to='/timeline/local'
          count={statusCount}
          label={<FormattedMessage id='admin.dashcounters.status_count_label' defaultMessage='posts' />}
        />
        <DashCounter
          count={domainCount}
          label={<FormattedMessage id='admin.dashcounters.domain_count_label' defaultMessage='peers' />}
        />
      </DashCounters>

      <List>
        {account.admin && features.ditto && (
          <ListItem
            to='/soapbox/admin/ditto-server'
            label={<FormattedMessage id='column.admin.ditto_server.manage' defaultMessage='Manage Ditto Server' />}
          />
        )}

        {account.admin && (
          <ListItem
            to='/soapbox/config'
            label={<FormattedMessage id='admin.dashboard.frontend_config' defaultMessage='Frontend configuration' />}
          />
        )}

        <ListItem
          to='/soapbox/admin/theme'
          label={<FormattedMessage id='column.admin.theme' defaultMessage='Theme editor' />}
        />

        {account.admin && (
          <ListItem
            href='/pleroma/admin/'
            label={<FormattedMessage id='column.admin.backend_tools' defaultMessage='Backend configuration and maintenance' />}
            hint={<FormattedMessage id='column.admin.backend_tools_hint' defaultMessage='Configure the server, invitations, emoji packs, statuses, and media cache in AdminFE.' />}
          />
        )}

        <ListItem
          to='/soapbox/admin/log'
          label={<FormattedMessage id='column.admin.moderation_log' defaultMessage='Moderation Log' />}
        />

        {account.admin && (
          <ListItem
            to='/soapbox/admin/database-cleanup'
            label={<FormattedMessage id='column.admin.database_cleanup' defaultMessage='Database cleanup' />}
          />
        )}

        {account.admin && (
          <ListItem
            to='/soapbox/admin/relays'
            label={<FormattedMessage id='admin.dashboard.activitypub_relays' defaultMessage='ActivityPub relays' />}
          />
        )}

        {account.admin && (
          <ListItem
            to='/soapbox/admin/federation-health'
            label={<FormattedMessage id='column.admin.federation_health' defaultMessage='Federation health' />}
          />
        )}

        {account.admin && (
          <ListItem
            to='/soapbox/admin/fasps'
            label={<FormattedMessage id='admin.dashboard.fasps' defaultMessage='Discovery providers' />}
            hint={<FormattedMessage id='admin.dashboard.fasps_hint' defaultMessage='Review signed provider fingerprints and deliberately activate discovery capabilities.' />}
          />
        )}

        {features.ditto && (
          <ListItem
            to='/soapbox/admin/zap-split'
            label={<FormattedMessage id='column.admin.zap_split' defaultMessage='Manage Zap Split' />}
          />
        )}

        {features.adminAnnouncements && (
          <ListItem
            to='/soapbox/admin/announcements'
            label={<FormattedMessage id='column.admin.announcements' defaultMessage='Announcements' />}
          />
        )}

        {features.adminRules && (
          <ListItem
            to='/soapbox/admin/rules'
            label={<FormattedMessage id='column.admin.rules' defaultMessage='Instance rules' />}
          />
        )}

        {features.domains && (
          <ListItem
            to='/soapbox/admin/domains'
            label={<FormattedMessage id='column.admin.domains' defaultMessage='Domains' />}
          />
        )}

        {features.ditto && (
          <ListItem
            to='/soapbox/admin/nostr/relays'
            label={<FormattedMessage id='column.admin.nostr_relays' defaultMessage='Relays' />}
          />
        )}
      </List>

      {account.admin && (
        <>
          <CardTitle
            title={<FormattedMessage id='admin.dashboard.registration_mode_label' defaultMessage='Registrations' />}
          />

          <RegistrationModePicker />
        </>
      )}

      <CardTitle
        title={<FormattedMessage id='admin.dashwidgets.software_header' defaultMessage='Software' />}
      />

      <List>
        <ListItem label={<FormattedMessage id='admin.software.frontend' defaultMessage='Frontend' />}>
          <a
            href={sourceCode.ref ? `${sourceCode.url}/tree/${sourceCode.ref}` : sourceCode.url}
            className='flex items-center space-x-1 truncate'
            target='_blank'
          >
            <span>{sourceCode.displayName} {sourceCode.version}</span>

            <Icon
              className='size-4'
              src={externalLinkIcon}
            />
          </a>
        </ListItem>

        <ListItem label={<FormattedMessage id='admin.software.backend' defaultMessage='Backend' />}>
          <span>{v.software + (v.build ? `+${v.build}` : '')} {formatSemver(v.version)}</span> {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}
        </ListItem>
      </List>

      {(features.emailList && account.admin) && (
        <>
          <CardTitle
            title={<FormattedMessage id='admin.dashwidgets.email_list_header' defaultMessage='Email list' />}
          />

          <List>
            <ListItem label='subscribers.csv'>
              <IconButton
                src={downloadIcon}
                onClick={handleSubscribersClick}
                iconClassName='h-5 w-5'
              />
            </ListItem>

            <ListItem label='unsubscribers.csv'>
              <IconButton
                src={downloadIcon}
                onClick={handleUnsubscribersClick}
                iconClassName='h-5 w-5'
              />
            </ListItem>

            <ListItem label='combined.csv'>
              <IconButton
                src={downloadIcon}
                onClick={handleCombinedClick}
                iconClassName='h-5 w-5'
              />
            </ListItem>
          </List>
        </>
      )}
    </Stack>
  );
};

export default Dashboard;
