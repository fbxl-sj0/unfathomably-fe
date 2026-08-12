import parse, { HTMLReactParserOptions, Text as DOMText, DOMNode, Element, domToReact } from 'html-react-parser';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import HashtagLink from '@/components/hashtag-link.tsx';
import Mention from '@/components/mention.tsx';
import BrowserLink from '@/components/browser-link.tsx';
import { CustomEmoji } from '@/schemas/custom-emoji.ts';
import { Mention as MentionEntity } from '@/schemas/mention.ts';
import { sameHttpUrl } from '@/utils/compare-urls.ts';
import { emojifyText } from '@/utils/emojify.tsx';

import Text, { IText } from './ui/text.tsx';
import './markup.css';

interface IMarkup extends Omit<IText, 'children' | 'dangerouslySetInnerHTML'> {
  html: { __html: string };
  mentions?: MentionEntity[];
  emojis?: CustomEmoji[];
  localReferences?: Record<string, string>;
}

const nostrReferenceRegex = /nostr:((?:npub|nprofile|note|nevent|naddr)1[023456789acdefghjklmnpqrstuvwxyz]+)/gi;
const exactNostrReferenceRegex = /^nostr:((?:npub|nprofile|note|nevent|naddr)1[023456789acdefghjklmnpqrstuvwxyz]+)$/i;

const compactNostrReference = (identifier: string) =>
  identifier.length > 24 ? `${identifier.slice(0, 12)}...${identifier.slice(-8)}` : identifier;

const renderTextReferences = (text: string, emojis?: CustomEmoji[]) => {
  const nodes: React.ReactNode[] = [];
  let offset = 0;

  for (const match of text.matchAll(nostrReferenceRegex)) {
    const index = match.index || 0;
    const prefix = text.slice(offset, index);
    if (prefix) nodes.push(emojis ? emojifyText(prefix, emojis) : prefix);

    const identifier = match[1];
    nodes.push(
      <Link key={`${identifier}-${index}`} to={`/${identifier}`} className='text-primary-600 hover:underline dark:text-accent-blue'>
        {compactNostrReference(identifier)}
      </Link>,
    );
    offset = index + match[0].length;
  }

  const suffix = text.slice(offset);
  if (suffix) nodes.push(emojis ? emojifyText(suffix, emojis) : suffix);

  if (nodes.length > 0) return nodes;
  if (emojis) return emojifyText(text, emojis);

  return text;
};

/** Styles HTML markup returned by the API, such as in account bios and statuses. */
const Markup = forwardRef<any, IMarkup>(({ html, emojis, localReferences, mentions, ...props }, ref) => {
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode instanceof Element && ['script', 'iframe'].includes(domNode.name)) {
        return null;
      }

      if (domNode.type === 'text') {
        const textNode = domNode as DOMText;
        const insideLink = textNode.parent?.type === 'tag' && (textNode.parent as Element).name === 'a';
        if (!insideLink) return <>{renderTextReferences(textNode.data, emojis)}</>;
        if (emojis) return <>{emojifyText(textNode.data, emojis)}</>;
      }

      if (domNode instanceof Element && domNode.name === 'a') {
        const href = domNode.attribs.href || '';
        const nostrReference = href.match(exactNostrReferenceRegex)?.[1];

        if (nostrReference) {
          return (
            <Link
              to={`/${nostrReference}`}
              onClick={(e) => e.stopPropagation()}
              title={domNode.attribs.href}
            >
              {compactNostrReference(nostrReference)}
            </Link>
          );
        }

        const classes = domNode.attribs.class?.split(' ');

        if (classes?.includes('hashtag')) {
          const child = domToReact(domNode.children as DOMNode[]);

          const hashtag: string | undefined = (() => {
            // Mastodon wraps the hashtag in a span, with a sibling text node containing the hashtag.
            if (Array.isArray(child) && child.length) {
              if (child[0]?.props?.children === '#' && typeof child[1] === 'string') {
                return child[1];
              }
            }
            // Pleroma renders a string directly inside the hashtag link.
            if (typeof child === 'string') {
              return child.replace(/^#/, '');
            }
          })();

          if (hashtag) {
            return <HashtagLink hashtag={hashtag} />;
          }
        }

        if (classes?.includes('mention')) {
          const mention = mentions?.find(({ url }) => sameHttpUrl(domNode.attribs.href, url));
          if (mention) {
            return <Mention mention={mention} />;
          }
        }

        const { class: className, href: _href, ...attributes } = domNode.attribs;
        const localHref = localReferences?.[href] || href;

        return (

          <BrowserLink
            {...attributes}
            className={className}
            href={localHref}
            onClick={(e) => e.stopPropagation()}
            rel='nofollow noopener'
            target='_blank'
            title={href}
          >
            {domToReact(domNode.children as DOMNode[], options)}
          </BrowserLink>
        );
      }
    },
  };

  const content = parse(html.__html, options);

  return (
    <Text ref={ref} {...props} data-markup>
      {content}
    </Text>
  );
});

export default Markup;
