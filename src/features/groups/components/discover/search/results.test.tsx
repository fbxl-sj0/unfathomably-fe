import { VirtuosoGridMockContext, VirtuosoMockContext } from 'react-virtuoso';
import { describe, expect, it, vi } from 'vitest';

import { buildAccount, buildGroup } from '@/jest/factory.ts';
import { render, screen, waitFor } from '@/jest/test-helpers.tsx';

import Results from './results.tsx';

const userId = '1';
const store = {
  me: userId,
  accounts: {
    [userId]: buildAccount({
      id: userId,
      acct: 'justin-username',
      display_name: 'Justin L',
      avatar: 'test.jpg',
      source: {
        chats_onboarded: false,
      },
    }),
  },
};

const renderApp = (children: React.ReactNode) => (
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>
      <VirtuosoGridMockContext.Provider value={{ viewportHeight: 300, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
        {children}
      </VirtuosoGridMockContext.Provider>
    </VirtuosoMockContext.Provider>,
    undefined,
    store,
  )
);

const sourceTarget = {
  target_type: 'source',
  source: {
    actor_type: 'Person',
    acct: 'library@audio.example',
    avatar: '',
    capabilities: ['follow library', 'preview tracks'],
    display_name: 'Funkwhale Library',
    domain: 'audio.example',
    id: 'source-1',
    note: '<p>Audio tracks and podcasts</p>',
    platform_family: 'audio',
    platform_label: 'Funkwhale',
    relationship: {
      following: false,
    },
    source_profile: 'library',
    url: 'https://audio.example/library',
  },
} as any;

const targetSearchResult = {
  targets: [
    { target_type: 'group', group: buildGroup() },
    sourceTarget,
  ],
  hasNextPage: false,
  isFetching: false,
  fetchNextPage: vi.fn(),
} as any;

describe('<Results />', () => {
  describe('with target search results', () => {
    it('should render group targets', async () => {
      renderApp(<Results targetSearchResult={targetSearchResult} />);
      await waitFor(() => {
        expect(screen.getByTestId('group-list-item')).toBeInTheDocument();
      });
    });

    it('should render feed targets', async () => {
      renderApp(<Results targetSearchResult={targetSearchResult} />);
      await waitFor(() => {
        expect(screen.getByText('Funkwhale Library')).toBeInTheDocument();
      });
    });
  });
});
