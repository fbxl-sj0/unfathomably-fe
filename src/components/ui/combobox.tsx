import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';

import './combobox.css';

interface ComboboxContextValue {
  activeValue: string | null;
  listId: string;
  options: string[];
  registerOption(value: string): () => void;
  select(value: string): void;
  setActiveValue(value: string | null): void;
}

interface ComboboxProps {
  children: React.ReactNode;
  onSelect(value: string): void;
}

interface ComboboxInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as?: React.ElementType;
  [key: string]: any;
}

interface ComboboxOptionProps extends React.HTMLAttributes<HTMLLIElement> {
  value: string;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

const useCombobox = () => {
  const context = useContext(ComboboxContext);

  if (!context) {
    throw new Error('Combobox components must be rendered inside <Combobox>.');
  }

  return context;
};

/** Provides combobox state for suggestion inputs. */
const Combobox: React.FC<ComboboxProps> = ({ children, onSelect }) => {
  const listId = useId();
  const [options, setOptions] = useState<string[]>([]);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const registerOption = useCallback((option: string) => {
    setOptions((current) => current.includes(option) ? current : [...current, option]);
    setActiveValue((current) => current ?? option);

    return () => {
      setOptions((current) => current.filter((value) => value !== option));
      setActiveValue((current) => current === option ? null : current);
    };
  }, []);

  const value = useMemo<ComboboxContextValue>(() => ({
    activeValue,
    listId,
    options,
    registerOption,
    select: onSelect,
    setActiveValue,
  }), [activeValue, listId, onSelect, options, registerOption]);

  return (
    <ComboboxContext.Provider value={value}>
      {children}
    </ComboboxContext.Provider>
  );
};

const ComboboxInput = forwardRef<HTMLTextAreaElement, ComboboxInputProps>(({
  as: Component = 'textarea',
  onKeyDown,
  ...props
}, ref) => {
  const { activeValue, listId, options, select, setActiveValue } = useCombobox();

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    const index = activeValue ? options.indexOf(activeValue) : -1;

    switch (event.key) {
      case 'ArrowDown':
        if (options.length > 0) {
          setActiveValue(options[(index + 1 + options.length) % options.length]);
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (options.length > 0) {
          setActiveValue(options[(index - 1 + options.length) % options.length]);
          event.preventDefault();
        }
        break;
      case 'Enter':
        if (activeValue) {
          select(activeValue);
          event.preventDefault();
        }
        break;
    }

    onKeyDown?.(event);
  };

  return (
    <Component
      aria-controls={listId}
      aria-expanded={options.length > 0}
      aria-haspopup='listbox'
      data-soapbox-combobox-input
      onKeyDown={handleKeyDown}
      ref={ref}
      role='combobox'
      {...props}
    />
  );
});

/** Renders the suggestion popover wrapper. */
const ComboboxPopover: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div data-soapbox-combobox-popover {...props}>
    {children}
  </div>
);

/** Renders the active suggestion list. */
const ComboboxList: React.FC<React.HTMLAttributes<HTMLUListElement>> = ({ children, ...props }) => {
  const { listId } = useCombobox();

  return (
    <ul data-soapbox-combobox-list id={listId} role='listbox' {...props}>
      {children}
    </ul>
  );
};

/** Registers and renders one selectable suggestion. */
const ComboboxOption: React.FC<ComboboxOptionProps> = ({ children, value, onClick, onMouseDown, onMouseEnter, ...props }) => {
  const { activeValue, registerOption, select, setActiveValue } = useCombobox();

  useEffect(() => registerOption(value), [registerOption, value]);

  const selected = activeValue === value;

  const handleClick: React.MouseEventHandler<HTMLLIElement> = (event) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      select(value);
    }
  };

  const handleMouseDown: React.MouseEventHandler<HTMLLIElement> = (event) => {
    event.preventDefault();
    onMouseDown?.(event);
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLLIElement> = (event) => {
    setActiveValue(value);
    onMouseEnter?.(event);
  };

  return (
    <li
      aria-selected={selected}
      data-soapbox-combobox-option
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      role='option'
      {...props}
    >
      {children}
    </li>
  );
};

/** Marks the visible text used by suggestion renderers. */
const ComboboxOptionText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span data-suggested-value>{children}</span>
);

export {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
  ComboboxOptionText,
};
