import emojiData, { Emoji as EmojiMart, CustomEmoji as EmojiMartCustom } from '@/features/emoji/data.ts';
import { CustomEmoji } from '@/schemas/custom-emoji.ts';

import { buildCustomEmojis, type Emoji } from './index.ts';

const data = emojiData;

type NativeSearchEntry = {
  key: string;
  id: string;
  idText: string;
  idCompact: string;
  nameText: string;
  nameCompact: string;
  keywordText: string;
  keywordCompact: string;
  order: number;
};

type CustomSearchEntry = {
  index: number;
  text: string;
  compact: string;
};

type SearchHit = {
  score: number;
  order: number;
  emoji: Emoji;
};

const nativeSearchEntries: NativeSearchEntry[] = Object.entries(data.emojis)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([key, emoji], order) => {
    const idText = normalizeText(emoji.id);
    const nameText = normalizeText(emoji.name);
    const keywordText = normalizeText(emoji.keywords.join(' '));

    return {
      key,
      id: emoji.id,
      idText,
      idCompact: compactText(idText),
      nameText,
      nameCompact: compactText(nameText),
      keywordText,
      keywordCompact: compactText(keywordText),
      order,
    };
  });

let customSearchEntries: CustomSearchEntry[] = [];

function normalizeText(value: string): string {
  return value.toLocaleLowerCase().replace(/[_-]+/g, ' ').trim();
}

function compactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, '');
}

function queryTerms(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

function everyTermMatches(terms: string[], text: string, compact: string): boolean {
  return terms.every((term) => text.includes(term) || compact.includes(compactText(term)));
}

function separatedMatchPenalty(id: string, query: string): number {
  return id.includes(`_${query}`) || id.includes(`-${query}`) ? 20 : 0;
}

function scoreNativeEntry(entry: NativeSearchEntry, query: string): number | undefined {
  const text = `${entry.idText} ${entry.nameText} ${entry.keywordText}`;
  const compact = `${entry.idCompact}${entry.nameCompact}${entry.keywordCompact}`;
  const terms = queryTerms(query);

  if (terms.length === 0 || !everyTermMatches(terms, text, compact)) {
    return;
  }

  const normalizedQuery = normalizeText(query);
  const compactQuery = compactText(query);

  if (entry.idText === normalizedQuery || entry.idCompact === compactQuery) {
    return 0;
  }

  if (entry.idText.startsWith(normalizedQuery) || entry.idCompact.startsWith(compactQuery)) {
    return 10;
  }

  if (entry.nameText.startsWith(normalizedQuery) || entry.nameCompact.startsWith(compactQuery)) {
    return 20;
  }

  const idTextIndex = entry.idText.indexOf(normalizedQuery);
  const idCompactIndex = entry.idCompact.indexOf(compactQuery);

  if (idTextIndex >= 0 || idCompactIndex >= 0) {
    const index = Math.min(
      idTextIndex >= 0 ? idTextIndex : Number.MAX_SAFE_INTEGER,
      idCompactIndex >= 0 ? idCompactIndex : Number.MAX_SAFE_INTEGER,
    );

    return 30 + separatedMatchPenalty(entry.id, normalizedQuery) + index;
  }

  if (entry.nameText.includes(normalizedQuery) || entry.nameCompact.includes(compactQuery)) {
    return 60 + entry.nameText.indexOf(terms[0]);
  }

  return 90 + entry.keywordText.indexOf(terms[0]);
}

function scoreCustomEntry(entry: CustomSearchEntry, query: string): number | undefined {
  const terms = queryTerms(query);

  if (terms.length === 0 || !everyTermMatches(terms, entry.text, entry.compact)) {
    return;
  }

  const normalizedQuery = normalizeText(query);
  const compactQuery = compactText(query);

  if (entry.text === normalizedQuery || entry.compact === compactQuery) {
    return 0;
  }

  if (entry.text.startsWith(normalizedQuery) || entry.compact.startsWith(compactQuery)) {
    return 10;
  }

  return 40 + entry.text.indexOf(terms[0]);
}

function nativeEmojiResult(entry: NativeSearchEntry): Emoji | undefined {
  const skins = data.emojis[entry.key]?.skins;

  if (!skins?.[0]) {
    return;
  }

  return {
    id: entry.id,
    colons: ':' + entry.id + ':',
    unified: skins[0].unified,
    native: skins[0].native,
  };
}

export interface searchOptions {
  maxResults?: number;
  custom?: any;
}

export function addCustomToPool(customEmojis: EmojiMart<EmojiMartCustom>[]): void {
  customSearchEntries = customEmojis.map((emoji, index) => {
    const text = normalizeText(`${emoji.id} ${emoji.name} ${emoji.keywords.join(' ')}`);

    return {
      index,
      text,
      compact: compactText(text),
    };
  });
}

// we can share an index by prefixing custom emojis with 'c' and native with 'n'
const search = (
  str: string, { maxResults = 5 }: searchOptions = {},
  customEmojis?: CustomEmoji[],
): Emoji[] => {
  const customHits = customEmojis ? customSearchEntries.flatMap((entry): SearchHit[] => {
    const custom = customEmojis[entry.index];
    const score = scoreCustomEntry(entry, str);

    if (!custom || score === undefined) {
      return [];
    }

    return [{
      score,
      order: entry.index,
      emoji: {
        id: custom.shortcode,
        colons: ':' + custom.shortcode + ':',
        custom: true,
        imageUrl: custom.url,
      },
    }];
  }) : [];

  const nativeHits = nativeSearchEntries.flatMap((entry): SearchHit[] => {
    const score = scoreNativeEntry(entry, str);
    const emoji = nativeEmojiResult(entry);

    if (score === undefined || !emoji) {
      return [];
    }

    return [{
      score,
      order: entry.order,
      emoji,
    }];
  });

  return [...customHits, ...nativeHits]
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, maxResults)
    .map((hit) => hit.emoji);
};

/** Import Mastodon custom emojis as emoji mart custom emojis. */
export function autosuggestPopulate(emojis: CustomEmoji[]) {
  addCustomToPool(buildCustomEmojis(emojis));
}

export default search;
