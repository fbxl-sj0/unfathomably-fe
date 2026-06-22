import { List as ImmutableList, fromJS } from 'immutable';
import { describe, expect, it } from 'vitest';

import { normalizeStatus } from '@/normalizers/index.ts';
import { emojiReactionSchema } from '@/schemas/index.ts';

import {
  sortEmoji,
  mergeEmojiFavourites,
  reduceEmoji,
  getReactForStatus,
  simulateEmojiReact,
  simulateUnEmojiReact,
} from './emoji-reacts.ts';

const ALLOWED_EMOJI = ImmutableList([
  '👍',
  '❤',
  '😂',
  '😯',
  '😢',
  '😡',
]);

describe('sortEmoji', () => {
  describe('with an unsorted list of emoji', () => {
    const emojiReacts = ImmutableList([
      { 'count': 7,  'me': true, 'name': '😃' },
      { 'count': 7,  'me': true, 'name': '😯' },
      { 'count': 3,  'me': true, 'name': '😢' },
      { 'count': 1,  'me': true, 'name': '😡' },
      { 'count': 20, 'me': true, 'name': '👍' },
      { 'count': 7,  'me': true, 'name': '😂' },
      { 'count': 15, 'me': true, 'name': '❤' },
    ].map((react) => emojiReactionSchema.parse(react)));
    it('sorts the emoji by count', () => {
      expect(sortEmoji(emojiReacts, ALLOWED_EMOJI).toJS()).toEqual([
        { 'count': 20, 'me': true, 'name': '👍' },
        { 'count': 15, 'me': true, 'name': '❤' },
        { 'count': 7,  'me': true, 'name': '😯' },
        { 'count': 7,  'me': true, 'name': '😂' },
        { 'count': 7,  'me': true, 'name': '😃' },
        { 'count': 3,  'me': true, 'name': '😢' },
        { 'count': 1,  'me': true, 'name': '😡' },
      ]);
    });
  });
});

describe('mergeEmojiFavourites', () => {
  const favouritesCount = 12;
  const favourited = true;

  describe('with existing 👍 reacts', () => {
    const emojiReacts = ImmutableList([
      { 'count': 20, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 15, 'me': false, 'name': '❤', 'url': undefined },
      { 'count': 7,  'me': false, 'name': '😯', 'url': undefined },
    ].map((react) => emojiReactionSchema.parse(react)));
    it('combines 👍 reacts with favourites', () => {
      expect(mergeEmojiFavourites(emojiReacts, favouritesCount, favourited).toJS()).toEqual([
        { 'count': 32, 'me': true,  'name': '👍', 'url': undefined },
        { 'count': 15, 'me': false, 'name': '❤', 'url': undefined },
        { 'count': 7,  'me': false, 'name': '😯', 'url': undefined },
      ]);
    });
  });

  describe('without existing 👍 reacts', () => {
    const emojiReacts = ImmutableList([
      { 'count': 15, 'me': false, 'name': '❤' },
      { 'count': 7,  'me': false, 'name': '😯' },
    ].map((react) => emojiReactionSchema.parse(react)));
    it('adds 👍 reacts to the map equaling favourite count', () => {
      expect(mergeEmojiFavourites(emojiReacts, favouritesCount, favourited).toJS()).toEqual([
        { 'count': 15, 'me': false, 'name': '❤' },
        { 'count': 7,  'me': false, 'name': '😯' },
        { 'count': 12, 'me': true,  'name': '👍' },
      ]);
    });
    it('does not add 👍 reacts when there are no favourites', () => {
      expect(mergeEmojiFavourites(emojiReacts, 0, false).toJS()).toEqual([
        { 'count': 15, 'me': false,  'name': '❤' },
        { 'count': 7,  'me': false,  'name': '😯' },
      ]);
    });
  });
});

