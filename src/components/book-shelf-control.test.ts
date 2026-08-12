/*
  Unfathomably native book library tests
  ---------------------------------------

  File: src/components/book-shelf-control.test.ts

  Purpose:

    Keep the personal-library response contract aligned with the Elixir API.

  Responsibilities:

    * accept PostgreSQL naive ISO timestamps emitted by Jason
    * retain support for offset-aware ActivityPub timestamps

  This file intentionally does NOT test shelf mutations or remote discovery.
*/

import { describe, expect, it } from 'vitest';

import { shelfResponseSchema } from './book-shelf-control.tsx';

const responseWithTimestamp = (updatedAt: string) => ({
  shelves: [
    {
      id: 'to-read',
      items: [
        {
          book_uri: 'https://openlibrary.org/books/OL7353617M',
          presentation: {
            author: 'J. R. R. Tolkien',
            title: 'The Fellowship of the Ring',
          },
          progress: null,
          progress_mode: null,
          shelf: 'to-read',
          started_at: null,
          finished_at: null,
          updated_at: updatedAt,
        },
      ],
      name: 'Want to read',
    },
  ],
  total: 1,
});

describe('shelfResponseSchema', () => {
  it('accepts the naive ISO timestamp emitted by the Elixir shelf endpoint', () => {
    const response = shelfResponseSchema.parse(responseWithTimestamp('2026-08-11T03:27:43'));

    expect(response.total).toBe(1);
  });

  it('accepts fractional and offset-aware ISO timestamps', () => {
    expect(() => shelfResponseSchema.parse(responseWithTimestamp('2026-08-11T03:27:43.123456Z'))).not.toThrow();
    expect(() => shelfResponseSchema.parse(responseWithTimestamp('2026-08-10T23:27:43-04:00'))).not.toThrow();
  });

  it('rejects malformed timestamps instead of accepting arbitrary date text', () => {
    expect(() => shelfResponseSchema.parse(responseWithTimestamp('next Tuesday'))).toThrow();
  });
});

/* end of src/components/book-shelf-control.test.ts */
