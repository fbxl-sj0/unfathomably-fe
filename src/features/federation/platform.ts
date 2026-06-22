/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/federation/platform.ts

  Purpose:

    Classify federated software and ActivityPub object payloads into UI
    families that can be tested independently from individual screens.

  Responsibilities:

    * map known remote software names to native-feeling UI families
    * provide render hints for source and group surfaces
    * keep frontend behavior aligned with backend platform contracts

  This file intentionally does NOT contain:

    * network requests
    * React components
    * account or source persistence
*/

export type FederationFamily =
  | 'audio'
  | 'video'
  | 'longform'
  | 'microblog'
  | 'photo'
  | 'books'
  | 'bookmarks'
  | 'groups'
  | 'events'
  | 'local'
  | 'generic';

export type FederationConfidence = 'software' | 'object' | 'unknown';
export type FederationPrimaryAction = 'play' | 'read' | 'reply' | 'view' | 'join' | 'rsvp' | 'open';

export interface FederationPlatformClassification {
  platform: string;
  label: string;
  family: FederationFamily;
  confidence: FederationConfidence;
}

export interface FederationRenderHint {
  layout: 'player' | 'article' | 'status' | 'gallery' | 'book' | 'link' | 'community' | 'event' | 'generic';
  primaryAction: FederationPrimaryAction;
}

type JsonRecord = Record<string, unknown>;

type PlatformBase = Omit<FederationPlatformClassification, 'confidence'>;

export const FEDERATION_RENDER_HINTS: Record<FederationFamily, FederationRenderHint> = {
  audio: { layout: 'player', primaryAction: 'play' },
  video: { layout: 'player', primaryAction: 'play' },
  longform: { layout: 'article', primaryAction: 'read' },
  microblog: { layout: 'status', primaryAction: 'reply' },
  photo: { layout: 'gallery', primaryAction: 'view' },
  books: { layout: 'book', primaryAction: 'open' },
  bookmarks: { layout: 'link', primaryAction: 'open' },
  groups: { layout: 'community', primaryAction: 'join' },
  events: { layout: 'event', primaryAction: 'rsvp' },
  local: { layout: 'community', primaryAction: 'open' },
  generic: { layout: 'generic', primaryAction: 'open' },
};

export function normalizeFederationFamily(value: unknown): FederationFamily {
  if (typeof value === 'string' && value in FEDERATION_RENDER_HINTS) {
    return value as FederationFamily;
  }

  return 'generic';
}

export const FEDERATION_PLATFORM_FIXTURES: Array<{ software: string; family: FederationFamily }> = [
  { software: 'Funkwhale', family: 'audio' },
  { software: 'WordPress', family: 'longform' },
  { software: 'WriteFreely', family: 'longform' },
  { software: 'GoToSocial', family: 'microblog' },
  { software: 'Iceshrimp', family: 'microblog' },
  { software: 'snac', family: 'microblog' },
  { software: 'Pixelfed', family: 'photo' },
  { software: 'Mitra', family: 'microblog' },
  { software: 'Owncast', family: 'video' },
  { software: 'Misskey', family: 'microblog' },
  { software: 'Sharkey', family: 'microblog' },
  { software: 'BookWyrm', family: 'books' },
  { software: 'Postmarks', family: 'bookmarks' },
  { software: 'wafrn', family: 'microblog' },
  { software: 'Castopod', family: 'audio' },
  { software: 'Lemmy', family: 'groups' },
  { software: 'Lotide', family: 'groups' },
  { software: 'Local', family: 'local' },
  { software: 'Bonfire', family: 'groups' },
  { software: 'Kbin', family: 'groups' },
  { software: 'Discourse', family: 'groups' },
  { software: 'Mbin', family: 'groups' },
  { software: 'Mobilizon', family: 'events' },
  { software: 'NodeBB', family: 'groups' },
  { software: 'PieFed', family: 'groups' },
  { software: 'FediGroups', family: 'groups' },
  { software: 'Fedibird Group', family: 'groups' },
  { software: 'AP-Groups', family: 'groups' },
  { software: 'BuzzRelay', family: 'groups' },
  { software: 'Guppe', family: 'groups' },
  { software: 'Flipboard', family: 'longform' },
  { software: 'Elgg', family: 'groups' },
  { software: 'Friendica', family: 'groups' },
  { software: 'Gancio', family: 'events' },
  { software: 'Hubzilla', family: 'groups' },
  { software: 'PeerTube', family: 'video' },
  { software: 'WordPress Event Bridge', family: 'events' },
  { software: 'Mastodon', family: 'microblog' },
  { software: 'Pleroma', family: 'microblog' },
];

