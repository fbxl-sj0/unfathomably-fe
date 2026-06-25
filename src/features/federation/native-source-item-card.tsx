/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/federation/native-source-item-card.tsx

  Purpose:

    Render source preview items with native-feeling layouts for common
    fediverse platform families.

  Responsibilities:

    * choose a stable card layout from platform_family/render_hint metadata
    * expose obvious primary actions such as play, read, view, join, or RSVP
    * preserve a safe generic ActivityPub fallback

  This file intentionally does NOT contain:

    * source fetching
    * follow/unfollow state
    * platform detection heuristics
*/

import pictureInPictureIcon from '@tabler/icons/outline/picture-in-picture.svg';
import clsx from 'clsx';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import SvgIcon from '@/components/ui/svg-icon.tsx';
import { useFloatingMediaPlayer, type FloatingMediaItem, type FloatingMediaKind } from '@/contexts/floating-media-player-context.tsx';
import type { SourceItem } from '@/schemas/source-item.ts';

import CapabilityChips from './capability-chips.tsx';
import PlatformBadge from './platform-badge.tsx';
import { FEDERATION_RENDER_HINTS, normalizeFederationFamily, type FederationFamily, type FederationPrimaryAction } from './platform.ts';

interface INativeSourceItemCard {
  item: SourceItem;
}

const actionMessages = defineMessages<FederationPrimaryAction>({
  play: { id: 'federation.source_item.action.play', defaultMessage: 'Play' },
  read: { id: 'federation.source_item.action.read', defaultMessage: 'Read' },
  reply: { id: 'federation.source_item.action.reply', defaultMessage: 'Open thread' },
  view: { id: 'federation.source_item.action.view', defaultMessage: 'View' },
  join: { id: 'federation.source_item.action.join', defaultMessage: 'View community' },
  rsvp: { id: 'federation.source_item.action.rsvp', defaultMessage: 'View event' },
  open: { id: 'federation.source_item.action.open', defaultMessage: 'Open' },
});

const dockMessages = defineMessages({
  playDocked: { id: 'federation.source_item.action.play_docked', defaultMessage: 'Play docked' },
});

const familyIntroMessages = defineMessages<FederationFamily>({
  audio: { id: 'federation.source_item.audio', defaultMessage: 'Track' },
  video: { id: 'federation.source_item.video', defaultMessage: 'Video' },
  longform: { id: 'federation.source_item.longform', defaultMessage: 'Article' },
  microblog: { id: 'federation.source_item.microblog', defaultMessage: 'Post' },
  photo: { id: 'federation.source_item.photo', defaultMessage: 'Image' },
  books: { id: 'federation.source_item.books', defaultMessage: 'Book' },
  bookmarks: { id: 'federation.source_item.bookmarks', defaultMessage: 'Bookmark' },
  groups: { id: 'federation.source_item.groups', defaultMessage: 'Community' },
  events: { id: 'federation.source_item.events', defaultMessage: 'Event' },
  local: { id: 'federation.source_item.local', defaultMessage: 'Local item' },
  generic: { id: 'federation.source_item.generic', defaultMessage: 'ActivityPub item' },
});

const familyClasses: Record<FederationFamily, string> = {
  audio: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20',
  video: 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20',
  longform: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-950/20',
  microblog: 'border-violet-200 bg-violet-50/80 dark:border-violet-900/60 dark:bg-violet-950/20',
  photo: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20',
  books: 'border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/30',
  bookmarks: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/20',
  groups: 'border-lime-200 bg-lime-50/80 dark:border-lime-900/60 dark:bg-lime-950/20',
  events: 'border-orange-200 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/20',
  local: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30',
  generic: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30',
};

