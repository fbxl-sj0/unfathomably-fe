/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/schemas/account.test.ts

  Purpose:

    Prove multi-type ActivityPub actors retain their native actor vocabulary.

  Responsibilities:

    * parse the stable legacy actor type
    * retain every advertised ForgeFed actor type

  This file intentionally does NOT contain:

    * actor discovery
    * account rendering
    * federation requests
*/

import { describe, expect, it } from 'vitest';

import { buildAccount } from '@/jest/factory.ts';

describe('accountSchema actor types', () => {
  it('preserves every advertised ForgeFed actor type', () => {
    const account = buildAccount({
      pleroma: {
        actor_types: ['Repository', 'TicketTracker', 'PatchTracker'],
      },
      source: {
        pleroma: {
          actor_type: 'Repository',
          actor_types: ['Repository', 'TicketTracker', 'PatchTracker'],
        },
      },
    });

    expect(account.pleroma.actor_types).toEqual(['Repository', 'TicketTracker', 'PatchTracker']);
    expect(account.source?.pleroma?.actor_type).toBe('Repository');
    expect(account.source?.pleroma?.actor_types).toEqual(['Repository', 'TicketTracker', 'PatchTracker']);
  });

  it('preserves bounded native presentation for a Manyfold model actor', () => {
    const account = buildAccount({
      pleroma: {
        native: {
          canonical_id: 'https://manyfold.example/models/model-123',
          class: 'resource',
          context: 'https://manyfold.example/collections/calibration',
          controls: ['open'],
          fields: {
            license: 'MIT',
          },
          type: '3DModel',
        },
      },
    });

    expect(account.pleroma.native?.type).toBe('3DModel');
    expect(account.pleroma.native?.fields.license).toBe('MIT');
    expect(account.pleroma.native?.controls).toEqual(['open']);
  });
});

/* end of src/schemas/account.test.ts */
