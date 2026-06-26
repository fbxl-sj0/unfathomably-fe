import { describe, expect, it } from 'vitest';

import { getStatusTranslationAvailability, getTargetLanguage } from './status-translation.ts';

const status = {
  account: {
    local: false,
  },
  content: '<p>Bonjour</p>',
  language: 'fr',
  visibility: 'public',
};

describe('getTargetLanguage', () => {
  it('falls back to the base locale when the exact locale is not supported', () => {
    expect(getTargetLanguage('en-US', ['de', 'en'])).toBe('en');
  });
});

describe('getStatusTranslationAvailability', () => {
  it('keeps the inline button hidden when the status already appears to be in the target language', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      me: '1',
      status: {
        ...status,
        language: 'en',
      },
      targetLanguages: ['en'],
    }).canTranslate).toBe(false);
  });

  it('allows the manual menu item even when language detection says the post is already in the target language', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      manual: true,
      me: '1',
      status: {
        ...status,
        language: 'en',
      },
      targetLanguages: ['en'],
    }).canTranslate).toBe(true);
  });

  it('allows the manual menu item when the detected source language is outside the configured source list', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      manual: true,
      me: '1',
      sourceLanguages: ['fr'],
      status: {
        ...status,
        language: 'ja',
      },
      targetLanguages: ['en'],
    }).canTranslate).toBe(true);
  });

  it('allows the inline button for remote posts with unknown source languages', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      me: '1',
      sourceLanguages: ['auto', 'fr'],
      status: {
        ...status,
        language: null,
      },
      targetLanguages: ['en'],
    }).canTranslate).toBe(true);
  });

  it('does not offer manual translation for direct posts', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      manual: true,
      me: '1',
      status: {
        ...status,
        visibility: 'direct',
      },
      targetLanguages: ['en'],
    }).canTranslate).toBe(false);
  });

  it('allows show-original even if the target language is no longer configured', () => {
    expect(getStatusTranslationAvailability({
      allowRemote: true,
      featuresEnabled: true,
      locale: 'en',
      manual: true,
      me: '1',
      status: {
        ...status,
        translation: {},
      },
      targetLanguages: ['de'],
    }).canTranslate).toBe(true);
  });
});
