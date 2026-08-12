/*
 * Unfathomably FE
 * File: account.test.tsx
 * Purpose: Cover standard account-row identity and badge presentation.
 * This file intentionally does not exercise network account resolution.
 */

import { describe, expect, it } from 'vitest';

import { buildAccount } from '@/jest/factory.ts';
import { render, screen } from '@/jest/test-helpers.tsx';

import Account from './account.tsx';

describe('<Account />', () => {
  it('renders account name and username', () => {
    const account = buildAccount({
      id: '1',
      acct: 'justin-username',
      display_name: 'Justin L',
      avatar: 'test.jpg',
    });

    const store = {
      accounts: {
        '1': account,
      },
    };

    render(<Account account={account} />, undefined, store);
    expect(screen.getByTestId('account')).toHaveTextContent('Justin L');
    expect(screen.getByTestId('account')).toHaveTextContent(/justin-username/i);
  });

  it('renders a Nostr address instead of the internal mirror handle', () => {
    const account = buildAccount({
      id: '1',
      acct: 'nostr-mirror-handle',
      display_name: 'Alice',
      nostr: {
        kind: 'mirror_profile',
        nip05: 'alice@example.com',
        pubkey: 'a'.repeat(64),
        relays: [],
      },
    });

    render(<Account account={account} />);

    expect(screen.getByTestId('account')).toHaveTextContent('alice@example.com');
    expect(screen.getByTestId('account')).not.toHaveTextContent('@nostr-mirror-handle');
    expect(screen.getByLabelText('Nostr')).toBeInTheDocument();
  });

  it.each([
    ['AT Protocol', { atproto: { did: 'did:plc:alice', mirror: true } }],
    ['diaspora*', { diaspora: { id: 'alice@diaspora.example', guid: '0123456789abcdef', mirror: true } }],
  ])('renders a %s protocol favicon for mirror accounts', (label, identity) => {
    const account = buildAccount({
      id: '1',
      acct: 'protocol-mirror',
      display_name: 'Alice',
      ...identity,
    });

    render(<Account account={account} />);

    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  describe('verification badge', () => {
    it('renders verification badge', () => {
      const account = buildAccount({
        id: '1',
        acct: 'justin-username',
        display_name: 'Justin L',
        avatar: 'test.jpg',
        verified: true,
      });

      const store = {
        accounts: {
          '1': account,
        },
      };

      render(<Account account={account} />, undefined, store);
      expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
    });

    it('does not render verification badge', () => {
      const account = buildAccount({
        id: '1',
        acct: 'justin-username',
        display_name: 'Justin L',
        avatar: 'test.jpg',
        verified: false,
      });

      const store = {
        accounts: {
          '1': account,
        },
      };

      render(<Account account={account} />, undefined, store);
      expect(screen.queryAllByTestId('verified-badge')).toHaveLength(0);
    });
  });
});

/* end of account.test.tsx */