const NativeSourceItemCard: React.FC<INativeSourceItemCard> = ({ item }) => {
  const intl = useIntl();
  const { playItem } = useFloatingMediaPlayer();
  const family = normalizeFederationFamily(item.platform_family);
  const hint = nativeRenderHint(item, family);
  const href = item.url || item.media_url || item.id;
  const dockItem = toFloatingMediaItem(item, family);
  const dockLabel = intl.formatMessage(dockMessages.playDocked);

  return (
    <article
      className={clsx(
        'rounded-xl border border-solid p-3 shadow-sm',
        familyClasses[family],
      )}
      data-family={family}
      data-testid='native-source-item-card'
    >
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        <PlatformBadge family={family} label={item.platform_label} />
        <span className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'>
          <FormattedMessage {...familyIntroMessages[family]} />
        </span>

        {item.source_kind_label ? (
          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
            {item.source_kind_label}
          </span>
        ) : null}
      </div>

      {renderVisual(item, family)}

      <a
        className='block text-base font-semibold text-gray-900 hover:underline dark:text-gray-100'
        href={href}
        target='_blank'
        rel='noopener'
      >
        {item.title}
      </a>

      {item.summary ? (
        <p className='mt-1 line-clamp-3 text-sm text-gray-700 dark:text-gray-300'>
          {item.summary}
        </p>
      ) : null}

      {renderFamilyDetails(item, family)}

      {item.capabilities.length ? (
        <div className='mt-3'>
          <CapabilityChips labels={item.capabilities} />
        </div>
      ) : null}

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        {renderMediaControl(item, family)}

        {dockItem ? (
          <button
            aria-label={dockLabel}
            className='inline-flex size-9 items-center justify-center rounded-md border border-solid border-primary-200 bg-white text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:bg-gray-900 dark:text-primary-300 dark:hover:bg-primary-950/40'
            onClick={() => playItem(dockItem)}
            title={dockLabel}
            type='button'
          >
            <SvgIcon className='size-5' src={pictureInPictureIcon} />
          </button>
        ) : null}

        <a
          className='inline-flex rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700'
          href={href}
          target='_blank'
          rel='noopener'
        >
          <FormattedMessage {...actionMessages[hint.primaryAction]} />
        </a>
      </div>
    </article>
  );
};

function nativeRenderHint(item: SourceItem, family: FederationFamily) {
  const fallback = FEDERATION_RENDER_HINTS[family];

  return {
    layout: item.render_hint?.layout ?? fallback.layout,
    primaryAction: normalizePrimaryAction(item.render_hint?.primary_action, fallback.primaryAction),
  };
}

function normalizePrimaryAction(value: unknown, fallback: FederationPrimaryAction): FederationPrimaryAction {
  if (typeof value === 'string' && value in actionMessages) {
    return value as FederationPrimaryAction;
  }

  return fallback;
}

function renderVisual(item: SourceItem, family: FederationFamily) {
  const imageUrl = item.thumbnail_url || (family === 'photo' ? item.media_url : null);

  if (!imageUrl) {
    return null;
  }

  return (
    <a href={item.url || item.id} target='_blank' rel='noopener' className='mb-3 block overflow-hidden rounded-lg'>
      <img
        alt={item.title}
        className={clsx(
          'w-full object-cover',
          family === 'photo' ? 'max-h-80' : 'max-h-40',
        )}
        loading='lazy'
        src={imageUrl}
      />
    </a>
  );
}

function renderMediaControl(item: SourceItem, family: FederationFamily) {
  if (!item.media_url) {
    return null;
  }

  if (family === 'audio' || item.media_type?.startsWith('audio/')) {
    return (
      <audio className='min-w-48 flex-1' controls preload='none' src={item.media_url}>
        <a href={item.media_url}>
          <FormattedMessage id='federation.source_item.open_audio' defaultMessage='Open audio' />
        </a>
      </audio>
    );
  }

  if (family === 'video' || item.media_type?.startsWith('video/')) {
    return (
      <video className='max-h-56 min-w-48 flex-1 rounded-lg' controls preload='metadata' src={item.media_url}>
        <a href={item.media_url}>
          <FormattedMessage id='federation.source_item.open_video' defaultMessage='Open video' />
        </a>
      </video>
    );
  }

  return null;
}

