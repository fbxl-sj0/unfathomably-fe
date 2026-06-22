import DOMPurify from 'isomorphic-dompurify';
import z from 'zod';

import avatarMissing from '@/assets/images/avatar-missing.png';
import headerMissing from '@/assets/images/header-missing.png';

import { customEmojiSchema } from './custom-emoji.ts';
import { filteredArray } from './utils.ts';

const sourceRelationshipSchema = z.object({
  blocked_by: z.boolean().catch(false),
  following: z.boolean().catch(false),
  id: z.coerce.string(),
  muting: z.boolean().nullable().catch(false),
  notifying: z.boolean().nullable().catch(null),
  requested: z.boolean().catch(false),
});

const sourceSchema = z.object({
  acct: z.string().catch(''),
  actor_type: z.string().catch('Person'),
  ap_id: z.string().catch(''),
  avatar: z.string().catch(avatarMissing),
  avatar_static: z.string().catch(''),
  created_at: z.string().datetime().catch(new Date().toISOString()),
  display_name: z.string().catch(''),
  domain: z.string().catch(''),
  emojis: filteredArray(customEmojiSchema),
  header: z.string().catch(headerMissing),
  header_static: z.string().catch(''),
  id: z.coerce.string(),
  note: z.string().transform(note => note === '<p></p>' ? '' : note).catch(''),
  platform: z.string().catch('unknown'),
  platform_label: z.string().catch('Unknown'),
  platform_family: z.string().catch('generic'),
  platform_confidence: z.string().catch('unknown'),
  relationship: sourceRelationshipSchema.nullable().catch(null),
  source_profile: z.string().catch('activitypub_profile'),
  source_kind: z.string().catch('actor_feed'),
  source_kind_label: z.string().catch('Actor feed'),
  capabilities: z.array(z.string()).catch([]),
  uri: z.string().catch(''),
  url: z.string().catch(''),
  username: z.string().catch(''),
}).transform(source => {
  source.avatar_static = source.avatar_static || source.avatar;
  source.header_static = source.header_static || source.header;

  return {
    ...source,
    note: DOMPurify.sanitize(source.note, { USE_PROFILES: { html: true } }),
  };
});

type Source = z.infer<typeof sourceSchema>;
type SourceRelationship = z.infer<typeof sourceRelationshipSchema>;

export { sourceSchema, sourceRelationshipSchema, type Source, type SourceRelationship };