const SOFTWARE: Record<string, PlatformBase> = {
  'ap groups': { platform: 'ap_groups', label: 'AP-Groups', family: 'groups' },
  bookwyrm: { platform: 'bookwyrm', label: 'BookWyrm', family: 'books' },
  bonfire: { platform: 'bonfire', label: 'Bonfire', family: 'groups' },
  buzzrelay: { platform: 'buzzrelay', label: 'BuzzRelay', family: 'groups' },
  castopod: { platform: 'castopod', label: 'Castopod', family: 'audio' },
  discourse: { platform: 'discourse', label: 'Discourse', family: 'groups' },
  elgg: { platform: 'elgg', label: 'Elgg', family: 'groups' },
  'fedibird group': { platform: 'fedibird_group', label: 'Fedibird Group', family: 'groups' },
  fedigroup: { platform: 'fedigroups', label: 'FediGroups', family: 'groups' },
  fedigroups: { platform: 'fedigroups', label: 'FediGroups', family: 'groups' },
  flipboard: { platform: 'flipboard', label: 'Flipboard', family: 'longform' },
  friendica: { platform: 'friendica', label: 'Friendica', family: 'groups' },
  funkwhale: { platform: 'funkwhale', label: 'Funkwhale', family: 'audio' },
  gancio: { platform: 'gancio', label: 'Gancio', family: 'events' },
  gotosocial: { platform: 'gotosocial', label: 'GoToSocial', family: 'microblog' },
  'group actor': { platform: 'group_actor', label: 'Group Actor', family: 'groups' },
  guppe: { platform: 'guppe', label: 'Guppe', family: 'groups' },
  hubzilla: { platform: 'hubzilla', label: 'Hubzilla', family: 'groups' },
  iceshrimp: { platform: 'iceshrimp', label: 'Iceshrimp', family: 'microblog' },
  kbin: { platform: 'kbin', label: 'Kbin', family: 'groups' },
  lemmy: { platform: 'lemmy', label: 'Lemmy', family: 'groups' },
  local: { platform: 'local', label: 'Local', family: 'local' },
  lotide: { platform: 'lotide', label: 'Lotide', family: 'groups' },
  mastodon: { platform: 'mastodon', label: 'Mastodon', family: 'microblog' },
  mbin: { platform: 'mbin', label: 'Mbin', family: 'groups' },
  misskey: { platform: 'misskey', label: 'Misskey', family: 'microblog' },
  mitra: { platform: 'mitra', label: 'Mitra', family: 'microblog' },
  mobilizon: { platform: 'mobilizon', label: 'Mobilizon', family: 'events' },
  nodebb: { platform: 'nodebb', label: 'NodeBB', family: 'groups' },
  owncast: { platform: 'owncast', label: 'Owncast', family: 'video' },
  peertube: { platform: 'peertube', label: 'PeerTube', family: 'video' },
  piefed: { platform: 'piefed', label: 'PieFed', family: 'groups' },
  pixelfed: { platform: 'pixelfed', label: 'Pixelfed', family: 'photo' },
  pleroma: { platform: 'pleroma', label: 'Pleroma/Akkoma', family: 'microblog' },
  postmarks: { platform: 'postmarks', label: 'Postmarks', family: 'bookmarks' },
  sharkey: { platform: 'sharkey', label: 'Sharkey', family: 'microblog' },
  snac: { platform: 'snac', label: 'snac', family: 'microblog' },
  smithereen: { platform: 'smithereen', label: 'Smithereen', family: 'groups' },
  'streams forte': { platform: 'streams_forte', label: 'Streams/Forte', family: 'groups' },
  tootgroup: { platform: 'tootgroup', label: 'tootgroup.py', family: 'groups' },
  wafrn: { platform: 'wafrn', label: 'wafrn', family: 'microblog' },
  'wordpress event bridge': { platform: 'wordpress_event_bridge', label: 'WordPress Event Bridge', family: 'events' },
  wordpress: { platform: 'wordpress', label: 'WordPress', family: 'longform' },
  writefreely: { platform: 'writefreely', label: 'WriteFreely', family: 'longform' },
};

