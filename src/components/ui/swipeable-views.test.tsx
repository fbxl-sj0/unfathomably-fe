/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/ui/swipeable-views.test.tsx

  Purpose:

    Verify that horizontal swipe gestures follow the selected interface
    direction without changing the component's logical item order.

  Responsibilities:

    * cover left-to-right swipe navigation
    * cover right-to-left swipe navigation
    * protect the explicit direction contract used by media lightboxes

  This file intentionally does NOT contain:

    * browser gesture integration tests
    * media modal rendering tests
    * application locale configuration
*/

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/jest/test-helpers.tsx';

import SwipeableViews from './swipeable-views.tsx';

const renderSwipeableViews = (direction: 'ltr' | 'rtl') => {
  const onChangeIndex = vi.fn();
  render(
    <SwipeableViews direction={direction} index={0} onChangeIndex={onChangeIndex}>
      <div>First</div>
      <div>Second</div>
    </SwipeableViews>,
  );

  const swipeable = screen.getByText('First').parentElement?.parentElement;

  if (!(swipeable instanceof HTMLElement)) {
    throw new Error('Expected SwipeableViews to render an HTML element');
  }

  return { onChangeIndex, swipeable };
};

describe('<SwipeableViews />', () => {
  it('advances when swiping left in a left-to-right interface', () => {
    const { onChangeIndex, swipeable } = renderSwipeableViews('ltr');

    fireEvent.touchStart(swipeable, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(swipeable, { changedTouches: [{ clientX: 20 }] });

    expect(onChangeIndex).toHaveBeenCalledWith(1);
  });

  it('advances when swiping right in a right-to-left interface', () => {
    const { onChangeIndex, swipeable } = renderSwipeableViews('rtl');

    fireEvent.touchStart(swipeable, { touches: [{ clientX: 20 }] });
    fireEvent.touchEnd(swipeable, { changedTouches: [{ clientX: 100 }] });

    expect(onChangeIndex).toHaveBeenCalledWith(1);
  });
});

/* end of src/components/ui/swipeable-views.test.tsx */
