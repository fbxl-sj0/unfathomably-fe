import { List as ImmutableList } from 'immutable';

import { EmojiReaction, emojiReactionSchema } from '@/schemas/index.ts';

// https://emojipedia.org/facebook
// I've customized them.
export const ALLOWED_EMOJI = ImmutableList([
  '👍',
  '❤️',
  '😆',
  '😮',
  '😢',
  '😩',
]);

export const sortEmoji = (emojiReacts: ImmutableList<EmojiReaction>, allowedEmoji: ImmutableList<string>): ImmutableList<EmojiReaction> => (
  emojiReacts
    .sortBy(emojiReact =>
      -((emojiReact.count || 0) + Number(allowedEmoji.includes(emojiReact.name))))
);

export const mergeEmojiFavourites = (emojiReacts: ImmutableList<EmojiReaction> | null, favouritesCount: number, favourited: boolean) => {
  if (!emojiReacts) return ImmutableList([emojiReactionSchema.parse({ count: favouritesCount, me: favourited, name: '👍' })]);
  if (!favouritesCount) return emojiReacts;
  const likeIndex = emojiReacts.findIndex(emojiReact => emojiReact.name === '👍');
  if (likeIndex > -1) {
    const likeCount = Number(emojiReacts.getIn([likeIndex, 'count']));
    favourited = favourited || Boolean(emojiReacts.getIn([likeIndex, 'me'], false));
    return emojiReacts
      .setIn([likeIndex, 'count'], likeCount + favouritesCount)
      .setIn([likeIndex, 'me'], favourited);
  } else {
    return emojiReacts.push(emojiReactionSchema.parse({ count: favouritesCount, me: favourited, name: '👍' }));
  }
};

export const reduceEmoji = (emojiReacts: ImmutableList<EmojiReaction> | null, favouritesCount: number, favourited: boolean, allowedEmoji = ALLOWED_EMOJI): ImmutableList<EmojiReaction> => (
  sortEmoji(
    mergeEmojiFavourites(emojiReacts, favouritesCount, favourited),
    allowedEmoji,
  ));

export const getReactForStatus = (status: any, allowedEmoji = ALLOWED_EMOJI): EmojiReaction | undefined => {
  if (!status.reactions) return;

  const result = reduceEmoji(
    status.reactions,
    status.favourites_count || 0,
    status.favourited,
    allowedEmoji,
  ).filter(e => e.me === true)
    .get(0);

  return typeof result?.name === 'string' ? result : undefined;
};

const safeEmojiReaction = (reaction: unknown): EmojiReaction | undefined => {
  const result = emojiReactionSchema.safeParse(reaction);
  return result.success ? result.data : undefined;
};

export const simulateEmojiReact = (emojiReacts: ImmutableList<EmojiReaction>, emoji: string, url?: string) => {
  const idx = emojiReacts.findIndex(e => e.name === emoji);
  const emojiReact = emojiReacts.get(idx);

  if (idx > -1 && emojiReact) {
    const reaction = safeEmojiReaction({
      ...emojiReact,
      count: (emojiReact.count || 0) + 1,
      me: true,
      url: url ?? emojiReact.url,
    });

    return reaction ? emojiReacts.set(idx, reaction) : emojiReacts;
  } else {
    const reaction = safeEmojiReaction({
      count: 1,
      me: true,
      name: emoji,
      url,
    });

    return reaction ? emojiReacts.push(reaction) : emojiReacts;
  }
};

export const simulateUnEmojiReact = (emojiReacts: ImmutableList<EmojiReaction>, emoji: string) => {
  const idx = emojiReacts.findIndex(e =>
    e.name === emoji && e.me === true);

  const emojiReact = emojiReacts.get(idx);

  if (emojiReact) {
    const newCount = (emojiReact.count || 1) - 1;
    if (newCount < 1) return emojiReacts.delete(idx);
    const reaction = safeEmojiReaction({
      ...emojiReact,
      count: (emojiReact.count || 1) - 1,
      me: false,
    });

    return reaction ? emojiReacts.set(idx, reaction) : emojiReacts;
  } else {
    return emojiReacts;
  }
};
