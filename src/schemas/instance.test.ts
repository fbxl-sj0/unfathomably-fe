import { describe, expect, it } from 'vitest';

import { instanceV1Schema } from './instance.ts';

describe('instanceV1Schema.parse()', () => {
  it('normalizes an empty Map', () => {
    const expected = {
      approval_required: false,
      configuration: {
        chats: {
          max_characters: Infinity,
          max_media_attachments: Infinity,
        },
        groups: {
          max_characters_description: Infinity,
          max_characters_name: Infinity,
        },
        media_attachments: {},
        polls: {
          max_characters_per_option: Infinity,
          max_expiration: Infinity,
          max_options: Infinity,
          min_expiration: Infinity,
        },
        reactions: {
          max_reactions: 0,
        },
        statuses: {
          max_characters: Infinity,
          max_media_attachments: Infinity,
        },
        translation: {
          enabled: false,
        },
        urls: {},
      },
      description: '',
      description_limit: 1500,
      email: '',
      feature_quote: false,
      fedibird_capabilities: [],
      languages: [],
      pleroma: {
        metadata: {
          account_activation_required: false,
          birthday_min_age: 0,
          birthday_required: false,
          description_limit: 1500,
          features: [],
          federation: {
            enabled: true,
          },
          fields_limits: {
            max_fields: 4,
            name_length: 255,
            value_length: 2047,
          },
        },
        oauth_consumer_strategies: [],
        stats: {},
        vapid_public_key: '',
      },
      registrations: false,
      rules: [],
      short_description: '',
      stats: {},
      title: '',
      thumbnail: '',
      uri: '',
      urls: {},
      version: '0.0.0',
    };

    const result = instanceV1Schema.parse({});
    expect(result).toMatchObject(expected);
  });

  it('normalizes Pleroma instance with Mastodon configuration format', async () => {
    const { default: instance } = await import('@/__fixtures__/pleroma-instance.json');

    const expected = {
      configuration: {
        statuses: {
          max_characters: 5000,
          max_media_attachments: Infinity,
        },
        polls: {
          max_options: Infinity,
          max_characters_per_option: Infinity,
          min_expiration: Infinity,
          max_expiration: Infinity,
        },
      },
    };

    const result = instanceV1Schema.parse(instance);
    expect(result).toMatchObject(expected);
  });

  it('normalizes Mastodon instance with retained configuration', async () => {
    const { default: instance } = await import('@/__fixtures__/mastodon-instance.json');

    const expected = {
      configuration: {
        statuses: {
          max_characters: 500,
          max_media_attachments: 4,
          characters_reserved_per_url: 23,
        },
        media_attachments: {
          image_size_limit: 10485760,
          image_matrix_limit: 16777216,
          video_size_limit: 41943040,
          video_frame_rate_limit: 60,
          video_matrix_limit: 2304000,
        },
        polls: {
          max_options: 4,
          max_characters_per_option: 50,
          min_expiration: 300,
          max_expiration: 2629746,
        },
      },
    };

    const result = instanceV1Schema.parse(instance);
    expect(result).toMatchObject(expected);
  });

  it('normalizes Mastodon 3.0.0 instance with default configuration', async () => {
    const { default: instance } = await import('@/__fixtures__/mastodon-3.0.0-instance.json');

    const expected = {
      configuration: {
        statuses: {
          max_characters: Infinity,
          max_media_attachments: Infinity,
        },
        polls: {
          max_options: Infinity,
          max_characters_per_option: Infinity,
          min_expiration: Infinity,
          max_expiration: Infinity,
        },
      },
    };

    const result = instanceV1Schema.parse(instance);
    expect(result).toMatchObject(expected);
  });

  it('normalizes Fedibird instance', async () => {
    const { default: instance } = await import('@/__fixtures__/fedibird-instance.json');
    const result = instanceV1Schema.parse(instance);

    // Sets description_limit
    expect(result.pleroma.metadata.description_limit).toEqual(1500);

    // Preserves fedibird_capabilities
    expect(result.fedibird_capabilities).toEqual(instance.fedibird_capabilities);
  });

  it('normalizes Mitra instance', async () => {
    const { default: instance } = await import('@/__fixtures__/mitra-instance.json');
    const result = instanceV1Schema.parse(instance);

    // Adds configuration and description_limit
    expect(result.configuration).toBeTruthy();
    expect(result.pleroma.metadata.description_limit).toBe(1500);
  });

  it('normalizes GoToSocial instance', async () => {
    const { default: instance } = await import('@/__fixtures__/gotosocial-instance.json');
    const result = instanceV1Schema.parse(instance);

    // Normalizes max_toot_chars
    expect(result.configuration.statuses.max_characters).toEqual(5000);
    expect('max_toot_chars' in result).toBe(false);

    // Adds configuration and description_limit
    expect(result.configuration).toBeTruthy();
    expect(result.pleroma.metadata.description_limit).toBe(1500);
  });

  it('normalizes Friendica instance', async () => {
    const { default: instance } = await import('@/__fixtures__/friendica-instance.json');
    const result = instanceV1Schema.parse(instance);

    // Normalizes max_toot_chars
    expect(result.configuration.statuses.max_characters).toEqual(200000);
    expect('max_toot_chars' in result).toBe(false);

    // Adds configuration and description_limit
    expect(result.configuration).toBeTruthy();
    expect(result.pleroma.metadata.description_limit).toBe(1500);
  });

  it('normalizes a Mastodon RC version', async () => {
    const { default: instance } = await import('@/__fixtures__/mastodon-instance-rc.json');
    const result = instanceV1Schema.parse(instance);

    expect(result.version).toEqual('3.5.0-rc1');
  });

  it('normalizes Pixelfed instance', async () => {
    const { default: instance } = await import('@/__fixtures__/pixelfed-instance.json');
    const result = instanceV1Schema.parse(instance);
    expect(result.title).toBe('pixelfed');
  });

  it('renames Akkoma to Pleroma', async () => {
    const { default: instance } = await import('@/__fixtures__/akkoma-instance.json');
    const result = instanceV1Schema.parse(instance);

    expect(result.version).toEqual('2.7.2 (compatible; Pleroma 2.4.50+akkoma)');

  });
});
