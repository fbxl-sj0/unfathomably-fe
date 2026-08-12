/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/preview-card.tsx

  Purpose:

    Render a link, photo, or embedded-media preview inside a status.

  Responsibilities:

    * preserve the configured light, dark, or black visual theme
    * expose clear preview and external-source actions
    * open photo previews through the shared media viewer

  This file intentionally does NOT contain:

    * remote metadata fetching
    * arbitrary embed validation
    * status interaction controls
*/

import externalLinkIcon from '@tabler/icons/outline/external-link.svg';
import linkIcon from '@tabler/icons/outline/link.svg';
import playerPlayIcon from '@tabler/icons/outline/player-play.svg';
import zoomInIcon from '@tabler/icons/outline/zoom-in.svg';
import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Blurhash from '@/components/blurhash.tsx';
import BrowserLink from '@/components/browser-link.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Stack from '@/components/ui/stack.tsx';
import SvgIcon from '@/components/ui/svg-icon.tsx';
import Text from '@/components/ui/text.tsx';
import { normalizeAttachment } from '@/normalizers/index.ts';
import { Attachment } from '@/schemas/index.ts';
import { addAutoPlay } from '@/utils/media.ts';
import { getTextDirection } from '@/utils/rtl.ts';

import type { Card as CardEntity } from '@/types/entities.ts';

const messages = defineMessages({
  openMedia: { id: 'preview_card.open_media', defaultMessage: 'Open media preview' },
  openSource: { id: 'preview_card.open_source', defaultMessage: 'Open original source' },
});

/** Props for `PreviewCard`. */
interface IPreviewCard {
  card: CardEntity;
  maxTitle?: number;
  maxDescription?: number;
  onOpenMedia: (attachments: readonly Attachment[], index: number) => void;
  compact?: boolean;
  defaultWidth?: number;
  cacheWidth?: (width: number) => void;
  horizontal?: boolean;
}

