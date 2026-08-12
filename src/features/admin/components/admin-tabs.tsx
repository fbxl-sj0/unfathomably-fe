import { useIntl, defineMessages } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import Tabs from '@/components/ui/tabs.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

const messages = defineMessages({
  dashboard: { id: 'admin_nav.dashboard', defaultMessage: 'Dashboard' },
  reports: { id: 'admin_nav.reports', defaultMessage: 'Reports' },
  waitlist: { id: 'admin_nav.awaiting_approval', defaultMessage: 'Waitlist' },
  invites: { id: 'admin_nav.invites', defaultMessage: 'Invites' },
  federationConnectors: { id: 'admin_nav.federation_connectors', defaultMessage: 'Federation connectors' },
});

const AdminTabs: React.FC = () => {
  const intl = useIntl();
  const match = useRouteMatch();
  const { account } = useOwnAccount();

  const approvalCount = useAppSelector(state => state.admin.awaitingApproval.count());
  const reportsCount = useAppSelector(state => state.admin.openReports.count());

  const tabs = [{
    name: '/soapbox/admin',
    text: intl.formatMessage(messages.dashboard),
    to: '/soapbox/admin',
  }, {
    name: '/soapbox/admin/reports',
    text: intl.formatMessage(messages.reports),
    to: '/soapbox/admin/reports',
    count: reportsCount,
  }, {
    name: '/soapbox/admin/approval',
    text: intl.formatMessage(messages.waitlist),
    to: '/soapbox/admin/approval',
    count: approvalCount,
  }];

  if (account?.admin) {
    tabs.push({
      name: '/soapbox/admin/invites',
      text: intl.formatMessage(messages.invites),
      to: '/soapbox/admin/invites',
    });
    tabs.push({
      name: '/soapbox/admin/federation-connectors',
      text: intl.formatMessage(messages.federationConnectors),
      to: '/soapbox/admin/federation-connectors',
    });
  }

  return <Tabs items={tabs} activeItem={match.path} />;
};

export default AdminTabs;
