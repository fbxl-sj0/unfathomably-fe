import { defineMessages, useIntl } from 'react-intl';
import { Switch, Route } from 'react-router-dom';

import { Column } from '@/components/ui/column.tsx';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import AdminTabs from './components/admin-tabs.tsx';
import FederationConnectors from './federation-connectors.tsx';
import FaspProviders from './fasp-providers.tsx';
import Waitlist from './tabs/awaiting-approval.tsx';
import Dashboard from './tabs/dashboard.tsx';
import Reports from './tabs/reports.tsx';

const messages = defineMessages({
  heading: { id: 'column.admin.dashboard', defaultMessage: 'Dashboard' },
});

const Admin: React.FC = () => {
  const intl = useIntl();
  const { account } = useOwnAccount();

  if (!account) return null;

  return (
    <Column label={intl.formatMessage(messages.heading)} withHeader={false}>
      <AdminTabs />

      <Switch>
        <Route path='/soapbox/admin' exact component={Dashboard} />
        <Route path='/soapbox/admin/reports' exact component={Reports} />
        <Route path='/soapbox/admin/approval' exact component={Waitlist} />
        <Route path='/soapbox/admin/federation-connectors' exact component={FederationConnectors} />
        <Route path='/soapbox/admin/fasps' exact component={FaspProviders} />
      </Switch>
    </Column>
  );
};

export default Admin;
