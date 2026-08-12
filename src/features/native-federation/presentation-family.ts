/*
 * Project: Unfathomably FE
 *
 * File: native-federation/presentation-family.ts
 *
 * Purpose:
 *   Classify a bounded native presentation from structural federation data.
 *
 * Responsibilities:
 *   - honor an explicit backend-provided native family
 *   - map verified platform identifiers to their product family
 *   - fall back to the ActivityPub object's concrete type
 *
 * This file intentionally does NOT inspect canonical IDs, hostnames, titles,
 * summaries, URLs, or arbitrary metadata text.
 */

type PresentationFamily = 'all' | 'audio' | 'video' | 'longform' | 'photo' | 'books' | 'bookmarks' | 'groups' | 'events' | 'development' | 'models' | 'marketplace' | 'games' | 'routes' | 'culture' | 'coordination' | 'publishing';
type ClassifiedPresentationFamily = Exclude<PresentationFamily, 'all'>;
type NativePresentation = Record<string, unknown>;

const familyAliases: Record<string, ClassifiedPresentationFamily> = {
  audio: 'audio',
  video: 'video',
  longform: 'longform',
  photo: 'photo',
  books: 'books',
  bookmarks: 'bookmarks',
  groups: 'groups',
  events: 'events',
  development: 'development',
  software: 'development',
  models: 'models',
  marketplace: 'marketplace',
  markets: 'marketplace',
  games: 'games',
  routes: 'routes',
  culture: 'culture',
  coordination: 'coordination',
  publishing: 'publishing',
};

const platformFamilies: Record<string, ClassifiedPresentationFamily> = {
  activitypub_album: 'audio',
  activitypub_article: 'longform',
  activitypub_audio: 'audio',
  activitypub_chapter: 'publishing',
  activitypub_document: 'publishing',
  activitypub_event: 'events',
  activitypub_game: 'games',
  activitypub_group: 'groups',
  activitypub_image: 'photo',
  activitypub_livestream: 'video',
  activitypub_model: 'models',
  activitypub_page: 'longform',
  activitypub_podcast: 'audio',
  activitypub_publication: 'publishing',
  activitypub_route: 'routes',
  activitypub_track: 'audio',
  activitypub_video: 'video',
  activitypods: 'coordination',
  ap_groups: 'groups',
  bonfire: 'groups',
  bonfire_valueflows: 'coordination',
  bookwyrm: 'books',
  castling: 'games',
  castling_club: 'games',
  castopod: 'audio',
  commonspub: 'publishing',
  buzzrelay: 'groups',
  discourse: 'groups',
  elgg: 'groups',
  fedibird_group: 'groups',
  fedigroups: 'groups',
  flipboard: 'longform',
  flohmarkt: 'marketplace',
  forgefed: 'development',
  forgejo: 'development',
  friendica: 'groups',
  funkwhale: 'audio',
  gancio: 'events',
  gitea: 'development',
  gitlab: 'development',
  group_actor: 'groups',
  guppe: 'groups',
  hubzilla: 'groups',
  ibis: 'publishing',
  kbin: 'groups',
  lemmy: 'groups',
  lotide: 'groups',
  manyfold: 'models',
  mbin: 'groups',
  mobilizon: 'events',
  mutual_aid: 'coordination',
  neodb: 'culture',
  nodebb: 'groups',
  owncast: 'video',
  peertube: 'video',
  piefed: 'groups',
  pixelfed: 'photo',
  postmarks: 'bookmarks',
  rss: 'longform',
  smithereen: 'groups',
  streams_forte: 'groups',
  tootgroup: 'groups',
  vervis: 'development',
  wanderer: 'routes',
  wordpress: 'longform',
  wordpress_event_bridge: 'events',
  writefreely: 'longform',
  xwiki: 'publishing',
  zenpub: 'publishing',
};

const objectTypeFamilies: Record<string, ClassifiedPresentationFamily> = {
  album: 'audio',
  article: 'longform',
  audio: 'audio',
  author: 'books',
  book: 'books',
  booklist: 'books',
  branch: 'development',
  chapter: 'publishing',
  commit: 'development',
  document: 'publishing',
  edition: 'books',
  event: 'events',
  game: 'games',
  group: 'groups',
  image: 'photo',
  issue: 'development',
  livestream: 'video',
  mergerrequest: 'development',
  model: 'models',
  page: 'longform',
  patch: 'development',
  podcastepisode: 'audio',
  project: 'development',
  proposal: 'development',
  publication: 'publishing',
  push: 'development',
  question: 'groups',
  quotation: 'books',
  rating: 'books',
  review: 'books',
  repository: 'development',
  route: 'routes',
  shelf: 'books',
  threedmodel: 'models',
  ticket: 'development',
  ticketdependency: 'development',
  track: 'audio',
  video: 'video',
  work: 'books',
};

const stringValue = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;

const identifier = (value: unknown): string | null => {
  const text = stringValue(value);
  return text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : null;
};

const objectTypeIdentifier = (value: unknown): string | null => {
  const text = stringValue(value);
  if (!text) return null;

  const valueFlowsType = text.match(/^(?:ValueFlows:|https:\/\/w3id\.org\/valueflows#)([A-Za-z]+)$/);
  if (valueFlowsType) return `valueflows:${valueFlowsType[1].toLowerCase()}`;

  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
};

const nativeCoordinationType = (value: unknown): boolean => {
  const type = stringValue(value);

  return type === 'pair:Project'
    || type === 'http://virtual-assembly.org/ontologies/pair#Project'
    || type === 'maid:Offer'
    || type === 'maid:Request'
    || type === 'https://mutual-aid.app/ns/core#Offer'
    || type === 'https://mutual-aid.app/ns/core#Request';
};

const classifyNativePresentation = (presentation: NativePresentation): ClassifiedPresentationFamily | null => {
  const fields = presentation.fields && typeof presentation.fields === 'object'
    ? presentation.fields as Record<string, unknown>
    : {};

  const explicitFamily = identifier(fields.family ?? presentation.family);
  if (explicitFamily && familyAliases[explicitFamily]) return familyAliases[explicitFamily];

  const platform = identifier(fields.platform ?? presentation.platform);
  if (platform && platformFamilies[platform]) return platformFamilies[platform];

  if (nativeCoordinationType(presentation.type)) return 'coordination';

  const type = objectTypeIdentifier(presentation.type);
  if (type?.startsWith('valueflows:')) return 'coordination';
  if (type && objectTypeFamilies[type]) return objectTypeFamilies[type];

  return null;
};

export { classifyNativePresentation };
export type { NativePresentation, PresentationFamily };

/* end of src/features/native-federation/presentation-family.ts */
