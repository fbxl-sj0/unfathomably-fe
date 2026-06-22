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
  books: { id: 'federation.family.books', defaultMessage: 'Book' },
  bookmarks: { id: 'federation.family.bookmarks', defaultMessage: 'Link' },
  groups: { id: 'federation.family.groups', defaultMessage: 'Community' },
  events: { id: 'federation.family.events', defaultMessage: 'Event' },
  local: { id: 'federation.family.local', defaultMessage: 'Local' },
  generic: { id: 'federation.family.generic', defaultMessage: 'ActivityPub' },
});

const familyClasses: Record<FederationFamily, string> = {
  audio: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100',
  video: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100',
  longform: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100',
  microblog: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100',
  photo: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100',
  books: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100',
  bookmarks: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-100',
  groups: 'bg-lime-100 text-lime-900 dark:bg-lime-900/30 dark:text-lime-100',
  events: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100',
  local: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  generic: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
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
