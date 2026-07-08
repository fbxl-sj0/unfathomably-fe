import z from 'zod';

import { GroupRoles } from './group-member.ts';

const groupRelationshipSchema = z.object({
  blocked_by: z.boolean().catch(false),
  can_follow: z.boolean().catch(true),
  can_post: z.boolean().catch(true),
  federation_blocked: z.boolean().catch(false),
  id: z.coerce.string(),
  member: z.boolean().catch(false),
  moderation_message: z.string().nullable().catch(null),
  moderation_status: z.string().catch('ok'),
  muting: z.boolean().nullable().catch(false),
  notifying: z.boolean().nullable().catch(null),
  pending_requests: z.boolean().catch(false),
  requested: z.boolean().catch(false),
  role: z.nativeEnum(GroupRoles).catch(GroupRoles.USER),
});

type GroupRelationship = z.infer<typeof groupRelationshipSchema>;

export { groupRelationshipSchema, type GroupRelationship };
