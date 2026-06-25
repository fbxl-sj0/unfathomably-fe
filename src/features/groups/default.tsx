import { Redirect } from 'react-router-dom';

import { useSettings } from '@/hooks/useSettings.ts';

const GroupsDefault: React.FC = () => {
  const { groups } = useSettings();
  const to = groups.defaultTab === 'group_feed' ? '/groups/feed' : '/groups/my';

  return <Redirect to={to} />;
};

export default GroupsDefault;