describe('reduceEmoji', () => {
  describe('with a clusterfuck of emoji', () => {
    const emojiReacts = ImmutableList([
      { 'count': 1,  'me': false, 'name': '😡' },
      { 'count': 1,  'me': true,  'name': '🔪' },
      { 'count': 7,  'me': true,  'name': '😯' },
      { 'count': 3,  'me': false, 'name': '😢' },
      { 'count': 1,  'me': true,  'name': '🌵' },
      { 'count': 20, 'me': true,  'name': '👍' },
      { 'count': 7,  'me': false, 'name': '😂' },
      { 'count': 15, 'me': true,  'name': '❤' },
      { 'count': 1,  'me': false, 'name': '👀' },
      { 'count': 1,  'me': false, 'name': '🍩' },
    ].map((react) => emojiReactionSchema.parse(react)));
    it('sorts, filters, and combines emoji and favourites', () => {
      expect(reduceEmoji(emojiReacts, 7, true, ALLOWED_EMOJI).toJS()).toEqual([
        { 'count': 27, 'me': true,  'name': '👍' },
        { 'count': 15, 'me': true,  'name': '❤' },
        { 'count': 7,  'me': true,  'name': '😯' },
        { 'count': 7,  'me': false, 'name': '😂' },
        { 'count': 3,  'me': false, 'name': '😢' },
        { 'count': 1,  'me': false, 'name': '😡' },
        { 'count': 1,  'me': true,  'name': '🔪' },
        { 'count': 1,  'me': true,  'name': '🌵' },
        { 'count': 1,  'me': false, 'name': '👀' },
        { 'count': 1,  'me': false, 'name': '🍩' },
      ]);
    });
  });
});

describe('getReactForStatus', () => {
  it('returns a single owned react (including favourite) for the status', () => {
    const status = normalizeStatus(fromJS({
      favourited: false,
      pleroma: {
        emoji_reactions: [
          { 'count': 20, 'me': false, 'name': '👍' },
          { 'count': 15, 'me': true,  'name': '❤' },
          { 'count': 7,  'me': true,  'name': '😯' },
          { 'count': 7,  'me': false, 'name': '😂' },
        ],
      },
    }));
    expect(getReactForStatus(status, ALLOWED_EMOJI)?.name).toEqual('❤');
  });

  it('returns a thumbs-up for a favourite', () => {
    const status = normalizeStatus(fromJS({ favourites_count: 1, favourited: true }));
    expect(getReactForStatus(status)?.name).toEqual('👍');
  });

  it('returns undefined when a status has no reacts (or favourites)', () => {
    const status = normalizeStatus(fromJS({}));
    expect(getReactForStatus(status)).toEqual(undefined);
  });

  it('returns undefined when a status has no valid reacts (or favourites)', () => {
    const status = normalizeStatus(fromJS([
      { 'count': 1,  'me': true,  'name': '🔪' },
      { 'count': 1,  'me': true,  'name': '🌵' },
      { 'count': 1,  'me': false, 'name': '👀' },
      { 'count': 1,  'me': false, 'name': '🍩' },
    ]));
    expect(getReactForStatus(status)).toEqual(undefined);
  });
});

describe('simulateEmojiReact', () => {
  it('adds the emoji to the list', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 2, 'me': false, 'name': '❤', 'url': undefined },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateEmojiReact(emojiReacts, '❤').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 3, 'me': true,  'name': '❤', 'url': undefined },
    ]);
  });

  it('creates the emoji if it didn\'t already exist', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 2, 'me': false, 'name': '❤', 'url': undefined },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateEmojiReact(emojiReacts, '😯').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 2, 'me': false, 'name': '❤', 'url': undefined },
      { 'count': 1, 'me': true,  'name': '😯', 'url': undefined },
    ]);
  });

  it('adds a custom emoji to the list', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 2, 'me': false, 'name': '❤', 'url': undefined },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateEmojiReact(emojiReacts, 'soapbox', 'https://gleasonator.com/emoji/Gleasonator/soapbox.png').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍', 'url': undefined },
      { 'count': 2, 'me': false,  'name': '❤', 'url': undefined },
      { 'count': 1, 'me': true,  'name': 'soapbox', 'url': 'https://gleasonator.com/emoji/Gleasonator/soapbox.png' },
    ]);
  });
});

describe('simulateUnEmojiReact', () => {
  it('removes the emoji from the list', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 3, 'me': true, 'name': '❤' },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateUnEmojiReact(emojiReacts, '❤').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 2, 'me': false,  'name': '❤' },
    ]);
  });

  it('removes the emoji if it\'s the last one in the list', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 2, 'me': false, 'name': '❤' },
      { 'count': 1, 'me': true,  'name': '😯' },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateUnEmojiReact(emojiReacts, '😯').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 2, 'me': false, 'name': '❤' },
    ]);
  });

  it ('removes custom emoji from the list', () => {
    const emojiReacts = ImmutableList([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 2, 'me': false, 'name': '❤' },
      { 'count': 1, 'me': true,  'name': 'soapbox', 'url': 'https://gleasonator.com/emoji/Gleasonator/soapbox.png' },
    ].map((react) => emojiReactionSchema.parse(react)));
    expect(simulateUnEmojiReact(emojiReacts, 'soapbox').toJS()).toEqual([
      { 'count': 2, 'me': false, 'name': '👍' },
      { 'count': 2, 'me': false, 'name': '❤' },
    ]);
  });
});
