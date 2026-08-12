/*
 * Unfathomably FE
 *
 * File: stream-filters.ts
 * Purpose: Keep live stream updates aligned with each route's REST filters.
 * Responsibilities: Classify status payloads for native, profile, group, and
 * thread views without depending on normalized Redux state.
 * This file intentionally does not open sockets or update timelines.
 */

import type { APIEntity } from '@/types/entities.ts';

type UnknownRecord = Record<string, any>;

interface AccountStreamOptions {
  nativeFamily?: string;
  onlyMedia?: boolean;
  withReplies?: boolean;
}

const FAMILY_ALIASES: Record<string, string> = {
  markets: 'marketplace',
  software: 'development',
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' ? value as UnknownRecord : {};

const canonicalStatus = (status: APIEntity): UnknownRecord => {
  const raw = asRecord(status);
  const reblog = asRecord(raw.reblog);
  return Object.keys(reblog).length ? reblog : raw;
};

const normalizeFamily = (family: unknown): string => {
  if (typeof family !== 'string') return '';
  const normalized = family.trim().toLowerCase();
  return FAMILY_ALIASES[normalized] || normalized;
};

const nativeFamily = (status: APIEntity): string => {
  const raw = canonicalStatus(status);
  const native = asRecord(asRecord(raw.pleroma).native);
  const fields = asRecord(native.fields);
  return normalizeFamily(fields.family || native.family);
};

const isReply = (status: APIEntity): boolean => {
  const raw = asRecord(status);
  return Boolean(raw.in_reply_to_id || raw.in_reply_to_account_id);
};

const statusAccountId = (status: APIEntity): string => {
  const raw = asRecord(status);
  return String(asRecord(raw.account).id || '');
};

const hasStatusMedia = (status: APIEntity): boolean => {
  const attachments = canonicalStatus(status).media_attachments;
  return Array.isArray(attachments) && attachments.length > 0;
};

const acceptsNativeFederationStatus = (status: APIEntity, family?: string): boolean => {
  if (isReply(status)) return false;

  const raw = canonicalStatus(status);
  const expected = normalizeFamily(family);

  if (expected === 'groups') return Boolean(raw.group) || nativeFamily(status) === 'groups';
  if (!expected || expected === 'all') return Boolean(nativeFamily(status));
  return nativeFamily(status) === expected;
};

const acceptsAccountStatus = (
  status: APIEntity,
  accountId: string,
  options: AccountStreamOptions = {},
): boolean => {
  if (statusAccountId(status) !== String(accountId)) return false;
  if (!options.withReplies && isReply(status)) return false;
  if (options.onlyMedia && !hasStatusMedia(status)) return false;
  if (options.nativeFamily && nativeFamily(status) !== normalizeFamily(options.nativeFamily)) return false;
  return true;
};

const acceptsThreadReply = (status: APIEntity, parentIds: ReadonlySet<string>): boolean => {
  const parentId = asRecord(status).in_reply_to_id;
  return typeof parentId === 'string' && parentIds.has(parentId);
};

const acceptsGroupTag = (status: APIEntity, tag: string): boolean => {
  const expected = tag.toLowerCase();
  const tags = canonicalStatus(status).tags;

  return Array.isArray(tags) && tags.some((item) => {
    const name = asRecord(item).name;
    return typeof name === 'string' && name.toLowerCase() === expected;
  });
};

const isEventStatus = (status: APIEntity): boolean => {
  const raw = canonicalStatus(status);
  const event = asRecord(raw.event);
  const pleromaEvent = asRecord(asRecord(raw.pleroma).event);
  const type = String(event.type || pleromaEvent.type || raw.activity_type || '').toLowerCase();
  return type === 'event' || Object.keys(event).length > 0 || Object.keys(pleromaEvent).length > 0;
};

export {
  acceptsAccountStatus,
  acceptsGroupTag,
  acceptsNativeFederationStatus,
  acceptsThreadReply,
  hasStatusMedia,
  isEventStatus,
  nativeFamily,
};

/* end of stream-filters.ts */
