/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/federation/platform-badge.tsx

  Purpose:

    Render a compact platform/family badge for federated sources, groups,
    and native source items.

  Responsibilities:

    * show a recognizable platform label when one is known
    * color-code the broad native UI family
    * stay small enough to fit inside existing cards

  This file intentionally does NOT contain:

    * platform classification logic
    * network requests
    * follow or join actions
*/

import clsx from 'clsx';
import { defineMessages, FormattedMessage } from 'react-intl';

import { normalizeFederationFamily, type FederationFamily } from './platform.ts';

interface IPlatformBadge {
  family?: string | null;
  label?: string | null;
}

const familyMessages = defineMessages<FederationFamily>({
  audio: { id: 'federation.family.audio', defaultMessage: 'Audio' },
  video: { id: 'federation.family.video', defaultMessage: 'Video' },
  longform: { id: 'federation.family.longform', defaultMessage: 'Article' },
  microblog: { id: 'federation.family.microblog', defaultMessage: 'Status' },
  photo: { id: 'federation.family.photo', defaultMessage: 'Photo' },
  models: { id: 'federation.family.models', defaultMessage: '3D model' },
  games: { id: 'federation.family.games', defaultMessage: 'Game' },
  marketplace: { id: 'federation.family.marketplace', defaultMessage: 'Marketplace' },
  culture: { id: 'federation.family.culture', defaultMessage: 'Catalog' },
  books: { id: 'federation.family.books', defaultMessage: 'Book' },
  bookmarks: { id: 'federation.family.bookmarks', defaultMessage: 'Link' },
  groups: { id: 'federation.family.groups', defaultMessage: 'Community' },
  events: { id: 'federation.family.events', defaultMessage: 'Event' },
  development: { id: 'federation.family.development', defaultMessage: 'Development' },
  coordination: { id: 'federation.family.coordination', defaultMessage: 'Coordination' },
  publishing: { id: 'federation.family.publishing', defaultMessage: 'Publishing' },
  routes: { id: 'federation.family.routes', defaultMessage: 'Route' },
  local: { id: 'federation.family.local', defaultMessage: 'Local' },
  generic: { id: 'federation.family.generic', defaultMessage: 'Post' },
});

const familyClasses: Record<FederationFamily, string> = {
  audio: 'bg-amber-100 text-amber-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-amber-900/30 dark:text-amber-100',
  video: 'bg-rose-100 text-rose-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-rose-900/30 dark:text-rose-100',
  longform: 'bg-sky-100 text-sky-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-sky-900/30 dark:text-sky-100',
  microblog: 'bg-violet-100 text-violet-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-violet-900/30 dark:text-violet-100',
  photo: 'bg-emerald-100 text-emerald-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-emerald-900/30 dark:text-emerald-100',
  models: 'bg-teal-100 text-teal-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-teal-900/30 dark:text-teal-100',
  games: 'bg-blue-100 text-blue-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-blue-900/30 dark:text-blue-100',
  marketplace: 'bg-yellow-100 text-yellow-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-yellow-900/30 dark:text-yellow-100',
  culture: 'bg-fuchsia-100 text-fuchsia-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-fuchsia-900/30 dark:text-fuchsia-100',
  books: 'bg-stone-100 text-stone-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-stone-800 dark:text-stone-100',
  bookmarks: 'bg-cyan-100 text-cyan-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-cyan-900/30 dark:text-cyan-100',
  groups: 'bg-lime-100 text-lime-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-lime-900/30 dark:text-lime-100',
  events: 'bg-orange-100 text-orange-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-orange-900/30 dark:text-orange-100',
  development: 'bg-indigo-100 text-indigo-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-indigo-900/30 dark:text-indigo-100',
  coordination: 'bg-purple-100 text-purple-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-purple-900/30 dark:text-purple-100',
  publishing: 'bg-cyan-100 text-cyan-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-cyan-900/30 dark:text-cyan-100',
  routes: 'bg-green-100 text-green-900 black:bg-primary-900/60 black:text-primary-100 dark:bg-green-900/30 dark:text-green-100',
  local: 'bg-gray-100 text-gray-900 black:bg-primary-900 black:text-gray-100 dark:bg-gray-800 dark:text-gray-100',
  generic: 'bg-gray-100 text-gray-900 black:bg-primary-900 black:text-gray-100 dark:bg-gray-800 dark:text-gray-100',
};

const platformSeparator = '/';

const PlatformBadge: React.FC<IPlatformBadge> = ({ family, label }) => {
  const normalizedFamily = normalizeFederationFamily(family);
  const visibleLabel = label && label !== 'Unknown' ? label : null;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        familyClasses[normalizedFamily],
      )}
      data-testid='federation-platform-badge'
    >
      {visibleLabel ? (
        <>
          <span>{visibleLabel}</span>
          <span aria-hidden='true'>{platformSeparator}</span>
        </>
      ) : null}
      <FormattedMessage {...familyMessages[normalizedFamily]} />
    </span>
  );
};

export default PlatformBadge;

/* end of src/features/federation/platform-badge.tsx */
