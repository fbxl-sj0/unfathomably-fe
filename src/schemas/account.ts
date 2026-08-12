/*
 * Unfathomably FE
 * File: account.ts
 * Purpose: Validate account API data and derive stable presentation fields.
 * This file intentionally does not fetch accounts or render profile UI.
 */

import DOMPurify from 'isomorphic-dompurify';
import * as nip19 from 'nostr-tools/nip19';
import * as z from '@/zod.ts';

import avatarMissing from '@/assets/images/avatar-missing.png';
import headerMissing from '@/assets/images/header-missing.png';

import { customEmojiSchema } from './custom-emoji.ts';
import { federationStatusSchema, Relationship } from './relationship.ts';
import { identityProofSchema } from './identity-proof.ts';
import { nativeActivityPresentationSchema } from './native-activity.ts';
import { coerceObject, contentSchema, filteredArray, nostrIdSchema } from './utils.ts';

import type { Resolve } from '@/utils/types.ts';

const birthdaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const hexSchema = z.string().regex(/^#[a-f0-9]{6}$/i);

const fieldSchema = z.object({
  name: z.string(),
  value: z.string(),
  verified_at: z.string().datetime().nullable().catch(null),
});

const roleSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch(''),
  color: hexSchema.catch(''),
  highlighted: z.boolean().catch(true),
});

const nostrExternalIdentitySchema = z.object({
  platform: z.string(),
  identity: z.string(),
  proof: z.string(),
});

const nostrBirthdaySchema = z.object({
  year: z.number().int().optional().catch(undefined),
  month: z.number().int().optional().catch(undefined),
  day: z.number().int().optional().catch(undefined),
});

const nostrStatusSchema = z.object({
  type: z.string(),
  content: z.string(),
  url: z.string().optional().catch(undefined),
  profile: z.string().optional().catch(undefined),
  event: z.string().optional().catch(undefined),
  address: z.string().optional().catch(undefined),
  expires_at: z.string().datetime().optional().catch(undefined),
  created_at: z.string().datetime().optional().catch(undefined),
  event_id: z.string().optional().catch(undefined),
});

const nostrBadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().catch(undefined),
  image: z.string().url().optional().catch(undefined),
  thumbnail: z.string().url().optional().catch(undefined),
  issuer: nostrIdSchema,
  award_event_id: nostrIdSchema,
});

const nostrIdentitySchema = coerceObject({
  badges: filteredArray(nostrBadgeSchema),
  birthday: nostrBirthdaySchema.optional().catch(undefined),
  external_identities: filteredArray(nostrExternalIdentitySchema),
  group_id: z.string().optional().catch(undefined),
  kind: z.string().optional().catch(undefined),
  lud06: z.string().optional().catch(undefined),
  lud16: z.string().email().optional().catch(undefined),
  nprofile: z.string().optional().catch(undefined),
  npub: z.string().optional().catch(undefined),
  nip05: z.string().optional().catch(undefined),
  pubkey: nostrIdSchema.optional().catch(undefined),
  relay: z.string().optional().catch(undefined),
  relays: z.array(z.string()).catch([]),
  statuses: filteredArray(nostrStatusSchema),
  website: z.string().url().optional().catch(undefined),
}).transform((identity) => {
  let displayAddress = identity.nip05;

  if (displayAddress?.startsWith('_@')) {
    displayAddress = displayAddress.slice(2);
  }

  if (!displayAddress && identity.npub) {
    displayAddress = identity.npub;
  }

  if (!displayAddress && identity.pubkey) {
    displayAddress = nip19.npubEncode(identity.pubkey);
  }

  return {
    ...identity,
    display_address: displayAddress,
  };
});

const atprotoIdentitySchema = z.object({
  did: z.string().startsWith('did:'),
  handle: z.string().optional().catch(undefined),
  pds: z.string().url().optional().catch(undefined),
  profile_url: z.string().url().optional().catch(undefined),
  mirror: z.boolean().catch(false),
}).optional().catch(undefined);

const diasporaIdentitySchema = z.object({
  id: z.string(),
  guid: z.string(),
  pod: z.string().url().optional().catch(undefined),
  profile_url: z.string().url().optional().catch(undefined),
  mirror: z.boolean().catch(false),
}).optional().catch(undefined);

