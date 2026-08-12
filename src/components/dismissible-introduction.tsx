/*
 * Project: Unfathomably FE
 *
 * File: dismissible-introduction.tsx
 *
 * Purpose:
 *   Present optional guidance for unfamiliar application screens.
 *
 * Responsibilities:
 *   - remember an explicit dismissal in browser-local storage
 *   - remain dismissible when persistent storage is unavailable
 *   - provide a consistent and accessible dismissal control
 *
 * This file intentionally does NOT contain:
 *   - page-specific guidance or artwork
 *   - account preference synchronization
 *   - automatic dismissal based only on viewing the panel
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import type { HTMLAttributes, ReactNode } from 'react';

interface DismissibleIntroductionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  storageKey: string;
}

const previouslyDismissed = (storageKey: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(storageKey) === 'true';
  } catch {
    // Hardened browsers may expose localStorage while refusing access to it.
    return false;
  }
};

/** Optional page guidance that stays hidden after an explicit dismissal. */
const DismissibleIntroduction = ({
  children,
  className,
  storageKey,
  ...sectionProps
}: DismissibleIntroductionProps) => {
  const [dismissed, setDismissed] = useState(() => previouslyDismissed(storageKey));

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, 'true');
    } catch {
      // The current page should still honor dismissal when storage is blocked.
    }

    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <section {...sectionProps} className={className}>
      <button
        type='button'
        className='absolute right-3 top-3 z-20 rounded-full border border-primary-700 bg-primary-900/90 px-3 py-1.5 text-xs font-bold text-gray-300 shadow-sm backdrop-blur transition-colors hover:border-primary-400 hover:bg-primary-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 sm:right-4 sm:top-4 rtl:left-3 rtl:right-auto sm:rtl:left-4'
        onClick={dismiss}
      >
        <FormattedMessage id='introduction.dismiss' defaultMessage='Dismiss' />
      </button>

      {children}
    </section>
  );
};

export default DismissibleIntroduction;

/* end of dismissible-introduction.tsx */
