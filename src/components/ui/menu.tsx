import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import clsx from 'clsx';
import { createContext, useContext, useEffect, useState } from 'react';

import Portal from './portal.tsx';

import './menu.css';

type MenuPlacement = 'left' | 'right';
type FloatingPlacement = 'bottom-start' | 'bottom-end';

interface MenuContextValue {
  close(): void;
  floating: ReturnType<typeof useFloating<HTMLButtonElement>>;
  open: boolean;
  refs: ReturnType<typeof useFloating>['refs'];
  setPlacement(placement: FloatingPlacement): void;
  setOpen(open: boolean): void;
}

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  [key: string]: any;
}

interface MenuListProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: MenuPlacement;
}

interface MenuItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  as?: React.ElementType;
  onSelect?: React.MouseEventHandler<HTMLButtonElement>;
  [key: string]: any;
}

interface MenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  disabled?: boolean;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const useMenu = () => {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error('Menu components must be rendered inside <Menu>.');
  }

  return context;
};

/** Provides dropdown menu state and floating positioning. */
const Menu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<FloatingPlacement>('bottom-end');
  const floating = useFloating<HTMLButtonElement>({
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    placement,
    whileElementsMounted: autoUpdate,
  });

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        floating.refs.floating.current?.contains(target) ||
        (floating.refs.reference.current as HTMLElement | null)?.contains(target)
      ) {
        return;
      }

      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, floating.refs.floating, floating.refs.reference]);

  return (
    <MenuContext.Provider value={{ close, floating, open, refs: floating.refs, setOpen, setPlacement }}>
      {children}
    </MenuContext.Provider>
  );
};

/** Renders the control that opens and closes a menu. */
const MenuButton = ({ as: Component = 'button', children, onClick, ...props }: MenuButtonProps) => {
  const { open, refs, setOpen } = useMenu();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      setOpen(!open);
    }
  };

  return (
    <Component
      aria-expanded={open}
      aria-haspopup='menu'
      data-soapbox-menu-button
      onClick={handleClick}
      ref={refs.setReference}
      type='button'
      {...props}
    >
      {children}
    </Component>
  );
};

/** Renders menu contents and handles basic keyboard navigation. */
const MenuItems = ({ children, className, onKeyDown, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { close } = useMenu();

  const getItems = (element: HTMLElement): HTMLElement[] => Array.from(
    element.querySelectorAll('[data-soapbox-menu-item], [data-soapbox-menu-link]'),
  );

  const focusItem = (element: HTMLElement, index: number) => {
    const items = getItems(element);
    if (items.length === 0) return;

    const next = ((index % items.length) + items.length) % items.length;
    items[next]?.focus();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const items = getItems(event.currentTarget);
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        focusItem(event.currentTarget, index + 1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        focusItem(event.currentTarget, index - 1);
        event.preventDefault();
        break;
      case 'Home':
        focusItem(event.currentTarget, 0);
        event.preventDefault();
        break;
      case 'End':
        focusItem(event.currentTarget, items.length - 1);
        event.preventDefault();
        break;
      case 'Escape':
        close();
        event.preventDefault();
        break;
    }
  };

  return (
    <div
      data-soapbox-menu-list
      role='menu'
      tabIndex={-1}
      className={className}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
};

/** Renders the floating menu popover. */
const MenuList = ({ position, className, children, ...props }: MenuListProps) => {
  const { floating, open, setPlacement } = useMenu();
  const { x, y, strategy, refs } = floating;

  useEffect(() => {
    setPlacement(position === 'left' ? 'bottom-start' : 'bottom-end');
  }, [position, setPlacement]);

  const content = (
    <MenuItems
      className={clsx(className, 'rounded-lg bg-white py-1 black:bg-black dark:bg-primary-900')}
      {...props}
    >
      {children}
    </MenuItems>
  );

  if (!open) return null;

  return (
    <Portal>
      <div
        data-soapbox-menu-popover
        ref={refs.setFloating}
        style={{
          left: x ?? 0,
          position: strategy,
          top: y ?? 0,
        }}
      >
        {content}
      </div>
    </Portal>
  );
};

/** Renders an actionable menu row. */
const MenuItem = ({ as: Component = 'button', children, className, disabled, onClick, onSelect, ...props }: MenuItemProps) => {
  const { close } = useMenu();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    onSelect?.(event);

    if (!event.defaultPrevented) {
      close();
    }
  };

  return (
    <Component
      data-disabled={disabled || undefined}
      data-soapbox-menu-item
      disabled={disabled}
      onClick={handleClick}
      role='menuitem'
      tabIndex={disabled ? -1 : 0}
      type={Component === 'button' ? 'button' : undefined}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};

/** Renders a menu row that navigates through an anchor. */
const MenuLink = ({ children, className, disabled, href, onClick, ...props }: MenuLinkProps) => {
  const { close } = useMenu();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);

    if (!event.defaultPrevented) {
      close();
    }
  };

  return (
    <a
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-soapbox-menu-link
      href={disabled ? undefined : href}
      onClick={handleClick}
      role='menuitem'
      tabIndex={disabled ? -1 : 0}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
};

/** Divides groups of menu rows. */
const MenuDivider = () => <hr className='mx-2 my-1 border-t border-gray-100 dark:border-gray-800' />;

export { Menu, MenuButton, MenuDivider, MenuItems, MenuItem, MenuList, MenuLink };
export type { MenuListProps };