const OBJECT_TYPES: Record<string, PlatformBase> = {
  Article: { platform: 'activitypub-article', label: 'Article', family: 'longform' },
  Audio: { platform: 'activitypub-audio', label: 'Audio', family: 'audio' },
  Event: { platform: 'activitypub-event', label: 'Event', family: 'events' },
  Group: { platform: 'activitypub-group', label: 'Group', family: 'groups' },
  Image: { platform: 'activitypub-image', label: 'Image', family: 'photo' },
  Note: { platform: 'activitypub-note', label: 'Note', family: 'microblog' },
  Page: { platform: 'activitypub-page', label: 'Page', family: 'longform' },
  Question: { platform: 'activitypub-question', label: 'Question', family: 'groups' },
  Video: { platform: 'activitypub-video', label: 'Video', family: 'video' },
};

export function classifyFederationPlatform(input: unknown): FederationPlatformClassification {
  if (typeof input === 'string') {
    return withConfidence(lookupSoftware(input), 'software') ?? unknown();
  }

  if (!isRecord(input)) {
    return unknown();
  }

  return withConfidence(findSoftwareClassification(input), 'software')
    ?? withConfidence(findObjectClassification(input), 'object')
    ?? unknown();
}

function findSoftwareClassification(input: JsonRecord): PlatformBase | undefined {
  for (const name of softwareNames(input)) {
    const classification = lookupSoftware(name);

    if (classification) {
      return classification;
    }
  }
}

function findObjectClassification(input: JsonRecord): PlatformBase | undefined {
  const type = getPath(input, ['type'])
    ?? getPath(input, ['object', 'type'])
    ?? getPath(input, ['activity', 'object', 'type']);

  return typeof type === 'string' ? OBJECT_TYPES[type] : undefined;
}

function lookupSoftware(name: string): PlatformBase | undefined {
  const normalized = normalizeName(name);

  return SOFTWARE[normalized]
    ?? normalized.split(' ').map((token) => SOFTWARE[token]).find(Boolean);
}

function softwareNames(input: JsonRecord): string[] {
  return [
    getPath(input, ['software', 'name']),
    getPath(input, ['nodeinfo', 'software', 'name']),
    getPath(input, ['metadata', 'software', 'name']),
    getPath(input, ['platform']),
    getPath(input, ['application']),
    getPath(input, ['generator']),
  ].flatMap(nameCandidates);
}

function nameCandidates(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (!isRecord(value)) {
    return [];
  }

  return [
    getPath(value, ['name']),
    getPath(value, ['type']),
    getPath(value, ['id']),
  ].flatMap(nameCandidates);
}

function normalizeName(name: string): string {
  return name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getPath(input: unknown, path: string[]): unknown {
  let current = input;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function withConfidence(
  classification: PlatformBase | undefined,
  confidence: FederationConfidence,
): FederationPlatformClassification | undefined {
  return classification ? { ...classification, confidence } : undefined;
}

function unknown(): FederationPlatformClassification {
  return {
    platform: 'unknown',
    label: 'Unknown',
    family: 'generic',
    confidence: 'unknown',
  };
}

function isRecord(input: unknown): input is JsonRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

/* end of src/features/federation/platform.ts */
