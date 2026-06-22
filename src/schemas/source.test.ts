import { expect, test } from 'vitest';

import { sourceSchema } from './source.ts';

test('sourceSchema with a Rebased ActivityPub source', () => {
  const source = sourceSchema.parse({
    id: 123,
    acct: 'writer@example.org',
    actor_type: 'Person',
    ap_id: 'https://example.org/users/writer',
    avatar: 'https://example.org/avatar.png',
    created_at: '2026-06-19T12:00:00.000Z',
    display_name: 'Writer',
    domain: 'example.org',
    header: 'https://example.org/header.png',
    note: '<p>Long form posts.</p>',
    relationship: {
      id: 123,
      following: true,
    },
    source_profile: 'activitypub_profile',
    uri: 'https://example.org/users/writer',
    url: 'https://example.org/@writer',
  });

  expect(source.id).toEqual('123');
  expect(source.relationship?.following).toBe(true);
  expect(source.note).toEqual('<p>Long form posts.</p>');
});

test('sourceSchema with a native collection source', () => {
  const source = sourceSchema.parse({
    id: 'library-1',
    actor_type: 'Application',
    ap_id: 'https://audio.example.org/federation/music/libraries/everyone',
    display_name: 'Everyone',
    note: '<p>Public music library.</p>',
    relationship: {
      id: 'library-1',
      following: false,
      requested: true,
    },
    source_profile: 'library',
    url: 'https://audio.example.org/library/everyone',
  });

  expect(source.source_profile).toEqual('library');
  expect(source.relationship?.requested).toBe(true);
});
