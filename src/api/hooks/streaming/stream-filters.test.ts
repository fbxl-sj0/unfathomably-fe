/*
 * Unfathomably FE
 *
 * File: stream-filters.test.ts
 * Purpose: Verify that route-specific WebSocket filters match REST views.
 * Responsibilities: Cover native families, profiles, media, tags, and replies.
 * This file intentionally does not create network connections.
 */

import { describe, expect, it } from 'vitest';

import {
  acceptsAccountStatus,
  acceptsGroupTag,
  acceptsNativeFederationStatus,
  acceptsThreadReply,
  hasStatusMedia,
} from './stream-filters.ts';

const status = (overrides = {}): any => ({
  id: 'status-1',
  account: { id: 'account-1' },
  media_attachments: [],
  pleroma: { native: { fields: { family: 'software' } } },
  tags: [],
  ...overrides,
});

describe('stream filters', () => {
  it('normalizes native family aliases and excludes replies', () => {
    expect(acceptsNativeFederationStatus(status(), 'development')).toBe(true);
    expect(acceptsNativeFederationStatus(status({ in_reply_to_id: 'parent' }), 'development')).toBe(false);
  });

  it('accepts group posts independently of native metadata', () => {
    expect(acceptsNativeFederationStatus(status({ group: { id: 'group-1' } }), 'groups')).toBe(true);
  });

  it('matches profile, reply, native, and media constraints', () => {
    expect(acceptsAccountStatus(status(), 'account-1', { nativeFamily: 'development' })).toBe(true);
    expect(acceptsAccountStatus(status({ in_reply_to_id: 'parent' }), 'account-1')).toBe(false);
    expect(acceptsAccountStatus(status({ in_reply_to_id: 'parent' }), 'account-1', { withReplies: true })).toBe(true);
    expect(acceptsAccountStatus(status(), 'account-1', { onlyMedia: true })).toBe(false);
    expect(acceptsAccountStatus(status({ media_attachments: [{ id: 'media-1' }] }), 'account-1', { onlyMedia: true })).toBe(true);
  });

  it('matches thread parents, tags, and media', () => {
    expect(acceptsThreadReply(status({ in_reply_to_id: 'parent' }), new Set(['parent']))).toBe(true);
    expect(acceptsGroupTag(status({ tags: [{ name: 'Fediverse' }] }), 'fediverse')).toBe(true);
    expect(hasStatusMedia(status({ media_attachments: [{ id: 'media-1' }] }))).toBe(true);
  });
});

/* end of stream-filters.test.ts */
