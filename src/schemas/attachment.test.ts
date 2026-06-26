import { describe, expect, it } from 'vitest';

import { attachmentSchema } from './attachment.ts';

describe('attachmentSchema', () => {
  it('infers image attachments from octet-stream image URLs', () => {
    const attachment = attachmentSchema.parse({
      id: '1',
      type: 'unknown',
      url: 'https://social.example/proxy/hash/file.jpeg',
      preview_url: 'https://social.example/proxy/preview/hash/file.jpeg',
      remote_url: 'https://lemmy.example/pictrs/image/file.jpeg',
      pleroma: {
        mime_type: 'application/octet-stream',
      },
    });

    expect(attachment.type).toEqual('image');
  });
});
