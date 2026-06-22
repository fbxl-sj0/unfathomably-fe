import { expect, test } from 'vitest';

import { groupSchema } from './group.ts';

test('groupSchema with a TruthSocial group', async () => {
  const data = await import('@/__fixtures__/group-truthsocial.json');
  const group = groupSchema.parse(data);
  expect(group.display_name).toEqual('PATRIOT PATRIOTS');
});

test('groupSchema with a Rebased ActivityPub group', () => {
  const group = groupSchema.parse({
    id: 456,
    actor_type: 'Group',
    ap_id: 'https://lotide.example/c/games',
    created_at: '2026-06-19T12:00:00.000Z',
    display_name: 'Games',
    domain: 'lotide.example',
    note: '<p>Threadiverse forum.</p>',
    owner: { id: 456 },
    platform: 'lotide',
    platform_label: 'Lotide',
    platform_family: 'groups',
    platform_confidence: 'software',
    relationship: {
      id: 456,
      member: true,
      role: 'user',
    },
    target_profile: 'threadiverse_forum',
    target_kind: 'group',
    target_kind_label: 'Group',
    capabilities: ['follow community', 'read posts', 'send replies'],
    uri: 'https://lotide.example/c/games',
    url: 'https://lotide.example/c/games',
  });

  expect(group.id).toEqual('456');
  expect(group.owner.id).toEqual('456');
  expect(group.slug).toEqual('456');
  expect(group.relationship?.member).toBe(true);
  expect(group.platform_label).toEqual('Lotide');
  expect(group.target_kind).toEqual('group');
  expect(group.capabilities).toEqual(['follow community', 'read posts', 'send replies']);
});
