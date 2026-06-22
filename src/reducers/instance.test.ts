import { describe, expect, it } from 'vitest';

import { ADMIN_CONFIG_UPDATE_REQUEST } from '@/actions/admin.ts';

import reducer from './instance.ts';

describe('instance reducer', () => {
  it('should return the initial state', () => {
    const result = reducer(undefined, {} as any);

    const expected = {
      configuration: {
        chats: {
          max_characters: Infinity,
          max_media_attachments: Infinity,
        },
        statuses: {
          max_characters: Infinity,
          max_media_attachments: Infinity,
        },
        polls: {
          max_options: Infinity,
          max_characters_per_option: Infinity,
          min_expiration: Infinity,
          max_expiration: Infinity,
        },
      },
      registrations: {
        approval_required: false,
        enabled: false,
      },
      version: '0.0.0',
    };

    expect(result).toMatchObject(expected);
  });

  describe('ADMIN_CONFIG_UPDATE_REQUEST', async () => {
    const { configs } = await import('@/__fixtures__/pleroma-admin-config.json');

    it('imports the configs', () => {
      const action = {
        type: ADMIN_CONFIG_UPDATE_REQUEST,
        configs,
      };

      // The normalizer has `registrations: closed` by default
      const state = reducer(undefined, {} as any);
      expect(state.registrations.enabled).toBe(false);

      // After importing the configs, registration will be open
      // @ts-ignore don't know why the type is not working
      const result = reducer(state, action);
      expect(result.registrations.enabled).toBe(true);
    });
  });
});
