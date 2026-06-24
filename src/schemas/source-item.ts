/*
  Project: Unfathomably FE
  File: source-item.ts

  Purpose:
    Describe native items returned by remote ActivityPub sources.

  Responsibilities:
    Parse the compact source-item envelope returned by unfathomably-be.

  This file intentionally does NOT contain:
    API request logic or rendering decisions.
*/

import { z } from 'zod';

const sourceItemRenderHintSchema = z.object({
  layout: z.string().catch('generic'),
  primary_action: z.string().catch('open'),
});

const sourceItemSchema = z.object({
  id: z.string(),
  type: z.string().catch('Object'),
  title: z.string().catch('Remote item'),
  summary: z.string().nullable().catch(null),
  url: z.string().nullable().catch(null),
  media_url: z.string().nullable().catch(null),
  media_type: z.string().nullable().catch(null),
  attributed_to: z.string().nullable().catch(null),
  published: z.string().nullable().catch(null),
  platform: z.string().catch('unknown'),
  platform_label: z.string().catch('Unknown'),
  platform_family: z.string().catch('generic'),
  platform_confidence: z.string().catch('unknown'),
  thumbnail_url: z.string().nullable().catch(null),
  duration: z.string().nullable().catch(null),
  event_start: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
  comments_count: z.number().nullable().catch(null),
  source_kind: z.string().catch('actor_feed'),
  source_kind_label: z.string().catch('Actor feed'),
  capabilities: z.array(z.string()).catch([]),
  render_hint: sourceItemRenderHintSchema.nullable().catch(null),
  status: z.record(z.string(), z.unknown()).nullable().optional().catch(null),
});

const sourceItemsEnvelopeSchema = z.object({
  items: z.array(sourceItemSchema).catch([]),
  next: z.string().nullable().catch(null),
  total_items: z.number().nullable().catch(null),
});

type SourceItem = z.infer<typeof sourceItemSchema>;
type SourceItemsEnvelope = z.infer<typeof sourceItemsEnvelopeSchema>;

export { sourceItemSchema, sourceItemsEnvelopeSchema, type SourceItem, type SourceItemsEnvelope };

/* end of source-item.ts */
