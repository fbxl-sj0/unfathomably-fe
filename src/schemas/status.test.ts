import { describe, expect, it } from 'vitest';

import { buildStatus } from '@/jest/factory.ts';

describe('statusSchema', () => {
  it('preserves Rebased bookmark folder metadata', () => {
    const status = buildStatus({
      pleroma: {
        bookmark_folder: 'folder-1',
      },
    });

    expect(status.pleroma?.bookmark_folder).toBe('folder-1');
  });

  it('preserves remote comments-enabled metadata', () => {
    const status = buildStatus({
      pleroma: {
        comments_enabled: false,
      },
    });

    expect(status.pleroma?.comments_enabled).toBe(false);
  });

  it('preserves bounded native ActivityPub status metadata', () => {
    const status = buildStatus({
      pleroma: {
        native: {
          canonical_id: 'https://books.example.test/reviews/1',
          class: 'status',
          context: 'https://books.example.test/reviews/1',
          controls: ['open'],
          fields: {
            in_reply_to_book: 'https://books.example.test/books/1',
            rating: 4.5,
          },
          type: 'Review',
        },
      },
    });

    expect(status.pleroma?.native).toEqual(expect.objectContaining({
      class: 'status',
      controls: ['open'],
      type: 'Review',
    }));
    expect(status.pleroma?.native?.fields.rating).toBe(4.5);
  });
});