function toFloatingMediaItem(item: SourceItem, family: FederationFamily): FloatingMediaItem | null {
  if (!item.media_url) {
    return null;
  }

  const kind = floatingMediaKind(item, family);

  if (!kind) {
    return null;
  }

  return {
    id: item.id,
    kind,
    mediaType: item.media_type,
    mediaUrl: item.media_url,
    platformLabel: item.platform_label,
    sourceKindLabel: item.source_kind_label,
    thumbnailUrl: item.thumbnail_url,
    title: item.title,
    url: item.url || item.media_url || item.id,
  };
}

function floatingMediaKind(item: SourceItem, family: FederationFamily): FloatingMediaKind | null {
  if (family === 'audio' || item.media_type?.startsWith('audio/')) {
    return 'audio';
  }

  if (family === 'video' || item.media_type?.startsWith('video/')) {
    return 'video';
  }

  return null;
}

function renderFamilyDetails(item: SourceItem, family: FederationFamily) {
  if (family === 'events') {
    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {item.event_start ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.event_start_label' defaultMessage='Starts: ' />
            </dt>
            <dd className='inline'>{item.event_start}</dd>
          </div>
        ) : null}

        {item.location ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.location_label' defaultMessage='Location: ' />
            </dt>
            <dd className='inline'>{item.location}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (family === 'audio' && hasAudioDetails(item)) {
    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {item.artists.length ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.artist_label' defaultMessage='Artist: ' />
            </dt>
            <dd className='inline'>{item.artists.join(', ')}</dd>
          </div>
        ) : null}

        {item.album ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.album_label' defaultMessage='Album: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(item.album, item.album_url)}</dd>
          </div>
        ) : null}

        {item.duration ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.duration_label' defaultMessage='Duration: ' />
            </dt>
            <dd className='inline'>{item.duration}</dd>
          </div>
        ) : null}

        {item.media_bitrate ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.bitrate_label' defaultMessage='Bitrate: ' />
            </dt>
            <dd className='inline'>{formatBitrate(item.media_bitrate)}</dd>
          </div>
        ) : null}

        {item.media_size ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.size_label' defaultMessage='Size: ' />
            </dt>
            <dd className='inline'>{formatMediaSize(item.media_size)}</dd>
          </div>
        ) : null}

        {item.license ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.license_label' defaultMessage='License: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(formatExternalLabel(item.license), item.license)}</dd>
          </div>
        ) : null}

        {item.copyright ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.copyright_label' defaultMessage='Copyright: ' />
            </dt>
            <dd className='inline'>{item.copyright}</dd>
          </div>
        ) : null}

        {item.musicbrainz_url ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.musicbrainz_label' defaultMessage='MusicBrainz: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(item.musicbrainz_id || 'Recording', item.musicbrainz_url)}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (family === 'groups') {
    return (
      <div className='mt-2 space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300'>
        <p>
          <FormattedMessage id='federation.source_item.community_hint' defaultMessage='Follow the community to bring its discussions into your timelines.' />
        </p>
        {typeof item.comments_count === 'number' ? (
          <p>
            <FormattedMessage
              id='federation.source_item.comments_count'
              defaultMessage='{count, plural, one {# comment} other {# comments}}'
              values={{ count: item.comments_count }}
            />
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

function hasAudioDetails(item: SourceItem) {
  return Boolean(
    item.artists.length ||
      item.album ||
      item.duration ||
      item.media_bitrate ||
      item.media_size ||
      item.license ||
      item.copyright ||
      item.musicbrainz_url,
  );
}

function renderLinkedValue(label: string, href: string | null) {
  if (!href || !isHttpUrl(href)) {
    return label;
  }

  return (
    <a className='hover:underline' href={href} target='_blank' rel='noopener'>
      {label}
    </a>
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_e) {
    return false;
  }
}

function formatExternalLabel(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/$/, '');

    return `${url.hostname}${path}`;
  } catch (_e) {
    return value;
  }
}

function formatBitrate(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)} kbps`;
  }

  return `${value} bps`;
}

function formatMediaSize(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

export default NativeSourceItemCard;

/* end of src/features/federation/native-source-item-card.tsx */
