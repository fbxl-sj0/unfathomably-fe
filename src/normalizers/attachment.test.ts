import { Record as ImmutableRecord } from 'immutable';
import { describe, expect, it } from 'vitest';

import { normalizeAttachment } from './attachment.ts';

describe('normalizeAttachment()', () => {
  it('adds base fields', () => {
    const attachment = {};
    const result = normalizeAttachment(attachment);

    expect(ImmutableRecord.isRecord(result)).toBe(true);
    expect(result.type).toEqual('unknown');
    expect(result.url).toEqual('');
  });

  it('infers preview_url from url', () => {
    const attachment = { url: 'https://site.fedi/123.png' };
    const result = normalizeAttachment(attachment);

    expect(result.preview_url).toEqual('https://site.fedi/123.png');
  });

  it('infers image type from remote image URLs with generic MIME types', () => {
    const attachment = {
      type: 'unknown',
      url: 'https://social.example/proxy/hash/file.jpeg',
      remote_url: 'https://lemmy.example/pictrs/image/file.jpeg',
      pleroma: {
        mime_type: 'application/octet-stream',
      },
    };
    const result = normalizeAttachment(attachment);

    expect(result.type).toEqual('image');
  });
});
