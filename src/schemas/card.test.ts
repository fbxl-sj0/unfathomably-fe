import { describe, expect, it } from 'vitest';

import { cardSchema } from './card.ts';

describe('cardSchema', () => {
  it('adds base fields', () => {
    const card = { url: 'https://soapbox.test' };
    const result = cardSchema.parse(card);

    expect(result.type).toEqual('link');
    expect(result.url).toEqual(card.url);
  });

  it('hardens external iframe previews', () => {
    const result = cardSchema.parse({
      html: '<iframe src="https://models.example/embed/1"></iframe>',
      type: 'rich',
      url: 'https://models.example/models/1',
    });
    const document = new DOMParser().parseFromString(result.html, 'text/html');
    const frame = document.querySelector('iframe');

    expect(frame?.getAttribute('loading')).toEqual('lazy');
    expect(frame?.getAttribute('referrerpolicy')).toEqual('no-referrer');
    expect(frame?.getAttribute('scrolling')).toEqual('no');
    expect(frame?.getAttribute('sandbox')).toEqual(
      'allow-scripts allow-pointer-lock allow-same-origin allow-presentation',
    );
  });
});
