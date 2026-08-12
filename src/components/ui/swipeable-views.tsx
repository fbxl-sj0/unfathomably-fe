/*
  Project: Soapbox frontend UI

  File: swipeable-views.tsx

  Purpose:

    Replace the legacy react-swipeable-views package with a focused
    controlled swipe container.

  Responsibilities:

    - render one active indexed panel at a time
    - preserve horizontal touch navigation for carousels and media views
    - report index changes to the owning component

  This file intentionally does NOT contain:

    - carousel-specific controls
    - media loading behavior
    - routing or modal logic
*/

import clsx from 'clsx';
import { Children, useRef } from 'react';

interface ISwipeableViews {
  animateHeight?: boolean;
  children: React.ReactNode;
  className?: string;
  containerStyle?: React.CSSProperties;
  direction?: 'ltr' | 'rtl';
  disabled?: boolean;
  index?: number;
  onChangeIndex?(index: number): void;
  style?: React.CSSProperties;
}

const firstTouchClientX = (touches: React.TouchList): number | null => {
  const touch = touches.item?.(0) ?? touches[0];

  return typeof touch?.clientX === 'number' ? touch.clientX : null;
};

const MIN_SWIPE_DISTANCE = 48;

/** Renders controlled horizontal panels with touch swipe support. */
const SwipeableViews: React.FC<ISwipeableViews> = ({
  children,
  className,
  containerStyle,
  direction = 'ltr',
  disabled = false,
  index = 0,
  onChangeIndex,
  style,
}) => {
  const startX = useRef<number | null>(null);
  const childCount = Children.count(children);

  const clampIndex = (nextIndex: number) => {
    if (childCount === 0) return 0;

    return Math.min(Math.max(nextIndex, 0), childCount - 1);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (disabled) {
      startX.current = null;
      return;
    }

    startX.current = firstTouchClientX(event.touches);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (disabled) {
      startX.current = null;
      return;
    }

    if (startX.current === null) return;

    const endX = firstTouchClientX(event.changedTouches);
    if (typeof endX !== 'number') return;

    const delta = endX - startX.current;
    startX.current = null;

    if (Math.abs(delta) < MIN_SWIPE_DISTANCE) return;

    const physicalStep = delta < 0 ? 1 : -1;
    const logicalStep = direction === 'rtl' ? -physicalStep : physicalStep;
    const nextIndex = clampIndex(index + logicalStep);

    if (nextIndex !== index) {
      onChangeIndex?.(nextIndex);
    }
  };

  return (
    <div
      className={clsx('overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={style}
    >
      <div
        className={clsx(
          'flex w-full flex-none transition-transform duration-200 ease-out',
          direction === 'rtl' && 'flex-row-reverse',
        )}
        style={{
          ...containerStyle,
          transform: `translateX(${(direction === 'rtl' ? 1 : -1) * clampIndex(index) * 100}%)`,
        }}
      >
        {Children.map(children, (child) => (
          <div className='w-full min-w-0 flex-none'>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwipeableViews;

/* end of swipeable-views.tsx */
