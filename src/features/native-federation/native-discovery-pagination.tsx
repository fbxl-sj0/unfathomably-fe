/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-pagination.tsx

  Purpose:

    Present paged Worlds discovery results through one consistent Soapbox
    control row.

  Responsibilities:

    * hide pagination when neither direction is available
    * keep previous and next actions visible in stable positions
    * disable navigation while the owning discovery request is in flight
    * recover stale non-first-page offsets after empty or failed requests
    * provide comfortable tap targets on narrow screens

  This file intentionally does NOT contain:

    * page-size or offset arithmetic
    * provider-specific cursor handling
    * discovery request state
*/

import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from '@/components/ui/button.tsx';

import type { ReactNode } from 'react';

interface INativeDiscoveryPagination {
  className?: string;
  empty: boolean;
  failed: boolean;
  hasMore: boolean;
  inset?: boolean;
  label?: ReactNode;
  loading?: boolean;
  offset: number;
  onNext: () => void;
  onPrevious: () => void;
  onRecover: () => void;
}

const NativeDiscoveryPagination = ({
  className,
  empty,
  failed,
  hasMore,
  inset = false,
  label,
  loading = false,
  offset,
  onNext,
  onPrevious,
  onRecover,
}: INativeDiscoveryPagination) => {
  useEffect(() => {
    if (offset > 0 && !loading && (empty || failed)) onRecover();
  }, [empty, failed, loading, offset, onRecover]);

  if (offset <= 0 && !hasMore) return null;

  return (
    <div className={[
      'flex items-center justify-between gap-3',
      inset
        ? 'mt-4'
        : 'border-t border-gray-200 px-4 py-3 black:border-gray-800 dark:border-gray-800 sm:px-5',
      className,
    ].filter(Boolean).join(' ')}
    >
      <Button
        className='min-w-24'
        disabled={offset <= 0 || loading}
        theme='secondary'
        type='button'
        onClick={onPrevious}
      >
        <FormattedMessage id='native_discovery.previous' defaultMessage='Previous' />
      </Button>

      {label && (
        <span className='min-w-0 flex-1 text-center text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>
          {label}
        </span>
      )}

      <Button
        className='min-w-24'
        disabled={!hasMore || loading}
        theme='secondary'
        type='button'
        onClick={onNext}
      >
        <FormattedMessage id='native_discovery.next' defaultMessage='Next' />
      </Button>
    </div>
  );
};

export default NativeDiscoveryPagination;

/* end of src/features/native-federation/native-discovery-pagination.tsx */
