import { HotKeys as _HotKeys, type HotKeysProps, type HotKeyMap } from '@mkljczk/react-hotkeys';
import { forwardRef } from 'react';

/**
 * Wrapper component around `react-hotkeys`.
 * `react-hotkeys` is a legacy component, so confining its import to one place is beneficial.
 */
type IHotKeys = {
  attach?: Element | Window;
  attachRef?: React.RefObject<Element | null>;
  children?: React.ReactNode;
  component?: keyof JSX.IntrinsicElements | React.ComponentType;
  focused?: boolean;
  handlers?: HotKeysProps['handlers'];
  keyMap?: HotKeyMap;
  onBlur?: React.FocusEventHandler<Element>;
  onFocus?: React.FocusEventHandler<Element>;
};

const LegacyHotKeys = _HotKeys as React.ComponentType<any>;

const HotKeys = forwardRef<any, IHotKeys>(({ children, ...rest }, ref) => (
  <LegacyHotKeys {...rest} ref={ref}>
    {children}
  </LegacyHotKeys>
));

export { HotKeys, type IHotKeys };
