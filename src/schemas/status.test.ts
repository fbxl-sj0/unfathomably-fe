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
});
