import DOMPurify from 'isomorphic-dompurify';
import * as z from '@/zod.ts';

import avatarMissing from '@/assets/images/avatar-missing.png';
import headerMissing from '@/assets/images/header-missing.png';
import { getAvatarURL, getHeaderURL } from '@/utils/accounts.ts';

import { accountSchema } from './account.ts';
import { customEmojiSchema } from './custom-emoji.ts';
import { groupRelationshipSchema } from './group-relationship.ts';
import { federationStatusSchema } from './relationship.ts';
import { groupTagSchema } from './group-tag.ts';
import { filteredArray } from './utils.ts';

const nostrGroupSchema = z.object({
  relay: z.string().catch(''),
  relays: z.array(z.string()).catch([]),
  group_id: z.string().catch(''),
  kind: z.string().catch('mirror_group'),
  members_count: z.number().optional().catch(undefined),
  moderators_count: z.number().optional().catch(undefined),
  owner_pubkey: z.string().optional().catch(undefined),
  community_standard: z.string().optional().catch(undefined),
  community_coordinate: z.string().optional().catch(undefined),
  activity_30d: z.number().optional().catch(undefined),
  active_authors_30d: z.number().optional().catch(undefined),
  last_activity_at: z.string().datetime().optional().catch(undefined),
  administrators: z.array(z.object({
    pubkey: z.string(),
    roles: z.array(z.string()).catch([]),
  })).catch([]),
  roles: z.array(z.object({
    name: z.string(),
    description: z.string().catch(''),
  })).catch([]),
});

const groupSchema = z.object({
  avatar: z.string().catch(avatarMissing),
  avatar_static: z.string().catch(''),
  created_at: z.string().datetime().catch(new Date().toUTCString()),
  deleted_at: z.string().datetime().or(z.null()).catch(null),
  display_name: z.string().catch(''),
  domain: z.string().catch(''),
  emojis: filteredArray(customEmojiSchema),
  discoverable: z.boolean().catch(false),
  group_join_notifications: z.boolean().catch(true),
  group_visibility: z.string().catch(''), // TruthSocial
  header: z.string().catch(headerMissing),
  header_static: z.string().catch(''),
  id: z.coerce.string(),
  locked: z.boolean().catch(false),
  membership_required: z.boolean().catch(false),
  members_count: z.number().catch(0),
  moderators_count: z.number().catch(0),
  owner: z.object({ id: z.coerce.string() }).catch({ id: '' }),
  owner_account: accountSchema.nullable().optional().catch(undefined),
  note: z.string().transform(note => note === '<p></p>' ? '' : note).catch(''),
  platform: z.string().catch('activitypub-group'),
  platform_label: z.string().catch('Group'),
  platform_family: z.string().catch('groups'),
  platform_confidence: z.string().catch('object'),
  relationship: groupRelationshipSchema.nullable().catch(null), // Dummy field to be overwritten later
  slug: z.string().catch(''), // TruthSocial
  source: z.object({
    note: z.string(),
  }).optional(), // TruthSocial
  statuses_visibility: z.string().catch('public'),
  statuses_count: z.number().catch(0),
  tags: z.array(groupTagSchema).catch([]),
  uri: z.string().catch(''),
  url: z.string().catch(''),
  actor_type: z.string().catch('Group'),
  ap_id: z.string().catch(''),
  target_profile: z.string().catch('activitypub_group'),
  target_kind: z.string().catch('group'),
  target_kind_label: z.string().catch('Group'),
  capabilities: z.array(z.string()).catch([]),
  federation: federationStatusSchema.optional().catch(undefined),
  nostr: nostrGroupSchema.nullable().optional().catch(undefined),
}).transform(group => {
  group.avatar = getAvatarURL(group.avatar, group.avatar_static);
  group.avatar_static = getAvatarURL(group.avatar_static, group.avatar);
  group.header = getHeaderURL(group.header, group.header_static);
  group.header_static = getHeaderURL(group.header_static, group.header);
  group.locked = group.locked || group.group_visibility === 'members_only'; // TruthSocial
  group.slug = group.slug || group.id;

  return {
    ...group,
    note: DOMPurify.sanitize(group.note, { USE_PROFILES: { html: true } }),
  };
});

type Group = z.infer<typeof groupSchema>;

export { groupSchema, type Group };
