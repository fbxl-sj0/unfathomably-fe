/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/native-federation/native-family-guide.tsx

  Purpose:

    Explain what a selected Worlds family represents and how a person can
    discover, create, and use it without knowing ActivityPub terminology.

  Responsibilities:

    * name the interoperable applications represented by each family
    * describe the useful local workflow and honest interaction boundary
    * keep guidance attached to structural families rather than hostnames

  This file intentionally does NOT contain:

    * platform detection
    * network requests
    * protocol capability inference
*/

import { FormattedMessage } from 'react-intl';

import type { PresentationFamily } from './presentation-family.ts';

interface NativeFamilyGuideDefinition {
  create: string;
  discover: string;
  platforms: string;
  summary: string;
}

const guides: Partial<Record<PresentationFamily, NativeFamilyGuideDefinition>> = {
  audio: {
    create: 'Upload audio you can distribute, then identify the artist, release, topics, and license. MusicBrainz can fill descriptive metadata without copying the recording.',
    discover: 'Resolve a Funkwhale library, artist, album, playlist, or track. Public items can be inspected locally; playback and restricted-library access remain explicit source-owned actions.',
    platforms: 'Funkwhale',
    summary: 'Playable tracks, podcasts, libraries, listens, and favourites.',
  },
  video: {
    create: 'Upload a video with a useful description, language, topics, license, and optional captions or artwork.',
    discover: 'Follow PeerTube channels or Owncast services. Videos and live-stream updates appear as media rather than generic links.',
    platforms: 'PeerTube and Owncast',
    summary: 'Channels, videos, live streams, comments, reactions, and deletion.',
  },
  photo: {
    create: 'Upload described photographs, then add the caption, general place, date, album, and reuse terms.',
    discover: 'Follow Pixelfed photographers normally. Images use the full media viewer and ordinary reply, favourite, and sharing controls.',
    platforms: 'Pixelfed',
    summary: 'Photographs and media stories with normal social interaction.',
  },
  books: {
    create: 'Find the edition in Open Library, review the imported details, choose a reading state and rating, then write the review in your own words.',
    discover: 'Follow BookWyrm readers, and resolve shared books, editions, authors, or shelves. Reviews retain their book and edition context instead of becoming anonymous articles.',
    platforms: 'BookWyrm',
    summary: 'Books, editions, shelves, reviews, ratings, and reading progress.',
  },
  culture: {
    create: 'Identify the film, series, album, podcast, performance, exhibition, or game and add creator, year, status, rating, and your own review.',
    discover: 'Follow NeoDB accounts and collections. Catalog identity, rating, and completion state remain visible beside the discussion.',
    platforms: 'NeoDB',
    summary: 'Cultural catalog items, ratings, reviews, and collection activity.',
  },
  longform: {
    create: 'Write a readable article with a clear title, summary, license, and useful links. Keep any media descriptions and citations with the work.',
    discover: 'Browse the reviewed WriteFreely community directory or follow a known publishing source. Resolve a complete source actor or article URL when a writer shares one directly.',
    platforms: 'WriteFreely, WordPress, and compatible publishers',
    summary: 'Essays, posts, blogs, and long-lived publishing sources.',
  },
  publishing: {
    create: 'Create a publication, chapter, or document with its author, edition, language, license, and any useful series or collection context.',
    discover: 'Browse the reviewed writing-community directory or follow a known publication source. Publications without a common directory are discovered from complete actor or collection URLs.',
    platforms: 'WriteFreely, CommonPub, ZenPub, and compatible publishers',
    summary: 'Publications, chapters, documents, collections, and editorial activity.',
  },
  bookmarks: {
    create: 'Save a useful link with a clear title, summary, topics, and source attribution so other people can understand why it matters.',
    discover: 'Bookmark sources are usually shared directly rather than through a global directory. Resolve a complete collection or actor URL from a trusted introduction.',
    platforms: 'Postmarks and compatible bookmark collections',
    summary: 'Curated links, reading lists, annotations, and bookmark collections.',
  },
  groups: {
    create: 'Use Create community for the full privacy, identity, membership, and moderation workflow. Afterward, invite members or share its federated address.',
    discover: 'Browse reviewed and locally known communities, then follow the group actor you choose. A complete community URL can be resolved deliberately when someone shares it with you.',
    platforms: 'Bonfire, Lemmy, MBin, PieFed, and compatible group platforms',
    summary: 'Communities, forums, magazines, topics, and group discussions.',
  },
  games: {
    create: 'Start from a Castling challenge or game. Follow the board and moves here, then use the authoritative game service when a move or challenge requires its rules engine.',
    discover: 'Load current Castling challengers and recent games below. Positions render as real boards, and the latest move can be resolved into Unfathomably without pretending the game root is a status.',
    platforms: 'Castling.club',
    summary: 'Games, positions, moves, participants, schedules, and results.',
  },
  models: {
    create: 'Upload the actual model or archive plus preview images, version, dimensions, file format, and a license that explains reuse.',
    discover: 'Search the reviewed Manyfold catalogue below. Open the native model page for files and versions, or resolve its model actor here and explicitly follow future updates.',
    platforms: 'Manyfold',
    summary: 'Downloadable 3D models, versions, collections, formats, and licenses.',
  },
  marketplace: {
    create: 'Describe an offer or request with condition, fulfilment, expiry, and a safe general location. Sharing with approved marketplaces is explicit and off by default.',
    discover: 'A server administrator connects trusted Flohmarkt peers. New public offers arrive through that connection without scraping or repeatedly polling strangers.',
    platforms: 'Flohmarkt',
    summary: 'Classified listings, availability, location, fulfilment, and private follow-up conversations.',
  },
  routes: {
    create: 'Upload a GPX track and remove private endpoints first. Add distance, difficulty, elevation, expected duration, access, and safety notes.',
    discover: 'Follow Wanderer route actors and collections. The route file and practical trail details stay attached to the item.',
    platforms: 'Wanderer',
    summary: 'Routes, trails, GPX tracks, terrain, timing, elevation, and location.',
  },
  development: {
    create: 'Publish an actionable issue with the repository, kind, impact, affected version, labels, reproduction details, and safe attachments.',
    discover: 'ForgeFed has no central project registry. Resolve an exact project, repository, or tracker actor published by its maintainer, then follow it for public development activity.',
    platforms: 'ForgeFed implementations',
    summary: 'Projects, repositories, issues, patches, pushes, and development lifecycle activity.',
  },
  coordination: {
    create: 'State whether you offer, request, or coordinate something; name the resource or outcome; and add quantity, place, deadline, recipient, and useful skills.',
    discover: 'ActivityPods mutual aid is private by default. Start from a trusted introduction or an exact actor or item shared with you; private records remain absent unless their owner grants access.',
    platforms: 'Bonfire ValueFlows and mutual-aid applications',
    summary: 'Offers, needs, resources, intentions, quantities, participants, and shared work.',
  },
  events: {
    create: 'Use Plan event for the full organizer, schedule, venue, participation policy, visibility, banner, and description workflow.',
    discover: 'Follow Mobilizon groups or Gancio event sources. Event cards preserve schedule, place, comments, and RSVP controls when the peer supports them.',
    platforms: 'Mobilizon and Gancio',
    summary: 'Events, places, organizers, comments, RSVPs, and group activity.',
  },
};

