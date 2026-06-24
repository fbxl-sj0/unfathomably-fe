/*
  Project: Unfathomably FE
  File: src/features/sources/components/tab-bar.tsx

  Purpose:
    Provide the top-level navigation for source management and source posts.

  Responsibilities:
    Render tab controls and route users between the Sources list and feed.

  This file intentionally does NOT contain:
    Source fetching, follow state management, or timeline rendering.
*/

import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import Tabs from '@/components/ui/tabs.tsx';

import type { Item } from '@/components/ui/tabs.tsx';

export enum TabItems {
  MY_SOURCES = 'MY_SOURCES',
  SOURCE_FEED = 'SOURCE_FEED',
}

interface ITabBar {
  activeTab: TabItems;
}

const TabBar = ({ activeTab }: ITabBar) => {
  const history = useHistory();

  const tabItems: Item[] = useMemo(() => ([
    {
      text: 'My Sources',
      action: () => history.push('/sources'),
      name: TabItems.MY_SOURCES,
    },
    {
      text: 'Source Feed',
      action: () => history.push('/sources/feed'),
      name: TabItems.SOURCE_FEED,
    },
  ]), []);

  return (
    <Tabs
      items={tabItems}
      activeItem={activeTab}
    />
  );
};

export default TabBar;

/* end of src/features/sources/components/tab-bar.tsx */