/** Displays a Mastodon link preview. Similar to OEmbed. */
const PreviewCard: React.FC<IPreviewCard> = ({
  card,
  defaultWidth = 467,
  maxTitle = 120,
  maxDescription = 200,
  compact = false,
  cacheWidth,
  onOpenMedia,
  horizontal,
}): JSX.Element => {
  const intl = useIntl();
  const ref = useRef<HTMLElement>(null);

  const [width, setWidth] = useState(defaultWidth);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setEmbedded(false);
  }, [card.url]);

  const direction = getTextDirection(card.title + card.description);

  const trimmedTitle = trim(card.title, maxTitle);
  const trimmedDescription = trim(card.description, maxDescription);
  const provider = card.provider_name || hostname(card.url);

  useEffect(() => {
    if (ref.current) {
      const { offsetWidth } = ref.current;
      cacheWidth?.(offsetWidth);
      setWidth(offsetWidth);
    }
  }, [ref.current]);

  const handlePhotoClick = () => {
    const attachment = normalizeAttachment({
      type: 'image',
      url: card.embed_url || card.image || card.url,
      description: trimmedTitle,
      meta: {
        original: {
          width: card.width,
          height: card.height,
        },
      },
    }).toJS();

    onOpenMedia([{ ...attachment, blurhash: attachment.blurhash === undefined ? null : attachment.blurhash } as Attachment], 0);
  };

  const handleEmbedClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();

    if (card.type === 'photo') {
      handlePhotoClick();
    } else {
      setEmbedded(true);
    }
  };

  const renderVideo = () => {
    const content = { __html: addAutoPlay(card.html) };
    const ratio = getRatio(card);
    const height = width / ratio;

    return (
      <div
        className='relative w-full flex-none overflow-hidden'
        dangerouslySetInnerHTML={content}
        style={{ height }}
      />
    );
  };

  const getRatio = (card: CardEntity): number => {
    const ratio = (card.width / card.height) || 16 / 9;

    // Constrain to a sane limit
    // https://en.wikipedia.org/wiki/Aspect_ratio_(image)
    return Math.min(Math.max(9 / 16, ratio), 4);
  };

  const interactive = card.type !== 'link';
  horizontal = typeof horizontal === 'boolean' ? horizontal : interactive || embedded;
  const className = clsx(
    'flex overflow-hidden rounded-lg border border-solid border-gray-200 text-sm text-gray-800 no-underline black:border-gray-800 black:text-gray-200 dark:border-gray-700 dark:text-gray-200',
    {
      '!block': horizontal,
      'border-gray-200 black:border-gray-800 dark:border-gray-700': compact,
      interactive,
      'flex flex-col md:flex-row': card.type === 'link',
    },
  );
  const ratio = getRatio(card);
  const height = (compact && !embedded) ? (width / (16 / 9)) : (width / ratio);

  const title = interactive ? (
    <BrowserLink
      onClick={(e) => e.stopPropagation()}
      href={card.url}
      title={trimmedTitle}
      rel='noopener'
      target='_blank'
      dir={direction}
    >
      <span dir={direction}>{trimmedTitle}</span>
    </BrowserLink>
  ) : (
    <span title={trimmedTitle} dir={direction}>{trimmedTitle}</span>
  );

  const description = (
    <Stack space={2} className='flex-1 overflow-hidden p-4'>
      {trimmedTitle && (
        <Text weight='bold' direction={direction}>{title}</Text>
      )}
      {trimmedDescription && (
        <Text direction={direction}>{trimmedDescription}</Text>
      )}
      <HStack space={1} alignItems='center'>
        <Text tag='span' theme='muted'>
          <SvgIcon src={linkIcon} />
        </Text>
        <Text tag='span' theme='muted' size='sm' direction={direction}>
          {provider}
        </Text>
      </HStack>
    </Stack>
  );

  let embed: React.ReactNode = null;

  const canvas = (
    <Blurhash
      className='absolute inset-0 -z-10 size-full'
      hash={card.blurhash}
    />
  );

  const thumbnail = (
    <div
      style={{
        backgroundImage: `url(${card.image})`,
        width: horizontal ? width : undefined,
        height: horizontal ? height : undefined,
      }}
      className='block size-full bg-cover bg-center object-cover'
    />
  );

  if (interactive) {
    if (embedded) {
      embed = renderVideo();
    } else {
      let iconVariant = playerPlayIcon;

      if (card.type === 'photo') {
        iconVariant = zoomInIcon;
      }

      embed = (
        <div className='relative w-full flex-none overflow-hidden' style={{ flex: '0 0 40%' }}>
          {canvas}
          {thumbnail}

          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='flex items-center justify-center rounded-full bg-primary-700/90 px-4 py-3 text-white shadow-md backdrop-blur-sm'>
              <HStack space={3} alignItems='center'>
                <button
                  onClick={handleEmbedClick}
                  className='appearance-none text-white/90 hover:text-white'
                  aria-label={intl.formatMessage(messages.openMedia)}
                  title={intl.formatMessage(messages.openMedia)}
                >
                  <SvgIcon
                    src={iconVariant}
                    className='size-6 text-inherit'
                  />
                </button>

                {horizontal && (
                  <BrowserLink
                    onClick={(e) => e.stopPropagation()}
                    href={card.url}
                    target='_blank'
                    rel='noopener'
                    className='text-white/90 hover:text-white'
                    aria-label={intl.formatMessage(messages.openSource)}
                    title={intl.formatMessage(messages.openSource)}
                  >
                    <SvgIcon
                      src={externalLinkIcon}
                      className='size-6 text-inherit'
                    />
                  </BrowserLink>
                )}
              </HStack>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={className} ref={ref as React.RefObject<HTMLDivElement>}>
        {embed}
        {description}
      </div>
    );
  } else if (card.image) {
    embed = (
      <div className={clsx(
        'relative overflow-hidden',
        'w-full flex-none rounded-l md:size-auto md:flex-auto',
        {
          'h-auto': horizontal,
          'h-[200px]': !horizontal,
        },
      )}
      >
        {canvas}
        {thumbnail}
      </div>
    );
  }

  return (
    <BrowserLink
      href={card.url}
      className={clsx(className, 'cursor-pointer hover:bg-gray-100 hover:no-underline black:hover:bg-primary-900/30 dark:hover:bg-primary-800/30')}
      target='_blank'
      rel='noopener'
      ref={ref as React.RefObject<HTMLAnchorElement>}
      onClick={e => e.stopPropagation()}
    >
      {embed}
      {description}
    </BrowserLink>
  );
};

/** Trim the text, adding ellipses if it's too long. */
function trim(text: string, len: number): string {
  const cut = text.indexOf(' ', len);

  if (cut === -1) {
    return text;
  }

  return text.substring(0, cut) + (text.length > len ? '…' : '');
}

function hostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

export default PreviewCard;

/* end of src/components/preview-card.tsx */
