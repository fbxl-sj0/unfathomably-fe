/*
 * Project: Unfathomably FE
 * File: utils/quote-fallback.test.ts
 * Purpose: Protect quote fallback URL validation.
 * Responsibilities: Cover accepted web URLs and rejected active or credentialed URLs.
 * This file intentionally does not render status cards or contact remote servers.
 */

import { describe, expect, it } from 'vitest';

import { quoteFallbackUrl } from './quote-fallback.ts';

describe('quoteFallbackUrl', () => {
  it('accepts ordinary HTTP and HTTPS quote targets', () => {
    expect(quoteFallbackUrl('https://remote.example/objects/1')).toBe('https://remote.example/objects/1');
    expect(quoteFallbackUrl('http://remote.example/objects/1')).toBe('http://remote.example/objects/1');
  });

  it('rejects active, credentialed, malformed, and oversized targets', () => {
    expect(quoteFallbackUrl('javascript:alert(1)')).toBeNull();
    expect(quoteFallbackUrl('https://user:secret@remote.example/objects/1')).toBeNull();
    expect(quoteFallbackUrl('not a URL')).toBeNull();
    expect(quoteFallbackUrl(`https://remote.example/${'x'.repeat(2000)}`)).toBeNull();
  });
});

/* end of utils/quote-fallback.test.ts */
