/*
  Project: Unfathomably FE
  File: src/features/sources/default.tsx

  Purpose:
    Route the generic Feeds navigation entry to the user's preferred feed view.

  Responsibilities:
    Read the personal Feeds default-tab setting and redirect to the selected
    concrete route.

  This file intentionally does NOT contain:
    Feed timeline rendering, feed search, or follow-management behavior.
*/

import { Redirect } from 'react-router-dom';

import { useSettings } from '@/hooks/useSettings.ts';

const SourcesDefault: React.FC = () => {
  const { sources } = useSettings();
  const to = sources.defaultTab === 'my_sources' ? '/feeds/my' : '/feeds/feed';

  return <Redirect to={to} />;
};

export default SourcesDefault;

/* end of src/features/sources/default.tsx */
