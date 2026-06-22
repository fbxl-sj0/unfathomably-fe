/*
  Project: Unfathomably FE
  File: features/ui/components/modals/policy-modal.test.tsx

  Purpose:
    Verify the policy acknowledgement modal.

  Responsibilities:
    Check that a pending policy is shown and that confirming the modal calls
    the acceptance mutation before closing.

  This file intentionally does NOT contain:
    Policy API client tests or modal root registry tests.
*/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@/jest/test-helpers.tsx';

import PolicyModal from './policy-modal.tsx';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  pendingPolicy: { pending_policy_id: 'policy-1' } as { pending_policy_id: string } | null,
}));

vi.mock('@/queries/policies.ts', () => ({
  useAcceptPolicy: () => ({
    isPending: false,
    mutate: mocks.mutate,
  }),
  usePendingPolicy: () => ({
    data: mocks.pendingPolicy,
  }),
}));

describe('<PolicyModal />', () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.pendingPolicy = { pending_policy_id: 'policy-1' };
  });

  it('accepts the pending policy and closes', () => {
    const onClose = vi.fn();
    mocks.mutate.mockImplementation((_policyId, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });

    render(<PolicyModal onClose={onClose} />);

    expect(screen.getByText('Policy update')).toBeInTheDocument();
    expect(screen.getByText('Policy: policy-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Accept and continue' }));

    expect(mocks.mutate).toHaveBeenCalledWith('policy-1', expect.objectContaining({
      onSuccess: expect.any(Function),
    }));
    expect(onClose).toHaveBeenCalledWith('POLICY');
  });

  it('renders nothing when no policy is pending', () => {
    const onClose = vi.fn();
    mocks.pendingPolicy = null;

    render(<PolicyModal onClose={onClose} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

/* end of features/ui/components/modals/policy-modal.test.tsx */
