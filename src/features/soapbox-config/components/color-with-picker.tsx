import { useState, useRef } from 'react';
import Overlay from 'react-overlays/Overlay';

import { isMobile } from '@/is-mobile.ts';

import ColorPicker from './color-picker.tsx';

import type { ColorChangeHandler } from 'react-color';
import type { Placement } from 'react-overlays/esm/usePopper';

interface IColorWithPicker {
  value: string;
  onChange: ColorChangeHandler;
  className?: string;
}

const ColorWithPicker: React.FC<IColorWithPicker> = ({ value, onChange, className }) => {
  const node = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [placement, setPlacement] = useState<Placement>('bottom');

  const hidePicker = () => {
    setActive(false);
  };

  const showPicker = () => {
    setActive(true);
    setPlacement(isMobile(window.innerWidth) ? 'bottom' : 'right');
  };

  const onToggle: React.MouseEventHandler = (e) => {
    if (active) {
      hidePicker();
    } else {
      showPicker();
    }

    e.stopPropagation();
  };

  return (
    <div className={className}>
      <div
        ref={node}
        className='size-full'
        role='presentation'
        style={{ background: value }}
        title={value}
        onClick={onToggle}
      />

      <Overlay show={active} placement={placement} target={node.current}>
        {({ props }: { props: { ref: React.RefCallback<HTMLElement>; style: React.CSSProperties } }) => (
          <ColorPicker value={value} onChange={onChange} onClose={hidePicker} style={props.style} overlayRef={props.ref} />
        )}
      </Overlay>
    </div>
  );
};

export default ColorWithPicker;
