/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/federation/floating-media-player.test.tsx

  Purpose:

    Prove the floating source media player can be opened, minimized, and
    closed without relying on route-local state.

  Responsibilities:

    * exercise the provider and dock together
    * verify audio and video elements receive the docked media URL
    * protect the compact minimized state

  This file intentionally does NOT contain:

    * browser media playback assertions
    * network calls
    * source discovery behavior
*/

import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { FloatingMediaPlayerProvider, useFloatingMediaPlayer, type FloatingMediaItem } from '@/contexts/floating-media-player-context.tsx';

import FloatingMediaPlayer from './floating-media-player.tsx';

describe('FloatingMediaPlayer', () => {
  it('opens audio in a persistent dock and can minimize or close it', async () => {
    const user = userEvent.setup();

    renderPlayer(buildItem('audio'));

    expect(screen.queryByTestId('floating-media-player')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dock item' }));

    const dock = screen.getByTestId('floating-media-player');

    expect(within(dock).getByText('Example audio')).toBeInTheDocument();
    expect(dock.querySelector('audio')).toHaveAttribute('src', 'https://media.example.test/audio.ogg');

    await user.click(within(dock).getByRole('button', { name: 'Minimize player' }));

    expect(within(dock).getByRole('button', { name: 'Restore player' })).toBeInTheDocument();
    expect(dock.querySelector('audio')).toHaveClass('h-9');

    await user.click(within(dock).getByRole('button', { name: 'Close player' }));

    expect(screen.queryByTestId('floating-media-player')).not.toBeInTheDocument();
  });

  it('opens video with a compact minimized frame', async () => {
    const user = userEvent.setup();

    renderPlayer(buildItem('video'));

    await user.click(screen.getByRole('button', { name: 'Dock item' }));

    const dock = screen.getByTestId('floating-media-player');
    const video = dock.querySelector('video');

    expect(video).toHaveAttribute('src', 'https://media.example.test/video.mp4');
    expect(video).toHaveAttribute('poster', 'https://media.example.test/poster.jpg');

    await user.click(within(dock).getByRole('button', { name: 'Minimize player' }));

    expect(video).toHaveClass('h-24');
  });
});

function renderPlayer(item: FloatingMediaItem) {
  render(
    <IntlProvider locale='en'>
      <FloatingMediaPlayerProvider>
        <Harness item={item} />
        <FloatingMediaPlayer />
      </FloatingMediaPlayerProvider>
    </IntlProvider>,
  );
}

function Harness({ item }: { item: FloatingMediaItem }) {
  const { playItem } = useFloatingMediaPlayer();

  return (
    <button onClick={() => playItem(item)} type='button'>
      Dock item
    </button>
  );
}

function buildItem(kind: 'audio' | 'video'): FloatingMediaItem {
  return {
    id: `https://source.example.test/${kind}/1`,
    kind,
    mediaType: kind === 'audio' ? 'audio/ogg' : 'video/mp4',
    mediaUrl: kind === 'audio' ? 'https://media.example.test/audio.ogg' : 'https://media.example.test/video.mp4',
    platformLabel: kind === 'audio' ? 'Funkwhale' : 'PeerTube',
    sourceKindLabel: kind === 'audio' ? 'Track' : 'Video',
    thumbnailUrl: kind === 'video' ? 'https://media.example.test/poster.jpg' : null,
    title: kind === 'audio' ? 'Example audio' : 'Example video',
    url: `https://source.example.test/${kind}/1`,
  };
}

/* end of src/features/federation/floating-media-player.test.tsx */
