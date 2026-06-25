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
  'books',
  'bookmarks',
  'groups',
  'events',
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
