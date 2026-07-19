import clsx from 'clsx';
import { PureComponent } from 'react';

import ZoomableImage from './zoomable-image.tsx';

type EventRemover = () => void;

interface IImageLoader {
  alt?: string;
  src: string;
  fallbackSrc?: string | null;
  previewSrc?: string;
  width?: number;
  height?: number;
  onClick?: React.MouseEventHandler;
  onZoomChange?(zoomed: boolean): void;
}

class ImageLoader extends PureComponent<IImageLoader> {

  static defaultProps = {
    alt: '',
    width: null,
    height: null,
  };

  state = {
    loading: true,
    error: false,
    width: null,
    src: '',
  };

  removers: EventRemover[] = [];
  canvas: HTMLCanvasElement | null = null;
  _canvasContext: CanvasRenderingContext2D | null = null;

  get canvasContext() {
    if (!this.canvas) {
      return null;
    }
    this._canvasContext = this._canvasContext || this.canvas.getContext('2d');
    return this._canvasContext;
  }

  componentDidMount() {
    this.loadImage(this.props, this.props.src);
  }

  componentDidUpdate(prevProps: IImageLoader) {
    if (prevProps.src !== this.props.src || prevProps.fallbackSrc !== this.props.fallbackSrc) {
      this.loadImage(this.props, this.props.src);
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  loadImage(props: IImageLoader, src: string, triedFallback = false) {
    this.removeEventListeners();
    this.setState({ loading: true, error: false, src });
    Promise.all([
      props.previewSrc && this.loadPreviewCanvas(props).catch(() => undefined),
      this.hasSize() && this.loadOriginalImage(src),
    ].filter(Boolean))
      .then(() => {
        this.setState({ loading: false, error: false });
        this.clearPreviewCanvas();
      })
      .catch(() => {
        if (!triedFallback && props.fallbackSrc && props.fallbackSrc !== src) {
          this.loadImage(props, props.fallbackSrc, true);
        } else {
          this.setState({ loading: false, error: true });
        }
      });
  }

  loadPreviewCanvas = ({ previewSrc, width, height }: IImageLoader) => new Promise<void>((resolve, reject) => {
    const image = new Image();
    const removeEventListeners = () => {
      image.removeEventListener('error', handleError);
      image.removeEventListener('load', handleLoad);
    };
    const handleError = () => {
      removeEventListeners();
      reject();
    };
    const handleLoad = () => {
      removeEventListeners();
      this.canvasContext?.drawImage(image, 0, 0, width || 0, height || 0);
      resolve();
    };
    image.addEventListener('error', handleError);
    image.addEventListener('load', handleLoad);
    image.src = previewSrc || '';
    this.removers.push(removeEventListeners);
  });

  clearPreviewCanvas() {
    if (this.canvas && this.canvasContext) {
      const { width, height } = this.canvas;
      this.canvasContext.clearRect(0, 0, width, height);
    }
  }

  loadOriginalImage = (src: string) => new Promise<void>((resolve, reject) => {
    const image = new Image();
    const removeEventListeners = () => {
      image.removeEventListener('error', handleError);
      image.removeEventListener('load', handleLoad);
    };
    const handleError = () => {
      removeEventListeners();
      reject();
    };
    const handleLoad = () => {
      removeEventListeners();
      resolve();
    };
    image.addEventListener('error', handleError);
    image.addEventListener('load', handleLoad);
    image.src = src;
    this.removers.push(removeEventListeners);
  });

  removeEventListeners() {
    this.removers.forEach(listeners => listeners());
    this.removers = [];
  }

  hasSize() {
    const { width, height } = this.props;
    return typeof width === 'number' && typeof height === 'number';
  }

  setCanvasRef = (c: HTMLCanvasElement) => {
    this.canvas = c;
    if (c) this.setState({ width: c.offsetWidth });
  };

  handleImageError = () => {
    const { fallbackSrc } = this.props;
    const { src } = this.state;

    if (fallbackSrc && fallbackSrc !== src) {
      this.setState({ src: fallbackSrc, error: false });
    }
  };

  render() {
    const { alt, width, height, onClick, onZoomChange } = this.props;
    const { loading, src } = this.state;

    const className = 'relative h-screen flex items-center justify-center flex-col';

    return (
      <div className={className}>
        {loading ? (
          <canvas
            className={clsx('max-h-full max-w-full object-contain', { 'hidden': !this.hasSize() })}
            style={{
              background: 'url(\'../assets/images/void.png\') repeat',
            }}
            ref={this.setCanvasRef}
            width={width}
            height={height}
          />
        ) : (
          <ZoomableImage
            alt={alt}
            src={src}
            onError={this.handleImageError}
            onClick={onClick}
            onZoomChange={onZoomChange}
          />
        )}
      </div>
    );
  }

}

export default ImageLoader;
