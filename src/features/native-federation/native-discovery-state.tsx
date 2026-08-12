/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-state.tsx

  Purpose:

    Present empty and error states as ordinary rows within World timelines.

  Responsibilities:

    * keep specialized discovery states aligned with normal feed spacing
    * honor configured light, dark, and black themes
    * place optional recovery or discovery actions consistently
    * expose muted and danger tones without imposing provider-specific copy

  This file intentionally does NOT contain:

    * provider or federation terminology
    * retry and request behavior
    * family-specific empty-state guidance
*/

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import Text from '@/components/ui/text.tsx';

interface INativeDiscoveryState {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  onRetry?: () => void;
  tone?: 'danger' | 'muted';
}

const NativeDiscoveryState = ({ action, children, className, onRetry, tone = 'muted' }: INativeDiscoveryState) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    className={clsx(
      'bg-white px-5 py-8 text-center black:bg-black dark:bg-primary-900',
      className,
    )}
  >
    <Text
      align='center'
      size='sm'
      theme='inherit'
      className={clsx(
        'mx-auto max-w-lg leading-6',
        tone === 'danger'
          ? 'text-red-700 black:text-red-300 dark:text-red-300'
          : 'text-gray-600 black:text-gray-300 dark:text-gray-300',
      )}
    >
      {children}
    </Text>

    {action}

    {onRetry && (
      <Button
        className='mt-3'
        size='sm'
        theme='primary'
        onClick={() => onRetry()}
      >
        <FormattedMessage id='native_discovery.retry' defaultMessage='Try again' />
      </Button>
    )}
  </div>
);

export default NativeDiscoveryState;

/* end of src/features/native-federation/native-discovery-state.tsx */
