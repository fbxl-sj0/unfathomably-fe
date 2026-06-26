/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/components/status-media.test.tsx

  Purpose:

    Prove status media can hand playable attachments to the persistent
    docked media player.

  Responsibilities:

    * render normal status video attachments
    * expose the dock control for playable status media
    * verify the floating player receives the selected media URL

  This file intentionally does NOT contain:

    * browser media playback assertions
    * network calls
    * federation discovery behavior
*/

import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen, within } from '@/jest/test-helpers.tsx';
import { statusSchema } from '@/schemas/status.ts';

import FloatingMediaPlayer from '../features/federation/floating-media-player.tsx';
import StatusMedia from './status-media.tsx';

vi.mock('@/features/ui/util/async-components.ts', () => ({
  Audio: ({ src }: { src: string }) => <audio controls src={src} />,
  MediaGallery: () => <div data-testid='media-gallery' />,
  Video: ({ src }: { src: string }) => <video controls src={src} />,
}));

describe('StatusMedia', () => {
  it('opens a status video in the persistent media dock', async () => {
    const user = userEvent.setup();
    const { default: statusJson } = await import('@/__fixtures__/pleroma-status-vertical-video-without-metadata.json');
    const status = statusSchema.parse({
      ...statusJson,
      group: {
        id: 'peertube-group',
        display_name: 'Example PeerTube Channel',
        platform: 'peertube',
        platform_label: 'PeerTube',
      },
    });

    render(
      <>
        <StatusMedia status={status} />
        <FloatingMediaPlayer />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Play docked' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play docked' }));

    const dock = screen.getByTestId('floating-media-player');
    const video = within(dock).getByLabelText(status.media_attachments[0].description);

    expect(within(dock).getByText(/PeerTube/)).toBeInTheDocument();
    expect(video).toHaveAttribute('src', status.media_attachments[0].url);
  });
});

/* end of src/components/status-media.test.tsx */
