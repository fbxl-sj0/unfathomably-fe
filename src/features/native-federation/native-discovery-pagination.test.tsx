/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-pagination.test.tsx

  Purpose:

    Verify shared Worlds pagination recovery behavior.

  Responsibilities:

    * recover stale non-first-page offsets after empty results
    * avoid recovery when the first page is empty

  This file intentionally does NOT test provider-specific discovery requests.
*/

import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/jest/test-helpers.tsx';

import NativeDiscoveryPagination from './native-discovery-pagination.tsx';

const defaultProps = {
  failed: false,
  hasMore: false,
  loading: false,
  onNext: vi.fn(),
  onPrevious: vi.fn(),
};

describe('<NativeDiscoveryPagination />', () => {
  it('recovers an empty non-first page', async () => {
    const onRecover = vi.fn();

    render(
      <NativeDiscoveryPagination
        {...defaultProps}
        empty
        offset={20}
        onRecover={onRecover}
      />,
    );

    await waitFor(() => expect(onRecover).toHaveBeenCalledOnce());
  });

  it('does not recover an empty first page', () => {
    const onRecover = vi.fn();

    render(
      <NativeDiscoveryPagination
        {...defaultProps}
        empty
        offset={0}
        onRecover={onRecover}
      />,
    );

    expect(onRecover).not.toHaveBeenCalled();
  });
});

/* end of src/features/native-federation/native-discovery-pagination.test.tsx */
