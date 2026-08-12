/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/atproto-link/index.test.tsx

  Purpose:

    Verify the local AT Protocol identity provisioning controls.

  Responsibilities:

    * show the server-selected standards-valid handle
    * submit an explicit provisioning request
    * display the generated PDS password only in the creation response

  This file intentionally does NOT contact a PDS or retain credentials.
*/

import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/jest/test-helpers.tsx';

import ATProtoLink from './index.tsx';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/hooks/useApi.ts', () => ({
  useApi: () => api,
}));

describe('<ATProtoLink />', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.delete.mockReset();

    api.get.mockResolvedValue({
      json: async () => ({
        connected: false,
        provisioning_available: true,
        suggested_handle: 'sj-zero.social.fbxl.net',
      }),
    });

    api.post.mockResolvedValue({
      json: async () => ({
        connected: true,
        managed: true,
        handle: 'sj-zero.social.fbxl.net',
        did: 'did:plc:managedexample',
        pds: 'https://pds.fbxl.net',
        password_shown_once: true,
        account_password: 'one-time-password',
      }),
    });
  });

  it('creates the suggested managed identity and shows its one-time password', async () => {
    render(<ATProtoLink />);

    const createButton = await screen.findByRole('button', {
      name: 'Create @sj-zero.social.fbxl.net',
    });

    await userEvent.click(createButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/atproto/provision', {});
    });

    const password = await screen.findByDisplayValue('one-time-password') as HTMLInputElement;
    expect(password.readOnly).toBe(true);
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
  });

  it('trims a copied handle before exchanging an app password', async () => {
    api.get.mockResolvedValue({
      json: async () => ({
        connected: false,
        provisioning_available: false,
      }),
    });

    render(<ATProtoLink />);

    await userEvent.type(await screen.findByLabelText('Handle or DID'), '  alice.example.com  ');
    await userEvent.click(screen.getByText('Use an app password instead'));
    await userEvent.type(screen.getByLabelText('Bluesky app password'), 'app-password');
    await userEvent.click(screen.getByRole('button', { name: 'Connect account' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/atproto/link', {
        identifier: 'alice.example.com',
        app_password: 'app-password',
      });
    });
  });

  it('starts OAuth without sending a password to the backend', async () => {
    api.get.mockResolvedValue({
      json: async () => ({
        connected: false,
        oauth_available: true,
        provisioning_available: false,
      }),
    });
    api.post.mockReturnValue(new Promise(() => undefined));

    render(<ATProtoLink />);

    await userEvent.type(await screen.findByLabelText('Handle or DID'), 'alice.example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Authorize with Bluesky' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/atproto/oauth/start', {
        identifier: 'alice.example.com',
      });
    });
  });
});

/* end of src/features/atproto-link/index.test.tsx */
