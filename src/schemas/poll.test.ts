import { describe, expect, it } from 'vitest';

import { pollSchema } from './poll.ts';

describe('normalizePoll()', () => {
  it('adds base fields', () => {
    const poll = { id: '1', options: [{ title: 'Apples' }, { title: 'Oranges' }] };
    const result = pollSchema.parse(poll);

    const expected = {
      options: [
        { title: 'Apples', votes_count: 0 },
        { title: 'Oranges', votes_count: 0 },
      ],
      emojis: [],
      expired: false,
      multiple: false,
      voters_count: 0,
      votes_count: 0,
      own_votes: null,
      voted: false,
    };

    expect(result).toMatchObject(expected);
  });

  it('normalizes a Pleroma logged-out poll', async () => {
    const { poll } = await import('@/__fixtures__/pleroma-status-with-poll.json');
    const result = pollSchema.parse(poll);

    // Adds logged-in fields
    expect(result.voted).toBe(false);
    expect(result.own_votes).toBe(null);
  });

  it('treats a poll with a past expiry as expired', () => {
    const poll = {
      id: 'expired',
      expired: false,
      expires_at: '2000-01-01T00:00:00.000Z',
      options: [{ title: 'Yes' }, { title: 'No' }],
    };

    expect(pollSchema.parse(poll).expired).toBe(true);
  });
});