interface INativeFamilyGuide {
  family: PresentationFamily;
}

const NativeFamilyGuide: React.FC<INativeFamilyGuide> = ({ family }) => {
  const guide = guides[family];

  if (!guide) return null;

  return (
    <details className='border-b border-gray-200 black:border-gray-800 dark:border-gray-800'>
      <summary className='cursor-pointer px-4 py-3 text-sm font-bold text-gray-700 hover:text-primary-700 black:text-gray-200 black:hover:text-primary-300 dark:text-gray-200 dark:hover:text-primary-300 sm:px-5'>
        <FormattedMessage id='native_federation.guide.summary' defaultMessage='Tips for this world' />
      </summary>
      <div className='border-t border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
        <p className='text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>{guide.platforms}</p>
        <p className='mt-1 text-sm font-semibold text-gray-950 black:text-white dark:text-white'>{guide.summary}</p>
        <div className='mt-3 grid gap-3 text-sm leading-6 text-gray-700 black:text-gray-200 dark:text-gray-300 sm:grid-cols-2'>
          <p><strong><FormattedMessage id='native_federation.guide.discover' defaultMessage='Discover: ' /></strong>{guide.discover}</p>
          <p><strong><FormattedMessage id='native_federation.guide.create' defaultMessage='Create: ' /></strong>{guide.create}</p>
        </div>
      </div>
    </details>
  );
};

export default NativeFamilyGuide;

/* end of src/features/native-federation/native-family-guide.tsx */
