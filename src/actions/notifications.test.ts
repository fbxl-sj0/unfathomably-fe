import { describe, expect, it } from 'vitest';

import { normalizeGroupedNotificationsPayload } from './notifications.ts';

describe('normalizeGroupedNotificationsPayload()', () => {
  it('turns grouped API rows into renderable notifications', () => {
    const account = {
      id: '10',
      acct: 'alice@example.com',
      display_name: 'Alice',
    };

    const status = {
      id: '20',
      content: 'hello',
    };

    const result = normalizeGroupedNotificationsPayload({
      accounts: [account],
      statuses: [status],
      notification_groups: [{
        group_key: 'favourite-20-100',
        type: 'favourite',
        notifications_count: 3,
        most_recent_notification_id: '30',
        latest_page_notification_at: '2026-06-23T15:00:00.000Z',
        sample_account_ids: ['10'],
        status_id: '20',
      }],
    });

    expect(result).toEqual([{
      id: '30',
      group_key: 'favourite-20-100',
      type: 'favourite',
      created_at: '2026-06-23T15:00:00.000Z',
      account,
      status,
      total_count: 3,
    }]);
  });

  it('falls back to the group key when a server omits a representative notification id', () => {
    const account = {
      id: '10',
      acct: 'alice@example.com',
      display_name: 'Alice',
    };

    const result = normalizeGroupedNotificationsPayload({
      accounts: [account],
      notification_groups: [{
        group_key: 'follow-1-100',
        type: 'follow',
        notifications_count: 2,
        sample_account_ids: ['10'],
      }],
    });

    expect(result[0]).toMatchObject({
      id: 'follow-1-100',
      group_key: 'follow-1-100',
      type: 'follow',
      account,
      total_count: 2,
    });
  });
});
