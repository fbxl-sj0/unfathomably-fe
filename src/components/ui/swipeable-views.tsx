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
  index?: number;
  onChangeIndex?(index: number): void;
  style?: React.CSSProperties;
}

const MIN_SWIPE_DISTANCE = 48;

/** Renders controlled horizontal panels with touch swipe support. */
const SwipeableViews: React.FC<ISwipeableViews> = ({
  children,
  className,
  containerStyle,
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
    startX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (startX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') return;

    const delta = endX - startX.current;
    startX.current = null;

    if (Math.abs(delta) < MIN_SWIPE_DISTANCE) return;

    const direction = delta < 0 ? 1 : -1;
    const nextIndex = clampIndex(index + direction);

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
        className='flex transition-transform duration-200 ease-out'
        style={{
          ...containerStyle,
          transform: `translateX(${-clampIndex(index) * 100}%)`,
          width: `${Math.max(childCount, 1) * 100}%`,
        }}
      >
        {Children.map(children, (child) => (
          <div className='min-w-0 flex-none' style={{ width: `${100 / Math.max(childCount, 1)}%` }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwipeableViews;

/* end of swipeable-views.tsx */
