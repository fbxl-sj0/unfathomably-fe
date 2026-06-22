import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Counter from './counter.tsx';
import './tabs.css';

const HORIZONTAL_PADDING = 8;

interface ActiveRect {
  left: number;
  top: number;
  width: number;
}

/** Structure to represent a tab. */
export type Item = {
  /** Tab text. */
  text: React.ReactNode;
  /** Tab tooltip text. */
  title?: string;
  /** URL to visit when the tab is selected. */
  href?: string;
  /** Route to visit when the tab is selected. */
  to?: string;
  /** Callback when the tab is selected. */
  action?: () => void;
  /** Display a counter over the tab. */
  count?: number;
  /** Unique name for this tab. */
  name: string;
  /** Display a notificationicon over the tab */
  notification?: boolean;
}

interface ITabs {
  /** Array of structured tab items. */
  items: Item[];
  /** Name of the active tab item. */
  activeItem: string;
}

/** Animated tabs component. */
const Tabs = ({ items, activeItem }: ITabs) => {
  const history = useHistory();
  const listRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [activeRect, setActiveRect] = useState<ActiveRect | null>(null);

  const activeIndex = Math.max(items.findIndex(({ name }) => name === activeItem), 0);

  const measureActiveTab = () => {
    const list = listRef.current;
    const tab = tabRefs.current[items[activeIndex]?.name];

    if (!list || !tab) return;

    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    setActiveRect({
      left: tabRect.left - listRect.left + HORIZONTAL_PADDING,
      top: tabRect.bottom - listRect.top,
      width: tabRect.width - HORIZONTAL_PADDING * 2,
    });
  };

  useLayoutEffect(() => {
    measureActiveTab();

    window.addEventListener('resize', measureActiveTab);

    return () => {
      window.removeEventListener('resize', measureActiveTab);
    };
  }, [activeItem, items.length]);

  const selectItem = (item: Item) => {
    if (typeof item.action === 'function') {
      item.action();
    } else if (item.to) {
      history.push(item.to);
    } else if (item.href) {
      window.location.href = item.href;
    }
  };

  const renderItem = (item: Item, idx: number) => {
    const { name, text, title, count, notification } = item;
    const selected = idx === activeIndex;

    return (
      <button
        aria-selected={selected}
        className='tab'
        data-soapbox-tab
        data-selected={selected || undefined}
        key={name}
        onClick={() => selectItem(item)}
        ref={(element) => {
          tabRefs.current[name] = element;
        }}
        role='tab'
        title={title}
        type='button'
      >
        <div className='relative'>
          {count ? (
            <span className='absolute left-full ml-2'>
              <Counter count={count} />
            </span>
          ) : null}

          <div className='relative flex items-center justify-center gap-1.5'>
            {text}
            {notification && <div className='absolute -right-4 size-2 animate-pulse rounded-full bg-primary-500' />}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div data-soapbox-tabs>
      <div
        className='absolute h-[3px] w-full bg-primary-200 dark:bg-gray-800'
        style={{ top: activeRect?.top ?? 0 }}
      />
      <div
        className={clsx('absolute h-[3px] bg-primary-500 transition-all duration-200', {
          'hidden': !activeRect,
        })}
        style={{
          left: activeRect?.left ?? 0,
          top: activeRect?.top ?? 0,
          width: activeRect?.width ?? 0,
        }}
      />
      <div data-soapbox-tab-list ref={listRef} role='tablist'>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
};

export default Tabs;
