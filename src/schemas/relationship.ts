import z from 'zod';

const federationStatusSchema = z.object({
  defederated: z.boolean().catch(false),
  direction: z.string().nullable().catch(null),
  host: z.string().nullable().catch(null),
  known: z.boolean().catch(false),
  message: z.string().nullable().catch(null),
  reason: z.string().nullable().catch(null),
  severity: z.string().catch('none'),
});

const relationshipSchema = z.object({
  blocked_by: z.boolean().catch(false),
  blocking: z.boolean().catch(false),
  domain_blocking: z.boolean().catch(false),
  endorsed: z.boolean().catch(false),
  federation: federationStatusSchema.optional().catch(undefined),
  federation_blocked: z.boolean().catch(false),
  followed_by: z.boolean().catch(false),
  following: z.boolean().catch(false),
  id: z.string(),
  muting: z.boolean().catch(false),
  muting_notifications: z.boolean().catch(false),
  note: z.string().catch(''),
  notifying: z.boolean().catch(false),
  requested: z.boolean().catch(false),
  showing_reblogs: z.boolean().catch(false),
  subscribing: z.boolean().catch(false),
});

type Relationship = z.infer<typeof relationshipSchema>;
type FederationStatus = z.infer<typeof federationStatusSchema>;

export { federationStatusSchema, relationshipSchema, type FederationStatus, type Relationship };
