import { supportsPassiveEvents } from 'detect-passive-events';
import { useEffect, useRef } from 'react';
import { SketchPicker, ColorChangeHandler } from 'react-color';

import { isMobile } from '@/is-mobile.ts';

const listenerOptions = supportsPassiveEvents ? { passive: true } : false;

interface IColorPicker {
  style?: React.CSSProperties;
  overlayRef?: React.RefCallback<HTMLElement>;
  value: string;
  onChange: ColorChangeHandler;
  onClose: () => void;
}

const ColorPicker: React.FC<IColorPicker> = ({ style, overlayRef, value, onClose, onChange }) => {
  const node = useRef<HTMLDivElement>(null);

  const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
    if (node.current && !node.current.contains(e.target as HTMLElement)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, false);
    document.addEventListener('touchend', handleDocumentClick, listenerOptions);

    return () => {
      document.removeEventListener('click', handleDocumentClick, false);
      document.removeEventListener('touchend', handleDocumentClick);
    };
  }, []);

  const pickerStyle: React.CSSProperties = {
    ...style,
    marginLeft: isMobile(window.innerWidth) ? '20px' : '12px',
    position: 'absolute',
    zIndex: 1000,
  };

  const setNode = (element: HTMLDivElement | null) => {
    node.current = element;
    overlayRef?.(element);
  };

  return (
    <div id='SketchPickerContainer' ref={setNode} style={pickerStyle}>
      <SketchPicker color={value} disableAlpha onChange={onChange} />
    </div>
  );
};

export default ColorPicker;
