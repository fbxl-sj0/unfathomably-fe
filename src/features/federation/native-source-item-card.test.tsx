/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/federation/native-source-item-card.test.tsx

  Purpose:

    Prove every federation family has an operational native source-item card.

  Responsibilities:

    * render the full platform-family matrix without throwing
    * assert family-specific controls for audio, video, events, and groups
    * protect the generic fallback

  This file intentionally does NOT contain:

    * network calls
    * backend API mocks
    * source discovery behavior
*/

import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { FloatingMediaPlayerProvider } from '@/contexts/floating-media-player-context.tsx';
import type { SourceItem } from '@/schemas/source-item.ts';

import FloatingMediaPlayer from './floating-media-player.tsx';
import NativeSourceItemCard from './native-source-item-card.tsx';
import { FEDERATION_RENDER_HINTS, type FederationFamily } from './platform.ts';

const families: FederationFamily[] = [
  'audio',
  'video',
  'longform',
  'microblog',
  'photo',
  'models',
  'games',
  'marketplace',
  'culture',
  'books',
  'bookmarks',
  'groups',
  'events',
  'development',
  'coordination',
  'publishing',
  'routes',
  'local',
  'generic',
];

describe('NativeSourceItemCard', () => {
  it('renders every federation family with its native badge', () => {
    for (const family of families) {
      const { unmount } = renderCard(buildItem(family));

      expect(screen.getByTestId('native-source-item-card')).toHaveAttribute('data-family', family);
      expect(screen.getByTestId('federation-platform-badge')).toBeInTheDocument();

      unmount();
    }
  });

  it('renders audio controls for audio families', () => {
    renderCard(buildItem('audio', {
      media_url: 'https://audio.example.test/listen/track.ogg',
      media_type: 'audio/ogg',
    }));

    expect(screen.getByTestId('native-source-item-card').querySelector('audio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play docked' })).toBeInTheDocument();
  });

  it('renders music metadata for audio source items', () => {
    renderCard(buildItem('audio', {
      artists: ['Los Jaivas'],
      album: 'Alturas',
      album_url: 'https://audio.example.test/albums/1',
      duration: 'PT3M27S',
      media_bitrate: 192000,
      media_size: 3456789,
      license: 'https://creativecommons.org/licenses/by-sa/4.0/',
      musicbrainz_id: '11111111-1111-1111-1111-111111111111',
      musicbrainz_url: 'https://musicbrainz.org/recording/11111111-1111-1111-1111-111111111111',
    }));

    expect(screen.getByText('Los Jaivas')).toBeInTheDocument();
    expect(screen.getByText('Alturas')).toHaveAttribute('href', 'https://audio.example.test/albums/1');
    expect(screen.getByText('PT3M27S')).toBeInTheDocument();
    expect(screen.getByText('192 kbps')).toBeInTheDocument();
    expect(screen.getByText('3.3 MB')).toBeInTheDocument();
    expect(screen.getByText('creativecommons.org/licenses/by-sa/4.0')).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
    expect(screen.getByText('11111111-1111-1111-1111-111111111111')).toHaveAttribute('href', 'https://musicbrainz.org/recording/11111111-1111-1111-1111-111111111111');
  });

  it('renders video controls for video families', () => {
    renderCard(buildItem('video', {
      media_url: 'https://video.example.test/watch/video.mp4',
      media_type: 'video/mp4',
    }));

    expect(screen.getByTestId('native-source-item-card').querySelector('video')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play docked' })).toBeInTheDocument();
  });

  it('renders native Manyfold model metadata', () => {
    renderCard(buildItem('models', {
      native: {
        canonical_id: 'https://manyfold.example/models/model-123',
        class: 'resource',
        context: 'https://manyfold.example/collections/calibration',
        controls: ['open'],
        fields: {
          attributed_to: ['https://manyfold.example/creators/example-maker'],
          collections: ['https://manyfold.example/collections/calibration'],
          license: 'MIT',
        },
        type: '3DModel',
      },
    }));

    expect(screen.getByText('manyfold.example/creators/example-maker')).toHaveAttribute(
      'href',
      'https://manyfold.example/creators/example-maker',
    );
    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.getByText('https://manyfold.example/collections/calibration')).toBeInTheDocument();
  });

  it('renders native NeoDB catalog metadata', () => {
    renderCard(buildItem('culture', {
      native: {
        canonical_id: 'https://neodb.example.test/@reviewer/posts/1',
        class: 'status',
        context: 'https://neodb.example.test/@reviewer/posts/1',
        controls: ['open'],
        fields: {
          catalog_item: 'https://neodb.example.test/movie/1',
          catalog_type: 'Movie',
          platform: 'neodb',
          rating: 7,
          rating_best: 10,
          reading_status: 'complete',
        },
        type: 'Article',
      },
    }));

    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('neodb.example.test/movie/1')).toHaveAttribute('href', 'https://neodb.example.test/movie/1');
  });

  it('renders native Flohmarkt listing metadata', () => {
    renderCard(buildItem('marketplace', {
      native: {
        canonical_id: 'https://market.example.test/alice/items/42',
        class: 'status',
        context: null,
        controls: ['open'],
        fields: {
          currency: 'CAD',
          latitude: 43.6532,
          listing_name: 'Alien radio',
          longitude: -79.3832,
          platform: 'flohmarkt',
          price: '25.00',
        },
        type: 'Note',
      },
    }));

    expect(screen.getByText('Alien radio')).toBeInTheDocument();
    expect(screen.getByText('25.00 CAD')).toBeInTheDocument();
    expect(screen.getByText('43.6532, -79.3832')).toBeInTheDocument();
  });

  it('renders native Castling.club game metadata', () => {
    renderCard(buildItem('games', {
      native: {
        canonical_id: 'https://castling.example.test/objects/22222222-2222-4222-8222-222222222222',
        class: 'status',
        context: null,
        controls: ['open'],
        fields: {
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          game: 'https://castling.example.test/games/11111111-1111-4111-8111-111111111111',
          platform: 'castling',
          san: 'e4',
        },
        type: 'Note',
      },
    }));

    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2')).toBeInTheDocument();
    expect(screen.getByText('castling.example.test/games/11111111-1111-4111-8111-111111111111')).toHaveAttribute(
      'href',
      'https://castling.example.test/games/11111111-1111-4111-8111-111111111111',
    );
  });

  it('opens playable source items in the dock without removing the card player', async () => {
    const user = userEvent.setup();

    render(
      <IntlProvider locale='en'>
        <FloatingMediaPlayerProvider>
          <NativeSourceItemCard item={buildItem('audio', {
            media_url: 'https://audio.example.test/listen/track.ogg',
            media_type: 'audio/ogg',
          })}
          />
          <FloatingMediaPlayer />
        </FloatingMediaPlayerProvider>
      </IntlProvider>,
    );

    expect(screen.getByTestId('native-source-item-card').querySelector('audio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play docked' }));

    const dock = screen.getByTestId('floating-media-player');

    expect(within(dock).getByText('audio title')).toBeInTheDocument();
    expect(dock.querySelector('audio')).toHaveAttribute('src', 'https://audio.example.test/listen/track.ogg');
  });

  it('renders event details for event families', () => {
    renderCard(buildItem('events', {
      event_start: '2026-06-19T12:00:00Z',
      location: 'The fediverse',
    }));

    expect(screen.getByText('2026-06-19T12:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('The fediverse')).toBeInTheDocument();
  });

  it('renders community copy for group families', () => {
    renderCard(buildItem('groups', { comments_count: 3 }));

    expect(screen.getByText(/bring its discussions into your timelines/i)).toBeInTheDocument();
    expect(screen.getByText('3 comments')).toBeInTheDocument();
  });

  it('renders BookWyrm metadata for book families', () => {
    renderCard(buildItem('books', {
      type: 'Review',
      native: {
        canonical_id: 'https://books.example.test/reviews/1',
        class: 'status',
        context: 'https://books.example.test/reviews/1',
        controls: ['open'],
        fields: {
          in_reply_to_book: 'https://books.example.test/books/1',
          rating: 4.5,
          reading_status: 'read',
        },
        type: 'Review',
      },
    }));

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('read')).toBeInTheDocument();
    expect(screen.getByText('books.example.test/books/1')).toHaveAttribute('href', 'https://books.example.test/books/1');
  });

  it('renders ForgeFed resources as read-only development activity', () => {
    renderCard(buildItem('development', {
      type: 'Ticket',
      native: {
        canonical_id: 'https://forge.example.test/tickets/1',
        class: 'process',
        context: 'https://forge.example.test/projects/1',
        controls: ['open'],
        fields: {
          managed_by: 'https://forge.example.test/projects/1',
        },
        type: 'Ticket',
      },
    }));

    expect(screen.getByText('Read-only federated Ticket')).toBeInTheDocument();
    expect(screen.getByText('forge.example.test/projects/1')).toHaveAttribute('href', 'https://forge.example.test/projects/1');
    expect(screen.queryByText(/accept ticket/i)).not.toBeInTheDocument();
  });

  it('renders Bonfire ValueFlows objects as read-only coordination activity', () => {
    renderCard(buildItem('coordination', {
      type: 'ValueFlows:EconomicEvent',
      native: {
        canonical_id: 'https://bonfire.example.test/pub/objects/event-1',
        class: 'status',
        context: null,
        controls: ['open'],
        fields: {
          action: 'transfer',
          platform: 'bonfire_valueflows',
          provider: 'https://bonfire.example.test/pub/actors/alice',
          receiver: 'https://remote.example.test/pub/actors/bob',
          resource_quantity: 3,
          resource_quantity_unit: 'https://units.example.test/items/radio',
        },
        type: 'ValueFlows:EconomicEvent',
      },
    }));

    expect(screen.getByText('EconomicEvent')).toBeInTheDocument();
    expect(screen.getByText('transfer')).toBeInTheDocument();
    expect(screen.getByText('3 https://units.example.test/items/radio')).toBeInTheDocument();
    expect(screen.getByText('bonfire.example.test/pub/actors/alice')).toHaveAttribute(
      'href',
      'https://bonfire.example.test/pub/actors/alice',
    );
  });

  it('renders ZenPub Document metadata as a read-only publishing resource', () => {
    renderCard(buildItem('publishing', {
      type: 'Document',
      native: {
        canonical_id: 'https://zenpub.example.test/pub/objects/resource-1',
        class: 'status',
        context: 'https://zenpub.example.test/pub/actors/library',
        controls: ['open'],
        fields: {
          author: 'Alien Federation Working Group',
          language: 'en',
          level: 'intermediate',
          license: 'CC-BY-SA-4.0',
          platform: 'zenpub',
          resource_url: 'https://zenpub.example.test/uploads/resource-1.pdf',
          subject: 'ActivityPub interoperability',
        },
        type: 'Document',
      },
    }));

    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getByText('Alien Federation Working Group')).toBeInTheDocument();
    expect(screen.getByText('ActivityPub interoperability')).toBeInTheDocument();
    expect(screen.getByText('CC-BY-SA-4.0')).toBeInTheDocument();
    expect(screen.getByText('zenpub.example.test/uploads/resource-1.pdf')).toHaveAttribute(
      'href',
      'https://zenpub.example.test/uploads/resource-1.pdf',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders Wanderer route metadata and the bounded GPX link', () => {
    renderCard(buildItem('routes', {
      native: {
        canonical_id: 'https://wanderer.example.test/api/v1/trail/1',
        class: 'status',
        context: null,
        controls: ['open'],
        fields: {
          category: 'Hiking',
          difficulty: 'hard',
          distance: '12450.000000m',
          duration: '240.000000m',
          elevation_gain: '890.000000m',
          gpx_url: 'https://wanderer.example.test/files/trail.gpx',
          location: 'Alien Escarpment',
          platform: 'wanderer',
          route_kind: 'trail',
          start_time: '2026-07-17T08:00:00Z',
        },
        type: 'Note',
      },
    }));

    expect(screen.getByText('Hiking')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
    expect(screen.getByText('12450.000000m')).toBeInTheDocument();
    expect(screen.getByText('890.000000m')).toBeInTheDocument();
    expect(screen.getByText('Alien Escarpment')).toBeInTheDocument();
    expect(screen.getByText('GPX')).toHaveAttribute('href', 'https://wanderer.example.test/files/trail.gpx');
  });

  it('renders source kind and capability chips', () => {
    renderCard(buildItem('audio', {
      source_kind_label: 'Library',
      capabilities: ['follow library', 'preview tracks', 'owner inbox'],
    }));

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByTestId('federation-capability-chips')).toBeInTheDocument();
    expect(screen.getByText('follow library')).toBeInTheDocument();
    expect(screen.getByText('preview tracks')).toBeInTheDocument();
    expect(screen.getByText('owner inbox')).toBeInTheDocument();
  });
});

