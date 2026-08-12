/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/features/ui/components/zoomable-image.test.tsx

  Purpose:

    Prove an individual lightbox image can be enlarged with a mouse click.

  Responsibilities:

    * verify click-to-zoom enters the enlarged state
    * verify a second click restores fit-to-screen display
    * verify zoom state is reported to the media carousel

  This file intentionally does NOT contain:

    * touch gesture simulation
    * media loading assertions
    * carousel navigation tests
*/

import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import ZoomableImage from './zoomable-image.tsx';

vi.mock('@/is-mobile.ts', () => ({
  userTouching: { matches: false },
}));

describe('ZoomableImage', () => {
  it('toggles an individual image between fitted and enlarged display', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();

    render(
      <ZoomableImage
        alt='Example attachment'
        src='https://example.com/attachment.jpg'
        onZoomChange={onZoomChange}
      />,
    );

    const image = screen.getByAltText('Example attachment');

    expect(image).toHaveStyle({ transform: 'scale(1)' });

    await user.click(image);

    expect(image).toHaveStyle({ transform: 'scale(2)' });
    expect(onZoomChange).toHaveBeenLastCalledWith(true);

    await user.click(image);

    expect(image).toHaveStyle({ transform: 'scale(1)' });
    expect(onZoomChange).toHaveBeenLastCalledWith(false);
  });
});

/* end of src/features/ui/components/zoomable-image.test.tsx */
