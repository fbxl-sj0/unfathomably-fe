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
  | 'models'
  | 'games'
  | 'marketplace'
  | 'culture'
  | 'books'
  | 'bookmarks'
  | 'groups'
  | 'events'
  | 'development'
  | 'coordination'
  | 'publishing'
  | 'routes'
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
  layout: 'player' | 'article' | 'status' | 'gallery' | 'model' | 'game' | 'listing' | 'catalog' | 'book' | 'link' | 'community' | 'event' | 'development' | 'coordination' | 'resource' | 'route' | 'generic';
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
  models: { layout: 'model', primaryAction: 'view' },
  games: { layout: 'game', primaryAction: 'open' },
  marketplace: { layout: 'listing', primaryAction: 'open' },
  culture: { layout: 'catalog', primaryAction: 'open' },
  books: { layout: 'book', primaryAction: 'open' },
  bookmarks: { layout: 'link', primaryAction: 'open' },
  groups: { layout: 'community', primaryAction: 'join' },
  events: { layout: 'event', primaryAction: 'rsvp' },
  development: { layout: 'development', primaryAction: 'open' },
  coordination: { layout: 'coordination', primaryAction: 'open' },
  publishing: { layout: 'resource', primaryAction: 'open' },
  routes: { layout: 'route', primaryAction: 'open' },
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
  { software: 'ActivityPods', family: 'coordination' },
  { software: 'Funkwhale', family: 'audio' },
  { software: 'WordPress', family: 'longform' },
  { software: 'WriteFreely', family: 'longform' },
  { software: 'GoToSocial', family: 'microblog' },
  { software: 'Iceshrimp', family: 'microblog' },
  { software: 'snac', family: 'microblog' },
  { software: 'Pixelfed', family: 'photo' },
  { software: 'Manyfold', family: 'models' },
  { software: 'Castling.club', family: 'games' },
  { software: 'Flohmarkt', family: 'marketplace' },
  { software: 'Mitra', family: 'microblog' },
  { software: 'Owncast', family: 'video' },
  { software: 'Misskey', family: 'microblog' },
  { software: 'Sharkey', family: 'microblog' },
  { software: 'NeoDB', family: 'culture' },
  { software: 'BookWyrm', family: 'books' },
  { software: 'ForgeFed', family: 'development' },
  { software: 'Bonfire ValueFlows', family: 'coordination' },
  { software: 'CommonsPub', family: 'publishing' },
  { software: 'ZenPub', family: 'publishing' },
  { software: 'Vervis', family: 'development' },
  { software: 'Postmarks', family: 'bookmarks' },
  { software: 'wafrn', family: 'microblog' },
  { software: 'Wanderer', family: 'routes' },
  { software: 'XWiki', family: 'publishing' },
  { software: 'Castopod', family: 'audio' },
  { software: 'Lemmy', family: 'groups' },
  { software: 'Lotide', family: 'groups' },
  { software: 'Local', family: 'local' },
  { software: 'Bonfire', family: 'groups' },
  { software: 'Kbin', family: 'groups' },
  { software: 'Discourse', family: 'groups' },
  { software: 'Mbin', family: 'groups' },
  { software: 'Mobilizon', family: 'events' },
  { software: 'Mutual Aid', family: 'marketplace' },
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
  activitypods: { platform: 'activitypods', label: 'ActivityPods', family: 'coordination' },
  bookwyrm: { platform: 'bookwyrm', label: 'BookWyrm', family: 'books' },
  forgefed: { platform: 'forgefed', label: 'ForgeFed', family: 'development' },
  bonfire: { platform: 'bonfire', label: 'Bonfire', family: 'groups' },
  'bonfire valueflows': { platform: 'bonfire_valueflows', label: 'Bonfire ValueFlows', family: 'coordination' },
  commonspub: { platform: 'zenpub', label: 'ZenPub/CommonsPub', family: 'publishing' },
  buzzrelay: { platform: 'buzzrelay', label: 'BuzzRelay', family: 'groups' },
  castopod: { platform: 'castopod', label: 'Castopod', family: 'audio' },
  castling: { platform: 'castling', label: 'Castling.club', family: 'games' },
  'castling club': { platform: 'castling', label: 'Castling.club', family: 'games' },
  discourse: { platform: 'discourse', label: 'Discourse', family: 'groups' },
  elgg: { platform: 'elgg', label: 'Elgg', family: 'groups' },
  'fedibird group': { platform: 'fedibird_group', label: 'Fedibird Group', family: 'groups' },
  fedigroup: { platform: 'fedigroups', label: 'FediGroups', family: 'groups' },
  fedigroups: { platform: 'fedigroups', label: 'FediGroups', family: 'groups' },
  flipboard: { platform: 'flipboard', label: 'Flipboard', family: 'longform' },
  flohmarkt: { platform: 'flohmarkt', label: 'Flohmarkt', family: 'marketplace' },
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
  manyfold: { platform: 'manyfold', label: 'Manyfold', family: 'models' },
  mbin: { platform: 'mbin', label: 'Mbin', family: 'groups' },
  misskey: { platform: 'misskey', label: 'Misskey', family: 'microblog' },
  mitra: { platform: 'mitra', label: 'Mitra', family: 'microblog' },
  mobilizon: { platform: 'mobilizon', label: 'Mobilizon', family: 'events' },
  'mutual aid': { platform: 'mutual_aid', label: 'Mutual Aid', family: 'marketplace' },
  neodb: { platform: 'neodb', label: 'NeoDB', family: 'culture' },
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
  wanderer: { platform: 'wanderer', label: 'Wanderer', family: 'routes' },
  vervis: { platform: 'vervis', label: 'Vervis', family: 'development' },
  'wordpress event bridge': { platform: 'wordpress_event_bridge', label: 'WordPress Event Bridge', family: 'events' },
  wordpress: { platform: 'wordpress', label: 'WordPress', family: 'longform' },
  writefreely: { platform: 'writefreely', label: 'WriteFreely', family: 'longform' },
  xwiki: { platform: 'xwiki', label: 'XWiki', family: 'publishing' },
  zenpub: { platform: 'zenpub', label: 'ZenPub', family: 'publishing' },
};