function renderCard(item: SourceItem) {
  return render(
    <IntlProvider locale='en'>
      <FloatingMediaPlayerProvider>
        <NativeSourceItemCard item={item} />
      </FloatingMediaPlayerProvider>
    </IntlProvider>,
  );
}

function buildItem(family: FederationFamily, overrides: Partial<SourceItem> = {}): SourceItem {
  return {
    id: `https://${family}.example.test/item/1`,
    type: 'Note',
    title: `${family} title`,
    summary: `${family} summary`,
    url: `https://${family}.example.test/item/1`,
    media_url: null,
    media_type: null,
    attributed_to: null,
    published: null,
    platform: family,
    platform_label: family,
    platform_family: family,
    platform_confidence: 'software',
    thumbnail_url: family === 'photo' ? `https://${family}.example.test/photo.jpg` : null,
    duration: null,
    media_bitrate: null,
    media_size: null,
    album: null,
    album_url: null,
    artists: [],
    license: null,
    copyright: null,
    disc: null,
    position: null,
    musicbrainz_id: null,
    musicbrainz_url: null,
    event_start: null,
    location: null,
    comments_count: null,
    native: null,
    source_kind: 'actor_feed',
    source_kind_label: 'Actor feed',
    capabilities: ['follow', 'preview'],
    render_hint: {
      layout: FEDERATION_RENDER_HINTS[family].layout,
      primary_action: FEDERATION_RENDER_HINTS[family].primaryAction,
    },
    ...overrides,
  };
}

/* end of src/features/federation/native-source-item-card.test.tsx */