const baseAccountSchema = z.object({
  acct: z.string().catch(''),
  avatar: z.string().catch(avatarMissing),
  avatar_description: z.string().catch(''),
  avatar_static: z.string().url().optional().catch(undefined),
  bot: z.boolean().catch(false),
  created_at: z.string().datetime().catch(new Date().toUTCString()),
  discoverable: z.boolean().catch(false),
  indexable: z.boolean().optional().catch(undefined),
  display_name: z.string().catch(''),
  ditto: coerceObject({
    accepts_zaps: z.boolean().catch(false),
    accepts_zaps_cashu: z.boolean().catch(false),
    external_url: z.string().optional().catch(undefined),
    streak: coerceObject({
      days: z.number().catch(0),
      start: z.string().datetime().nullable().catch(null),
      end: z.string().datetime().nullable().catch(null),
    }),
  }),
  domain: z.string().optional().catch(undefined),
  emojis: filteredArray(customEmojiSchema),
  fields: filteredArray(fieldSchema),
  followers_count: z.number().catch(0),
  following_count: z.number().catch(0),
  fqn: z.string().optional().catch(undefined),
  header: z.string().url().catch(headerMissing),
  header_description: z.string().catch(''),
  header_static: z.string().url().optional().catch(undefined),
  id: z.string(),
  last_status_at: z.string().datetime().optional().catch(undefined),
  local: z.boolean().catch(false),
  location: z.string().optional().catch(undefined),
  locked: z.boolean().catch(false),
  moved: z.literal(null).catch(null),
  mute_expires_at: z.union([
    z.string(),
    z.null(),
  ]).catch(null),
  nostr: nostrIdentitySchema,
  atproto: atprotoIdentitySchema,
  diaspora: diasporaIdentitySchema,
  note: contentSchema,
  /** Fedibird extra settings. */
  other_settings: z.object({
    birthday: birthdaySchema.nullish().catch(undefined),
    location: z.string().optional().catch(undefined),
  }).optional().catch(undefined),
  pleroma: coerceObject({
    accepts_chat_messages: z.boolean().catch(false),
    accepts_email_list: z.boolean().catch(false),
    actor_types: z.array(z.string()).catch([]),
    also_known_as: z.array(z.string().url()).catch([]),
    ap_id: z.string().url().optional().catch(undefined),
    birthday: birthdaySchema.nullish().catch(undefined),
    deactivated: z.boolean().catch(false),
    favicon: z.string().url().optional().catch(undefined),
    federation: federationStatusSchema.optional().catch(undefined),
    hide_favorites: z.boolean().catch(false),
    hide_followers: z.boolean().catch(false),
    hide_followers_count: z.boolean().catch(false),
    hide_follows: z.boolean().catch(false),
    hide_follows_count: z.boolean().catch(false),
    identity_proofs: filteredArray(identityProofSchema),
    is_admin: z.boolean().catch(false),
    is_local: z.boolean().optional().catch(undefined),
    is_moderator: z.boolean().catch(false),
    is_suggested: z.boolean().catch(false),
    location: z.string().optional().catch(undefined),
    moved_to: z.string().url().nullish().catch(undefined),
    native: nativeActivityPresentationSchema,
    notification_settings: coerceObject({
      block_from_strangers: z.boolean().catch(false),
    }),
    tags: z.array(z.string()).catch([]),
  }),
  roles: filteredArray(roleSchema),
  source: z.object({
    approved: z.boolean().catch(true),
    chats_onboarded: z.boolean().catch(true),
    fields: filteredArray(fieldSchema),
    note: z.string().catch(''),
    pleroma: z.object({
      actor_type: z.string().catch('Person'),
      actor_types: z.array(z.string()).catch([]),
      discoverable: z.boolean().catch(true),
      indexable: z.boolean().nullable().catch(null),
    }).optional().catch(undefined),
    sms_verified: z.boolean().catch(false),
    nostr: z.object({
      nip05: z.string().optional().catch(undefined),
    }).optional().catch(undefined),
    ditto: coerceObject({
      captcha_solved: z.boolean().catch(true),
    }),
  }).optional().catch(undefined),
  statuses_count: z.number().catch(0),
  suspended: z.boolean().catch(false),
  uri: z.string().url().catch(''),
  url: z.string().url(),
  username: z.string().catch(''),
  verified: z.boolean().catch(false),
  website: z.string().catch(''),
});

type BaseAccount = z.infer<typeof baseAccountSchema>;
type TransformableAccount = Omit<BaseAccount, 'moved'>;

const getDomain = (url: string) => {
  try {
    return new URL(url).host;
  } catch (e) {
    return '';
  }
};

const filterBadges = (tags?: string[]) =>
  tags?.filter(tag => tag.startsWith('badge:')).map(tag => roleSchema.parse({ id: tag, name: tag.replace(/^badge:/, '') }));

/** Add internal fields to the account. */
const transformAccount = <T extends TransformableAccount>({ pleroma, other_settings, ...account }: T) => {
  const displayName = account.display_name.trim().length === 0 ? account.username : account.display_name;
  const domain = account.domain ?? getDomain(account.url || account.uri);

  if (pleroma) {
    pleroma.birthday = pleroma.birthday || other_settings?.birthday;
  }

  return {
    ...account,
    admin: pleroma?.is_admin || false,
    avatar_static: account.avatar_static || account.avatar,
    discoverable: account.discoverable || account.source?.pleroma?.discoverable || false,
    indexable: account.indexable ?? account.source?.pleroma?.indexable ?? false,
    display_name: displayName,
    domain,
    fqn: account.fqn || (account.acct.includes('@') ? account.acct : `${account.acct}@${domain}`),
    header_static: account.header_static || account.header,
    moderator: pleroma?.is_moderator || false,
    local: pleroma?.is_local !== undefined ? pleroma.is_local : account.acct.split('@')[1] === undefined,
    location: account.location || pleroma?.location || other_settings?.location || '',
    note: DOMPurify.sanitize(account.note, { USE_PROFILES: { html: true } }),
    pleroma,
    roles: account.roles.length ? account.roles : filterBadges(pleroma?.tags),
    staff: pleroma?.is_admin || pleroma?.is_moderator || false,
    suspended: account.suspended || pleroma?.deactivated || false,
    verified: account.verified || pleroma?.tags.includes('verified') || false,
  };
};

const accountSchema = baseAccountSchema.extend({
  moved: baseAccountSchema.transform(transformAccount).nullable().catch(null),
}).transform(transformAccount);

type Account = Resolve<z.infer<typeof accountSchema>> & {
  // FIXME: decouple these in components.
  relationship?: Relationship;
}

export { accountSchema, type Account };

/* end of account.ts */