const OBJECT_TYPES: Record<string, PlatformBase> = {
  Article: { platform: 'activitypub-article', label: 'Article', family: 'longform' },
  Author: { platform: 'bookwyrm', label: 'BookWyrm author', family: 'books' },
  Audio: { platform: 'activitypub-audio', label: 'Audio', family: 'audio' },
  Book: { platform: 'bookwyrm', label: 'Book', family: 'books' },
  BookList: { platform: 'bookwyrm', label: 'Book list', family: 'books' },
  Branch: { platform: 'forgefed', label: 'Branch', family: 'development' },
  Comment: { platform: 'bookwyrm', label: 'Book comment', family: 'books' },
  Commit: { platform: 'forgefed', label: 'Commit', family: 'development' },
  Edition: { platform: 'bookwyrm', label: 'Book edition', family: 'books' },
  Document: { platform: 'activitypub-document', label: 'Document', family: 'publishing' },
  Event: { platform: 'activitypub-event', label: 'Event', family: 'events' },
  Group: { platform: 'activitypub-group', label: 'Group', family: 'groups' },
  Image: { platform: 'activitypub-image', label: 'Image', family: 'photo' },
  Issue: { platform: 'forgefed', label: 'Issue', family: 'development' },
  MergeRequest: { platform: 'forgefed', label: 'Merge request', family: 'development' },
  Note: { platform: 'activitypub-note', label: 'Note', family: 'microblog' },
  Page: { platform: 'activitypub-page', label: 'Page', family: 'longform' },
  Patch: { platform: 'forgefed', label: 'Patch', family: 'development' },
  Proposal: { platform: 'forgefed', label: 'Proposal', family: 'development' },
  Push: { platform: 'forgefed', label: 'Push', family: 'development' },
  Question: { platform: 'activitypub-question', label: 'Question', family: 'groups' },
  Quotation: { platform: 'bookwyrm', label: 'Book quotation', family: 'books' },
  Rating: { platform: 'bookwyrm', label: 'Book rating', family: 'books' },
  Review: { platform: 'bookwyrm', label: 'Book review', family: 'books' },
  Shelf: { platform: 'bookwyrm', label: 'Book shelf', family: 'books' },
  Ticket: { platform: 'forgefed', label: 'Ticket', family: 'development' },
  TicketDependency: { platform: 'forgefed', label: 'Ticket dependency', family: 'development' },
  Video: { platform: 'activitypub-video', label: 'Video', family: 'video' },
  Work: { platform: 'bookwyrm', label: 'Book work', family: 'books' },
  'pair:Project': { platform: 'activitypods', label: 'ActivityPods project', family: 'coordination' },
  'http://virtual-assembly.org/ontologies/pair#Project': { platform: 'activitypods', label: 'ActivityPods project', family: 'coordination' },
  'maid:Offer': { platform: 'mutual_aid', label: 'Mutual Aid Offer', family: 'marketplace' },
  'maid:Request': { platform: 'mutual_aid', label: 'Mutual Aid Request', family: 'marketplace' },
  'https://mutual-aid.app/ns/core#Offer': { platform: 'mutual_aid', label: 'Mutual Aid Offer', family: 'marketplace' },
  'https://mutual-aid.app/ns/core#Request': { platform: 'mutual_aid', label: 'Mutual Aid Request', family: 'marketplace' },
};

