/*
 * Project: Unfathomably FE
 *
 * File: account-worlds/index.tsx
 *
 * Purpose:
 *   Render one specialized Worlds family inside an account profile.
 *
 * Responsibilities:
 *   - present public book shelves through the established library workflow
 *   - present other native families through normal account status rendering
 *   - reject unsupported family route values before issuing timeline requests
 *
 * This file intentionally does NOT infer participation from domains or fetch
 * remote services directly.
 */

import { useAccountLookup } from '@/api/hooks/index.ts';
import { BookLibrary } from '@/components/book-shelf-control.tsx';
import MissingIndicator from '@/components/missing-indicator.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import AccountTimeline from '@/features/account-timeline/index.tsx';
import WorldObjectLibrary from '@/features/native-federation/world-object-library.tsx';

const supportedFamilies = new Set([
  'audio', 'video', 'longform', 'photo', 'books', 'bookmarks', 'groups',
  'events', 'development', 'models', 'marketplace', 'games', 'routes',
  'culture', 'coordination', 'publishing',
]);

interface IAccountWorlds {
  params: {
    family: string;
    username: string;
  };
}

const AccountWorlds: React.FC<IAccountWorlds> = ({ params }) => {
  const { account } = useAccountLookup(params.username, { withRelationship: true });

  if (!supportedFamilies.has(params.family)) return <MissingIndicator nested />;
  if (!account) return <Spinner />;

  if (params.family === 'books') {
    return (
      <BookLibrary
        accountId={account.id}
        accountName={account.display_name || `@${account.acct}`}
      />
    );
  }

  return (
    <>
      <WorldObjectLibrary
        accountId={account.id}
        accountName={account.display_name || `@${account.acct}`}
        family={params.family}
      />
      <AccountTimeline params={{ username: params.username }} nativeFamily={params.family} />
    </>
  );
};

export default AccountWorlds;

/* end of account-worlds/index.tsx */
