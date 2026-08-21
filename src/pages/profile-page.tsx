import { useQuery } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';
import { Redirect, useHistory } from 'react-router-dom';
import * as z from '@/zod.ts';

import { useAccountLookup } from '@/api/hooks/index.ts';
import { Column } from '@/components/ui/column.tsx';
import Layout from '@/components/ui/layout.tsx';
import Stack from '@/components/ui/stack.tsx';
import Tabs from '@/components/ui/tabs.tsx';
import Header from '@/features/account/components/header.tsx';
import LinkFooter from '@/features/ui/components/link-footer.tsx';
import {
  WhoToFollowPanel,
  ProfileInfoPanel,
  ProfileMediaPanel,
  ProfileFieldsPanel,
  SignUpPanel,
  CtaBanner,
  PinnedAccountsPanel,
  AccountNotePanel,
  PocketWallet,
} from '@/features/ui/util/async-components.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useApi } from '@/hooks/useApi.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useSoapboxConfig } from '@/hooks/useSoapboxConfig.ts';
import { getAcct } from '@/utils/accounts.ts';

interface IProfilePage {
  params?: {
    username?: string;
  };
  children: React.ReactNode;
}

const worldFamilySchema = z.enum([
  'audio', 'video', 'longform', 'photo', 'books', 'bookmarks', 'groups',
  'events', 'development', 'models', 'marketplace', 'games', 'routes',
  'culture', 'coordination', 'publishing',
]);
const worldParticipationSchema = z.object({
  account_id: z.string(),
  families: z.array(z.object({ id: worldFamilySchema, count: z.number().int().positive() })),
});
const worldLabels: Record<z.infer<typeof worldFamilySchema>, string> = {
  audio: 'Audio',
  video: 'Video',
  longform: 'Articles',
  photo: 'Photos',
  books: 'Books',
  bookmarks: 'Bookmarks',
  groups: 'Communities',
  events: 'Events',
  development: 'Software',
  models: '3D models',
  marketplace: 'Markets',
  games: 'Games',
  routes: 'Routes',
  culture: 'Culture',
  coordination: 'Coordination',
  publishing: 'Publishing',
};

/** Page to display a user's profile. */
const ProfilePage: React.FC<IProfilePage> = ({ params, children }) => {
  const api = useApi();
  const history = useHistory();
  const username = params?.username || '';

  const { account } = useAccountLookup(username, { withRelationship: true });

  const me = useAppSelector(state => state.me);
  const features = useFeatures();
  const { displayFqn } = useSoapboxConfig();
  const hasWallet = account?.ditto.accepts_zaps_cashu ?? false;
  const { data: worldParticipation } = useQuery({
    queryKey: ['account-worlds', account?.id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/accounts/${account!.id}/worlds`);
      return worldParticipationSchema.parse(await response.json());
    },
    enabled: features.nativeFederation && Boolean(account?.id),
    staleTime: 60_000,
  });

  // Fix case of username
  if (account && account.acct !== username) {
    return <Redirect to={`/@${account.acct}`} />;
  }

  const tabItems: Array<{ text: React.ReactNode; to: string; name: string }> = [
    {
      text: <FormattedMessage id='account.posts' defaultMessage='Posts' />,
      to: `/@${username}`,
      name: 'profile',
    },
    {
      text: <FormattedMessage id='account.posts_with_replies' defaultMessage='Posts & replies' />,
      to: `/@${username}/with_replies`,
      name: 'replies',
    },
    {
      text: <FormattedMessage id='account.media' defaultMessage='Media' />,
      to: `/@${username}/media`,
      name: 'media',
    },
  ];

  if (account) {
    const ownAccount = account.id === me;
    if (ownAccount || account.pleroma?.hide_favorites === false) {
      tabItems.push({
        text: <FormattedMessage id='navigation_bar.favourites' defaultMessage='Likes' />,
        to: `/@${account.acct}/favorites`,
        name: 'likes',
      });
    }

    for (const { id } of worldParticipation?.families || []) {
      tabItems.push({
        text: worldLabels[id],
        to: `/@${account.acct}/worlds/${id}`,
        name: `world:${id}`,
      });
    }
  }

  let activeItem;
  const pathname = history.location.pathname.replace(`@${username}/`, '');
  const worldMatch = pathname.match(/\/worlds\/([^/]+)$/);
  if (worldMatch) {
    activeItem = `world:${worldMatch[1]}`;
  } else if (pathname.endsWith('/with_replies')) {
    activeItem = 'replies';
  } else if (pathname.endsWith('/media')) {
    activeItem = 'media';
  } else if (pathname.endsWith('/favorites')) {
    activeItem = 'likes';
  } else {
    activeItem = 'profile';
  }

  const showTabs = !['/following', '/followers', '/pins'].some(path => pathname.endsWith(path));

  return (
    <>
      <Layout.Main>
        <Column size='lg' label={account ? `@${getAcct(account, displayFqn)}` : ''} withHeader={false} slim>
          <Stack space={4}>
            <Header account={account} />

            <Stack space={4} className='px-6'>
              <ProfileInfoPanel username={username} account={account} />

              {account && showTabs && (
                <Tabs key={`profile-tabs-${account.id}`} items={tabItems} activeItem={activeItem} />
              )}
            </Stack>

            {children}
          </Stack>
        </Column>

        {!me && (
          <CtaBanner />
        )}
      </Layout.Main>

      <Layout.Aside>
        {!me && (
          <SignUpPanel />
        )}

        {me && features.ditto && hasWallet && (
          <PocketWallet />
        )}

        {features.notes && account && account?.id !== me && (
          <AccountNotePanel account={account} />
        )}
        <ProfileMediaPanel account={account} />
        {(account && account.fields.length > 0) && (
          <ProfileFieldsPanel account={account} />
        )}
        {(features.accountEndorsements && account && account.local) ? (
          <PinnedAccountsPanel account={account} limit={5} />
        ) : me && features.suggestions && (
          <WhoToFollowPanel limit={3} />
        )}
        <LinkFooter key='link-footer' />
      </Layout.Aside>
    </>
  );
};

export default ProfilePage;