const CONCRETE_TYPES: Record<string, PlatformBase> = {
  '3DModel': { platform: 'manyfold', label: '3D model', family: 'models' },
  Collection: { platform: 'manyfold', label: 'Model collection', family: 'models' },
  Creator: { platform: 'manyfold', label: 'Model creator', family: 'models' },
  User: { platform: 'manyfold', label: 'Manyfold user', family: 'models' },
};

const VALUEFLOWS_TYPES = new Set([
  'Claim',
  'Commitment',
  'EconomicEvent',
  'EconomicResource',
  'Intent',
  'Measure',
  'Need',
  'Offer',
  'Process',
  'ProcessSpecification',
  'Proposal',
  'ProposedIntent',
  'ProposedTo',
  'ResourceSpecification',
  'Unit',
]);

const MAX_TYPE_CANDIDATES = 32;
const MAX_TYPE_LENGTH = 512;

export function classifyFederationPlatform(input: unknown): FederationPlatformClassification {
  if (typeof input === 'string') {
    return withConfidence(lookupSoftware(input), 'software') ?? unknown();
  }

  if (!isRecord(input)) {
    return unknown();
  }

  return withConfidence(findNativeFamilyClassification(input), 'object')
    ?? withConfidence(findSoftwareClassification(input), 'software')
    ?? withConfidence(findObjectClassification(input), 'object')
    ?? unknown();
}

function findNativeFamilyClassification(input: JsonRecord): PlatformBase | undefined {
  const candidates = [
    getPath(input, ['pleroma', 'native', 'fields']),
    getPath(input, ['native', 'fields']),
    getPath(input, ['source', 'pleroma', 'native', 'fields']),
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate) || typeof candidate.family !== 'string') continue;

    const family = normalizeFederationFamily(candidate.family);

    if (family !== 'generic') {
      return {
        platform: typeof candidate.platform === 'string' ? candidate.platform : 'unfathomably',
        label: 'Unfathomably native',
        family,
      };
    }
  }
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
  const concreteTypes = [
    getPath(input, ['f3di:concreteType']),
    getPath(input, ['object', 'f3di:concreteType']),
    getPath(input, ['activity', 'object', 'f3di:concreteType']),
    getPath(input, ['native', 'type']),
    getPath(input, ['pleroma', 'native', 'type']),
    getPath(input, ['source', 'pleroma', 'native', 'type']),
  ];

  for (const type of concreteTypes.flatMap(typeCandidates)) {
    if (CONCRETE_TYPES[type]) {
      return CONCRETE_TYPES[type];
    }
  }

  const objectTypes = [
    getPath(input, ['type']),
    getPath(input, ['object', 'type']),
    getPath(input, ['activity', 'object', 'type']),
  ];

  let best: { classification: PlatformBase; priority: number } | undefined;

  for (const type of objectTypes.flatMap(typeCandidates)) {
    const classification = classifyObjectType(type);

    if (!classification) continue;

    const priority = objectTypePriority(type, classification);

    if (!best || priority > best.priority) {
      best = { classification, priority };
    }
  }

  return best?.classification;
}

function classifyObjectType(type: string): PlatformBase | undefined {
  const valueflowsType = valueflowsTypeName(type);

  if (valueflowsType) {
    return {
      platform: 'bonfire_valueflows',
      label: `ValueFlows ${valueflowsType}`,
      family: 'coordination',
    };
  }

  return OBJECT_TYPES[type];
}

function objectTypePriority(type: string, classification: PlatformBase): number {
  if (type.includes(':')) return 3;
  if (!classification.platform.startsWith('activitypub-')) return 2;
  return 1;
}

function typeCandidates(value: unknown): string[] {
  const candidates = Array.isArray(value) ? value.slice(0, MAX_TYPE_CANDIDATES) : [value];

  return candidates.filter(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.length <= MAX_TYPE_LENGTH,
  );
}

function valueflowsTypeName(type: string) {
  const prefixes = ['ValueFlows:', 'https://w3id.org/valueflows#'];
  const prefix = prefixes.find((candidate) => type.startsWith(candidate));

  if (!prefix) {
    return;
  }

  const name = type.slice(prefix.length);

  return VALUEFLOWS_TYPES.has(name) ? name : undefined;
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
    getPath(input, ['pleroma', 'native', 'fields', 'platform']),
    getPath(input, ['native', 'fields', 'platform']),
    getPath(input, ['source', 'pleroma', 'native', 'fields', 'platform']),
  ].flatMap(nameCandidates);
}

function nameCandidates(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_TYPE_CANDIDATES).flatMap(nameCandidates);
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
