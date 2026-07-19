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
  models: { id: 'federation.source_item.models', defaultMessage: '3D model' },
  games: { id: 'federation.source_item.games', defaultMessage: 'Game activity' },
  marketplace: { id: 'federation.source_item.marketplace', defaultMessage: 'Listing' },
  culture: { id: 'federation.source_item.culture', defaultMessage: 'Catalog activity' },
  books: { id: 'federation.source_item.books', defaultMessage: 'Book' },
  bookmarks: { id: 'federation.source_item.bookmarks', defaultMessage: 'Bookmark' },
  groups: { id: 'federation.source_item.groups', defaultMessage: 'Community' },
  events: { id: 'federation.source_item.events', defaultMessage: 'Event' },
  development: { id: 'federation.source_item.development', defaultMessage: 'Development activity' },
  coordination: { id: 'federation.source_item.coordination', defaultMessage: 'Coordination activity' },
  publishing: { id: 'federation.source_item.publishing', defaultMessage: 'Publishing resource' },
  routes: { id: 'federation.source_item.routes', defaultMessage: 'Route' },
  local: { id: 'federation.source_item.local', defaultMessage: 'Local item' },
  generic: { id: 'federation.source_item.generic', defaultMessage: 'ActivityPub item' },
});

const familyClasses: Record<FederationFamily, string> = {
  audio: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20',
  video: 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20',
  longform: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-950/20',
  microblog: 'border-violet-200 bg-violet-50/80 dark:border-violet-900/60 dark:bg-violet-950/20',
  photo: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20',
  models: 'border-teal-200 bg-teal-50/80 dark:border-teal-900/60 dark:bg-teal-950/20',
  games: 'border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/20',
  marketplace: 'border-yellow-200 bg-yellow-50/80 dark:border-yellow-900/60 dark:bg-yellow-950/20',
  culture: 'border-fuchsia-200 bg-fuchsia-50/80 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/20',
  books: 'border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/30',
  bookmarks: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/20',
  groups: 'border-lime-200 bg-lime-50/80 dark:border-lime-900/60 dark:bg-lime-950/20',
  events: 'border-orange-200 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/20',
  development: 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/60 dark:bg-indigo-950/20',
  coordination: 'border-purple-200 bg-purple-50/80 dark:border-purple-900/60 dark:bg-purple-950/20',
  publishing: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/20',
  routes: 'border-green-200 bg-green-50/80 dark:border-green-900/60 dark:bg-green-950/20',
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
  if (family === 'games' && item.native) {
    const fen = nativeField(item, 'fen');
    const game = nativeField(item, 'game');
    const san = nativeField(item, 'san');

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {san !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.game_move_label' defaultMessage='Move: ' />} value={String(san)} /> : null}
        {fen !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.game_position_label' defaultMessage='Position: ' />} value={String(fen)} /> : null}
        {typeof game === 'string' ? <NativeDetail label={<FormattedMessage id='federation.source_item.game_link_label' defaultMessage='Game: ' />} value={renderLinkedValue(formatExternalLabel(game), game)} /> : null}
      </dl>
    );
  }

  if (family === 'marketplace' && item.native) {
    const listingName = nativeField(item, 'listing_name');
    const price = nativeField(item, 'price');
    const currency = nativeField(item, 'currency');
    const latitude = nativeField(item, 'latitude');
    const longitude = nativeField(item, 'longitude');
    const location = latitude !== null && longitude !== null ? `${latitude}, ${longitude}` : null;

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {listingName !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.listing_name_label' defaultMessage='Listing: ' />} value={String(listingName)} /> : null}
        {price !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.listing_price_label' defaultMessage='Price: ' />} value={[price, currency].filter((value) => value !== null).join(' ')} /> : null}
        {location !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.listing_location_label' defaultMessage='Location: ' />} value={location} /> : null}
      </dl>
    );
  }

  if (family === 'models' && item.native) {
    const creator = firstNativeField(item, ['attributed_to', 'creator']);
    const collections = firstNativeField(item, ['collections', 'collection']);
    const license = nativeField(item, 'license');

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {creator !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.model_creator_label' defaultMessage='Creator: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(formatExternalLabel(String(creator)), String(creator))}</dd>
          </div>
        ) : null}

        {collections !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.model_collection_label' defaultMessage='Collection: ' />
            </dt>
            <dd className='inline'>{String(collections)}</dd>
          </div>
        ) : null}

        {license !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.license_label' defaultMessage='License: ' />
            </dt>
            <dd className='inline'>{String(license)}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (family === 'culture' && item.native) {
    const catalogItem = firstNativeField(item, ['catalog_item', 'with_regard_to']);
    const catalogType = nativeField(item, 'catalog_type');
    const rating = nativeField(item, 'rating');
    const ratingBest = nativeField(item, 'rating_best');
    const ratingValue = ratingBest !== null ? [rating, ratingBest].join('/') : String(rating);
    const status = nativeField(item, 'reading_status');

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {rating !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.rating_label' defaultMessage='Rating: ' />
            </dt>
            <dd className='inline'>{ratingValue}</dd>
          </div>
        ) : null}

        {status !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.status_label' defaultMessage='Status: ' />
            </dt>
            <dd className='inline'>{String(status)}</dd>
          </div>
        ) : null}

        {catalogType !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.catalog_type_label' defaultMessage='Catalog type: ' />
            </dt>
            <dd className='inline'>{String(catalogType)}</dd>
          </div>
        ) : null}

        {catalogItem !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.catalog_item_label' defaultMessage='Catalog item: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(formatExternalLabel(String(catalogItem)), String(catalogItem))}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (family === 'books' && item.native) {
    const book = firstNativeField(item, ['in_reply_to_book', 'book', 'edition', 'work']);
    const rating = nativeField(item, 'rating');
    const readingStatus = nativeField(item, 'reading_status');

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {rating !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.rating_label' defaultMessage='Rating: ' />
            </dt>
            <dd className='inline'>{String(rating)}</dd>
          </div>
        ) : null}

        {readingStatus !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.reading_status_label' defaultMessage='Reading status: ' />
            </dt>
            <dd className='inline'>{String(readingStatus)}</dd>
          </div>
        ) : null}

        {book !== null ? (
          <div>
            <dt className='inline font-semibold'>
              <FormattedMessage id='federation.source_item.book_label' defaultMessage='Book: ' />
            </dt>
            <dd className='inline'>{renderLinkedValue(formatExternalLabel(String(book)), String(book))}</dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (family === 'development' && item.native) {
    const target = firstNativeField(item, ['target', 'result', 'managed_by', 'ref']);

    return (
      <div className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        <p className='font-medium'>
          <FormattedMessage
            id='federation.source_item.development_read_only'
            defaultMessage='Read-only federated {type}'
            values={{ type: shortNativeType(item.native.type) }}
          />
        </p>

        {target !== null ? (
          <p>
            <FormattedMessage id='federation.source_item.development_target_label' defaultMessage='Target: ' />
            {renderLinkedValue(formatExternalLabel(String(target)), String(target))}
          </p>
        ) : null}
      </div>
    );
  }

  if (family === 'coordination' && item.native) {
    const action = nativeField(item, 'action');
    const provider = nativeField(item, 'provider');
    const receiver = nativeField(item, 'receiver');
    const process = firstNativeField(item, ['input_of', 'output_of', 'planned_within']);
    const resource = firstNativeField(item, ['resource_inventoried_as', 'to_resource_inventoried_as', 'resource_conforms_to']);
    const quantity = firstNativeField(item, ['resource_quantity', 'effort_quantity', 'available_quantity', 'onhand_quantity', 'accounting_quantity']);
    const quantityUnit = firstNativeField(item, ['resource_quantity_unit', 'effort_quantity_unit', 'available_quantity_unit', 'onhand_quantity_unit', 'accounting_quantity_unit']);

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_type_label' defaultMessage='ValueFlows type: ' />} value={shortNativeType(item.native.type)} />
        {action !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_action_label' defaultMessage='Action: ' />} value={String(action)} /> : null}
        {provider !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_provider_label' defaultMessage='Provider: ' />} value={renderLinkedValue(formatExternalLabel(String(provider)), String(provider))} /> : null}
        {receiver !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_receiver_label' defaultMessage='Receiver: ' />} value={renderLinkedValue(formatExternalLabel(String(receiver)), String(receiver))} /> : null}
        {process !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_process_label' defaultMessage='Process: ' />} value={renderLinkedValue(formatExternalLabel(String(process)), String(process))} /> : null}
        {resource !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_resource_label' defaultMessage='Resource: ' />} value={renderLinkedValue(formatExternalLabel(String(resource)), String(resource))} /> : null}
        {quantity !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.valueflows_quantity_label' defaultMessage='Quantity: ' />} value={[quantity, quantityUnit].filter((value) => value !== null).join(' ')} /> : null}
      </dl>
    );
  }

  if (family === 'publishing' && item.native) {
    const author = nativeField(item, 'author');
    const subject = nativeField(item, 'subject');
    const level = nativeField(item, 'level');
    const language = nativeField(item, 'language');
    const license = nativeField(item, 'license');
    const resourceUrl = nativeField(item, 'resource_url');

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        <NativeDetail label={<FormattedMessage id='federation.source_item.resource_type_label' defaultMessage='Resource type: ' />} value={shortNativeType(item.native.type)} />
        {author !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_author_label' defaultMessage='Author: ' />} value={renderLinkedValue(formatExternalLabel(String(author)), String(author))} /> : null}
        {subject !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_subject_label' defaultMessage='Subject: ' />} value={String(subject)} /> : null}
        {level !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_level_label' defaultMessage='Level: ' />} value={String(level)} /> : null}
        {language !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_language_label' defaultMessage='Language: ' />} value={String(language)} /> : null}
        {license !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_license_label' defaultMessage='License: ' />} value={String(license)} /> : null}
        {typeof resourceUrl === 'string' ? <NativeDetail label={<FormattedMessage id='federation.source_item.resource_file_label' defaultMessage='File: ' />} value={renderLinkedValue(formatExternalLabel(resourceUrl), resourceUrl)} /> : null}
      </dl>
    );
  }

  if (family === 'routes' && item.native) {
    const category = nativeField(item, 'category');
    const difficulty = nativeField(item, 'difficulty');
    const distance = nativeField(item, 'distance');
    const duration = nativeField(item, 'duration');
    const elevationGain = nativeField(item, 'elevation_gain');
    const elevationLoss = nativeField(item, 'elevation_loss');
    const gpxUrl = nativeField(item, 'gpx_url');
    const location = nativeField(item, 'location') ?? item.location;
    const routeKind = nativeField(item, 'route_kind');
    const startTime = nativeField(item, 'start_time') ?? item.event_start;

    return (
      <dl className='mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300'>
        {routeKind !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_kind_label' defaultMessage='Kind: ' />} value={String(routeKind).replaceAll('_', ' ')} /> : null}
        {category !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_category_label' defaultMessage='Category: ' />} value={String(category)} /> : null}
        {difficulty !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_difficulty_label' defaultMessage='Difficulty: ' />} value={String(difficulty)} /> : null}
        {distance !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_distance_label' defaultMessage='Distance: ' />} value={String(distance)} /> : null}
        {duration !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_duration_label' defaultMessage='Duration: ' />} value={String(duration)} /> : null}
        {elevationGain !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_elevation_gain_label' defaultMessage='Elevation gain: ' />} value={String(elevationGain)} /> : null}
        {elevationLoss !== null ? <NativeDetail label={<FormattedMessage id='federation.source_item.route_elevation_loss_label' defaultMessage='Elevation loss: ' />} value={String(elevationLoss)} /> : null}
        {location ? <NativeDetail label={<FormattedMessage id='federation.source_item.location_label' defaultMessage='Location: ' />} value={location} /> : null}
        {startTime ? <NativeDetail label={<FormattedMessage id='federation.source_item.event_start_label' defaultMessage='Starts: ' />} value={startTime} /> : null}
        {typeof gpxUrl === 'string' ? (
          <NativeDetail
            label={<FormattedMessage id='federation.source_item.route_gpx_label' defaultMessage='Track: ' />}
            value={renderLinkedValue('GPX', gpxUrl)}
          />
        ) : null}
      </dl>
    );
  }

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

interface INativeDetail {
  label: React.ReactNode;
  value: React.ReactNode;
}

const NativeDetail: React.FC<INativeDetail> = ({ label, value }) => (
  <div>
    <dt className='inline font-semibold'>{label}</dt>
    <dd className='inline'>{value}</dd>
  </div>
);

function nativeField(item: SourceItem, key: string) {
  const value = item.native?.fields[key];

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value.join(', ');
  }

  return null;
}

function firstNativeField(item: SourceItem, keys: string[]) {
  for (const key of keys) {
    const value = nativeField(item, key);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function shortNativeType(type: string) {
  return type.split(/[/#:]/).filter(Boolean).at(-1) || type;
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
