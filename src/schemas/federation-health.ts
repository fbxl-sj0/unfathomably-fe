/*
  Project: Unfathomably FE
  File: src/schemas/federation-health.ts

  Purpose:
    Validate the backend admin federation health snapshot.

  Responsibilities:
    - describe queue and remote instance health response shapes
    - keep the admin health UI tolerant of partial backend data

  This file intentionally does NOT contain:
    - API fetching logic
    - rendered admin UI
*/

import * as z from '@/zod.ts';

const nullableDateSchema = z.string().nullable().catch(null);
const nullableStringSchema = z.string().nullable().catch(null);

const federationHealthInstanceSummarySchema = z.object({
  total: z.number().catch(0),
  reachable: z.number().catch(0),
  unreachable: z.number().catch(0),
  consistently_unreachable: z.number().catch(0),
  dormant: z.number().catch(0),
});

const federationHealthQueueStateSchema = z.object({
  state: z.string().catch(''),
  count: z.number().catch(0),
  oldest_scheduled_at: nullableDateSchema,
});

const federationHealthQueueSchema = z.object({
  name: z.string().catch(''),
  total: z.number().catch(0),
  states: z.array(federationHealthQueueStateSchema).catch([]),
});

const federationHealthOutgoingSchema = z.object({
  pending: z.number().catch(0),
  blocked_by_unreachable: z.number().catch(0),
  blocked_by_dormant: z.number().catch(0),
  oldest_pending_scheduled_at: nullableDateSchema,
});

const federationHealthDeliveryEndpointSchema = z.object({
  url: z.string().catch(''),
  failure_count: z.number().catch(0),
  last_status: nullableStringSchema,
  last_success_at: nullableDateSchema,
  last_failure_at: nullableDateSchema,
  last_failure_reason: nullableStringSchema,
  backoff_until: nullableDateSchema,
});

const federationHealthRemoteInstanceSchema = z.object({
  host: z.string().catch(''),
  unreachable_since: nullableDateSchema,
  dormant: z.boolean().catch(false),
  software_name: nullableStringSchema,
  software_version: nullableStringSchema,
  last_status: nullableStringSchema,
  failure_count: z.number().catch(0),
  last_failure_at: nullableDateSchema,
  last_failure_reason: nullableStringSchema,
  last_success_at: nullableDateSchema,
  backoff_until: nullableDateSchema,
  probe_due: z.boolean().catch(false),
  redirect_target: nullableStringSchema,
  gone_at: nullableDateSchema,
  delivery_endpoints: z.array(federationHealthDeliveryEndpointSchema).catch([]),
});

const federationHealthSchema = z.object({
  generated_at: z.string().catch(''),
  instances: federationHealthInstanceSummarySchema,
  queues: z.array(federationHealthQueueSchema).catch([]),
  outgoing: federationHealthOutgoingSchema,
  unreachable_instances: z.array(federationHealthRemoteInstanceSchema).catch([]),
});

type FederationHealth = z.infer<typeof federationHealthSchema>
type FederationHealthQueue = z.infer<typeof federationHealthQueueSchema>
type FederationHealthRemoteInstance = z.infer<typeof federationHealthRemoteInstanceSchema>

export {
  federationHealthSchema,
  type FederationHealth,
  type FederationHealthQueue,
  type FederationHealthRemoteInstance,
};

/* end of src/schemas/federation-health.ts */
