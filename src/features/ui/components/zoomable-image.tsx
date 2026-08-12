/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/ui/components/zoomable-image.tsx

  Purpose:

    Display a lightbox image with desktop click zoom and touch pinch zoom.

  Responsibilities:

    * keep zoom centered on the user's pointer or touch midpoint
    * constrain zoom to safe, useful limits
    * report zoom state so the media carousel can suspend swiping

  This file intentionally does NOT contain:

    * media carousel navigation
    * attachment loading or fallback selection
    * lightbox controls
*/

import clsx from 'clsx';
import { PureComponent } from 'react';

import { userTouching } from '@/is-mobile.ts';

const MIN_SCALE = 1;
const CLICK_SCALE = 2;
const MAX_SCALE = 4;

type Point = { x: number; y: number };

const getMidpoint = (p1: React.Touch, p2: React.Touch): Point => ({
  x: (p1.clientX + p2.clientX) / 2,
  y: (p1.clientY + p2.clientY) / 2,
});

const getDistance = (p1: React.Touch, p2: React.Touch): number =>
  Math.sqrt(Math.pow(p1.clientX - p2.clientX, 2) + Math.pow(p1.clientY - p2.clientY, 2));

const clamp = (min: number, max: number, value: number): number => Math.min(max, Math.max(min, value));

interface IZoomableImage {
  alt?: string;
  src: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onClick?: React.MouseEventHandler;
  onZoomChange?(zoomed: boolean): void;
}

class ZoomableImage extends PureComponent<IZoomableImage> {

  static defaultProps = {
    alt: '',
    width: null,
    height: null,
  };

  state = {
    scale: MIN_SCALE,
  };

  container: HTMLDivElement | null = null;
  image: HTMLImageElement | null = null;
  lastDistance = 0;

  componentDidMount() {
    this.container?.addEventListener('touchstart', this.handleTouchStart);
    // on Chrome 56+, touch event listeners will default to passive
    // https://www.chromestatus.com/features/5093566007214080
    this.container?.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.container?.addEventListener('touchend', this.handleTouchEnd);
  }

  componentDidUpdate(prevProps: IZoomableImage) {
    if (prevProps.src !== this.props.src && this.state.scale !== MIN_SCALE) {
      this.setState({ scale: MIN_SCALE }, () => this.props.onZoomChange?.(false));
    }
  }

  componentWillUnmount() {
    this.container?.removeEventListener('touchstart', this.handleTouchStart);
    this.container?.removeEventListener('touchmove', this.handleTouchMove);
    this.container?.removeEventListener('touchend', this.handleTouchEnd);

    if (this.state.scale !== MIN_SCALE) {
      this.props.onZoomChange?.(false);
    }
  }

  handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    const [p1, p2] = Array.from(e.touches);

    this.lastDistance = getDistance(p1, p2);
  };

  handleTouchMove = (e: TouchEvent) => {
    if (!this.container) return;

    if (e.touches.length === 1 && this.state.scale > MIN_SCALE) {
      // prevent propagating event to MediaModal
      e.stopPropagation();
      return;
    }
    if (e.touches.length !== 2) return;

    e.preventDefault();
    e.stopPropagation();

    const [p1, p2] = Array.from(e.touches);
    const distance = getDistance(p1, p2);

    if (this.lastDistance <= 0) {
      this.lastDistance = distance;
      return;
    }

    const midpoint = getMidpoint(p1, p2);
    const scale = clamp(MIN_SCALE, MAX_SCALE, this.state.scale * distance / this.lastDistance);

    this.zoom(scale, midpoint);

    this.lastDistance = distance;
  };

  handleTouchEnd = () => {
    this.lastDistance = 0;
  };

  zoom(nextScale: number, midpoint: Point) {
    if (!this.container) return;

    const { scale } = this.state;
    const { scrollLeft, scrollTop } = this.container;

    // math memo:
    // x = (scrollLeft + midpoint.x) / scrollWidth
    // x' = (nextScrollLeft + midpoint.x) / nextScrollWidth
    // scrollWidth = clientWidth * scale
    // scrollWidth' = clientWidth * nextScale
    // Solve x = x' for nextScrollLeft
    const nextScrollLeft = (scrollLeft + midpoint.x) * nextScale / scale - midpoint.x;
    const nextScrollTop = (scrollTop + midpoint.y) * nextScale / scale - midpoint.y;

    const wasZoomed = scale > MIN_SCALE;
    const isZoomed = nextScale > MIN_SCALE;

    this.setState({ scale: nextScale }, () => {
      if (!this.container) return;
      this.container.scrollLeft = nextScrollLeft;
      this.container.scrollTop = nextScrollTop;

      if (wasZoomed !== isZoomed) {
        this.props.onZoomChange?.(isZoomed);
      }
    });
  }

  handleClick: React.MouseEventHandler<HTMLImageElement> = e => {
    // don't propagate event to MediaModal
    e.stopPropagation();

    /*
      Touch users need a single tap to retain the lightbox control toggle.
      Pinch gestures already provide precise zoom on those devices. Desktop
      users otherwise have no discoverable way to enlarge an individual image.
    */
    if (!userTouching.matches && this.container) {
      const bounds = this.container.getBoundingClientRect();
      const midpoint = {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      };
      const nextScale = this.state.scale === MIN_SCALE ? CLICK_SCALE : MIN_SCALE;

      this.zoom(nextScale, midpoint);
    }

    this.props.onClick?.(e);
  };

  setContainerRef = (c: HTMLDivElement) => {
    this.container = c;
  };

  setImageRef = (c: HTMLImageElement) => {
    this.image = c;
  };

  render() {
    const { alt, src, onError } = this.props;
    const { scale } = this.state;
    const overflow = scale === 1 ? 'hidden' : 'scroll';

    return (
      <div
        className='relative flex size-full items-center justify-center'
        ref={this.setContainerRef}
        style={{ overflow }}
      >
        <img
          role='presentation'
          ref={this.setImageRef}
          alt={alt}
          className={clsx('size-auto max-h-[80%] max-w-full object-contain', {
            'cursor-zoom-in': scale === MIN_SCALE,
            'size-full max-h-full cursor-zoom-out': scale !== MIN_SCALE,
          })}
          title={alt}
          src={src}
          onError={onError}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
          onClick={this.handleClick}
        />
      </div>
    );
  }

}

export default ZoomableImage;

/* end of src/features/ui/components/zoomable-image.tsx */
