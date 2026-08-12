/*
 * Project: Unfathomably FE
 * File: utils/quote-fallback.ts
 * Purpose: Validate a structured quote's last-resort external link.
 * Responsibilities: Accept only credential-free HTTP(S) URLs with bounded length.
 * This file intentionally does not resolve, fetch, or authorize quoted statuses.
 */

const MAXIMUM_QUOTE_URL_LENGTH = 2000;

const quoteFallbackUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAXIMUM_QUOTE_URL_LENGTH) return null;

  try {
    const parsed = new URL(value);

    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;

    return parsed.toString();
  } catch {
    return null;
  }
};

export { quoteFallbackUrl };

/* end of utils/quote-fallback.ts */
