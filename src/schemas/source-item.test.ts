/*
  Project: Unfathomably FE
  File: source-item.test.ts

  Purpose:
    Prove native remote source items parse into a stable client shape.

  Responsibilities:
    Cover the Funkwhale-style audio item contract and native renderer hints.

  This file intentionally does NOT contain:
    Network requests or rendering tests.
*/

import { expect, test } from 'vitest';

import { sourceItemsEnvelopeSchema } from './source-item.ts';

test('sourceItemsEnvelopeSchema with a Funkwhale audio item', () => {
  const envelope = sourceItemsEnvelopeSchema.parse({
    total_items: 54,
    next: null,
    items: [
      {
        id: 'https://audio.example.org/library/tracks/1',
        type: 'Audio',
        title: 'Atacameo (Trote)',
        summary: 'A public library track.',
        url: 'https://audio.example.org/library/tracks/1',
        media_url: 'https://audio.example.org/api/v1/listen/1.ogg',
        media_type: 'audio/ogg',
        attributed_to: 'https://audio.example.org/federation/actors/artist',
        published: '2026-06-19T00:00:00Z',
        platform: 'funkwhale',
        platform_label: 'Funkwhale',
        platform_family: 'audio',
        platform_confidence: 'software',
        thumbnail_url: 'https://audio.example.org/api/v1/tracks/1/cover.jpg',
        duration: 'PT3M',
        media_bitrate: 192000,
        media_size: 3456789,
        album: 'Alturas',
        album_url: 'https://audio.example.org/federation/music/albums/1',
        artists: ['Los Jaivas'],
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        copyright: null,
        disc: 1,
        position: 7,
        musicbrainz_id: '11111111-1111-1111-1111-111111111111',
        musicbrainz_url: 'https://musicbrainz.org/recording/11111111-1111-1111-1111-111111111111',
        event_start: null,
        location: null,
        source_kind: 'funkwhale_library',
        source_kind_label: 'Library',
        capabilities: ['follow library', 'preview tracks', 'owner inbox'],
        render_hint: {
          layout: 'player',
          primary_action: 'play',
        },
      },
    ],
  });

  expect(envelope.total_items).toEqual(54);
  expect(envelope.items[0].type).toEqual('Audio');
  expect(envelope.items[0].media_type).toEqual('audio/ogg');
  expect(envelope.items[0].platform_family).toEqual('audio');
  expect(envelope.items[0].comments_count).toBeNull();
  expect(envelope.items[0].media_bitrate).toEqual(192000);
  expect(envelope.items[0].album).toEqual('Alturas');
  expect(envelope.items[0].artists).toEqual(['Los Jaivas']);
  expect(envelope.items[0].musicbrainz_url).toEqual('https://musicbrainz.org/recording/11111111-1111-1111-1111-111111111111');
  expect(envelope.items[0].source_kind).toEqual('funkwhale_library');
  expect(envelope.items[0].capabilities).toEqual(['follow library', 'preview tracks', 'owner inbox']);
  expect(envelope.items[0].render_hint?.primary_action).toEqual('play');
});

/* end of source-item.test.ts */
