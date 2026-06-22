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

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import type { SourceItem } from '@/schemas/source-item.ts';

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
  });

  it('renders video controls for video families', () => {
    renderCard(buildItem('video', {
      media_url: 'https://video.example.test/watch/video.mp4',
      media_type: 'video/mp4',
    }));

    expect(screen.getByTestId('native-source-item-card').querySelector('video')).toBeInTheDocument();
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
    renderCard(buildItem('groups'));

    expect(screen.getByText(/bring its discussions into your timelines/i)).toBeInTheDocument();
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
      <NativeSourceItemCard item={item} />
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
    event_start: null,
    location: null,
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
