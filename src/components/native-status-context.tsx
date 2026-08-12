/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/native-status-context.tsx

  Purpose:

    Explain a visible status that uses an ActivityPub extension vocabulary.

  Responsibilities:

    * identify the native remote status type
    * show bounded BookWyrm context such as rating and book references
    * show bounded Wanderer route context and its source GPX link
    * show bounded Bonfire ValueFlows relationships and quantities
    * show bounded ZenPub publishing metadata and its resource link
    * expose only backend-approved open and listen controls

  This file intentionally does NOT contain:

    * status visibility decisions
    * inference of unsupported capabilities
*/

import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { HTTPError } from '@/api/HTTPError.ts';
import BookShelfControl from '@/components/book-shelf-control.tsx';
import ChessPosition from '@/components/chess-position.tsx';
import NativeLiveVideoContext from '@/components/native-live-video-context.tsx';
import NativeModelResource from '@/components/native-model-resource.tsx';
import NativeObjectStateControl from '@/components/native-object-state-control.tsx';
import NativeRouteMap from '@/components/native-route-map.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import { useReplyCompose } from '@/hooks/useReplyCompose.ts';
import { nativeActivityPresentationSchema, type NativeActivityPresentation } from '@/schemas/native-activity.ts';
import toast from '@/toast.tsx';

interface INativeStatusContext {
  authorAccountId?: string;
  native: unknown;
  statusId?: string;
}

const bookStatusTypes = new Set(['Comment', 'Quotation', 'Rating', 'Review']);
const nativeFieldSeparator = ': ';
const alreadyRenderedFields = new Set([
  'action', 'accounting_quantity', 'accounting_quantity_unit', 'album', 'artist', 'author',
  'available_quantity', 'available_quantity_unit', 'book', 'byline', 'catalog_item',
  'catalog_type', 'category', 'channel', 'condition', 'creator', 'currency', 'delivery',
  'detail', 'difficulty', 'distance', 'due', 'duration', 'edition', 'effort_quantity',
  'effort_quantity_unit', 'elevation_gain', 'elevation_loss', 'expires', 'fen', 'game',
  'game_kind', 'genres', 'gpx_url', 'file_format', 'file_name', 'homepage',
  'has_beginning', 'has_end', 'has_point_in_time', 'in_reply_to_book', 'input_of',
  'labels', 'language', 'latitude', 'level', 'license', 'listing_name', 'listing_type',
  'location', 'longitude',
  'embed_url', 'is_live_broadcast', 'live_start',
  'media_type', 'onhand_quantity', 'onhand_quantity_unit', 'output_of', 'planned_within',
  'platform', 'players', 'price', 'priority', 'project_status', 'provider', 'published_at',
  'purpose', 'quantity', 'rating', 'rating_best', 'reading_status', 'receiver', 'release_date',
  'release_year', 'repository',
  'resource_conforms_to', 'resource_inventoried_as', 'resource_quantity',
  'resource_quantity_unit', 'resource_url', 'route_kind', 'san', 'start_time', 'subject',
  'secondary', 'skills', 'state', 'status', 'subtitle', 'tags', 'ticket_kind', 'title',
  'to_resource_inventoried_as', 'topics', 'track_number', 'version', 'work',
]);

const messages = defineMessages({
  hideDetails: { id: 'status.native.hide_details', defaultMessage: 'Show fewer details' },
  listenRecorded: { id: 'status.native.listen_recorded', defaultMessage: 'Listen recorded' },
  showDetails: { id: 'status.native.show_details', defaultMessage: 'Show all details' },
});

const NativeStatusContext: React.FC<INativeStatusContext> = ({ authorAccountId, native, statusId }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const presentation = parsePresentation(native);

  const hasSpecializedWorkflow = presentation?.controls.some((control) => control !== 'open');

  if (!presentation || (presentation.class !== 'status' && !hasSpecializedWorkflow)) {
    return null;
  }

  const type = shortNativeType(presentation.type);
  const platform = fieldValue(presentation, 'platform');
  const family = fieldValue(presentation, 'family');
  const kind = fieldValue(presentation, 'kind');
  const action = fieldValue(presentation, 'action');
  const book = firstField(presentation, ['in_reply_to_book', 'book', 'edition', 'work', 'catalog_item']);
  const catalogType = fieldValue(presentation, 'catalog_type');
  const category = fieldValue(presentation, 'category');
  const difficulty = fieldValue(presentation, 'difficulty');
  const distance = fieldValue(presentation, 'distance');
  const duration = fieldValue(presentation, 'duration');
  const embedUrl = fieldValue(presentation, 'embed_url');
  const elevationGain = fieldValue(presentation, 'elevation_gain');
  const elevationLoss = fieldValue(presentation, 'elevation_loss');
  const gpxUrl = fieldValue(presentation, 'gpx_url');
  const fen = fieldValue(presentation, 'fen');
  const fileFormat = fieldValue(presentation, 'file_format');
  const fileName = fieldValue(presentation, 'file_name');
  const game = fieldValue(presentation, 'game');
  const location = fieldValue(presentation, 'location');
  const listingName = fieldValue(presentation, 'listing_name');
  const isLiveBroadcast = fieldValue(presentation, 'is_live_broadcast');
  const liveStart = fieldValue(presentation, 'live_start');
  const price = fieldValue(presentation, 'price');
  const currency = fieldValue(presentation, 'currency');
  const latitude = fieldValue(presentation, 'latitude');
  const longitude = fieldValue(presentation, 'longitude');
  const listingLocation = latitude !== null && longitude !== null ? `${latitude}, ${longitude}` : null;
  const rating = fieldValue(presentation, 'rating');
  const ratingBest = fieldValue(presentation, 'rating_best');
  const readingStatus = fieldValue(presentation, 'reading_status');
  const provider = fieldValue(presentation, 'provider');
  const receiver = fieldValue(presentation, 'receiver');
  const process = firstField(presentation, ['input_of', 'output_of', 'planned_within']);
  const resource = firstField(presentation, ['resource_inventoried_as', 'to_resource_inventoried_as', 'resource_conforms_to']);
  const quantity = firstField(presentation, ['resource_quantity', 'effort_quantity', 'available_quantity', 'onhand_quantity', 'accounting_quantity']);
  const quantityUnit = firstField(presentation, ['resource_quantity_unit', 'effort_quantity_unit', 'available_quantity_unit', 'onhand_quantity_unit', 'accounting_quantity_unit']);
  const routeKind = fieldValue(presentation, 'route_kind');
  const san = fieldValue(presentation, 'san');
  const startTime = fieldValue(presentation, 'start_time');
  const valueflowsTime = firstField(presentation, ['has_point_in_time', 'has_beginning', 'has_end', 'due']);
  const resourceAuthor = fieldValue(presentation, 'author');
  const resourceSubject = fieldValue(presentation, 'subject');
  const resourceLevel = fieldValue(presentation, 'level');
  const resourceLanguage = fieldValue(presentation, 'language');
  const resourceLicense = fieldValue(presentation, 'license');
  const resourceUrl = fieldValue(presentation, 'resource_url');
  const artist = fieldValue(presentation, 'artist');
  const album = fieldValue(presentation, 'album');
  const trackNumber = fieldValue(presentation, 'track_number');
  const releaseDate = fieldValue(presentation, 'release_date');
  const genres = fieldValue(presentation, 'genres');
  const channel = fieldValue(presentation, 'channel');
  const subtitle = fieldValue(presentation, 'subtitle');
  const byline = fieldValue(presentation, 'byline');
  const tags = fieldValue(presentation, 'tags');
  const repository = fieldValue(presentation, 'repository');
  const homepage = fieldValue(presentation, 'homepage');
  const projectStatus = fieldValue(presentation, 'project_status');
  const state = fieldValue(presentation, 'state');
  const ticketKind = fieldValue(presentation, 'ticket_kind');
  const priority = fieldValue(presentation, 'priority');
  const version = fieldValue(presentation, 'version');
  const labels = fieldValue(presentation, 'labels');
  const topics = fieldValue(presentation, 'topics');
  const condition = fieldValue(presentation, 'condition');
  const delivery = fieldValue(presentation, 'delivery');
  const listingType = fieldValue(presentation, 'listing_type');
  const listingQuantity = fieldValue(presentation, 'quantity');
  const expires = fieldValue(presentation, 'expires');
  const gameKind = fieldValue(presentation, 'game_kind');
  const players = fieldValue(presentation, 'players');
  const creator = fieldValue(presentation, 'creator');
  const releaseYear = fieldValue(presentation, 'release_year');
  const workflowStatus = fieldValue(presentation, 'status');
  const purpose = fieldValue(presentation, 'purpose');
  const skills = fieldValue(presentation, 'skills');
  const publishedAt = fieldValue(presentation, 'published_at');
  const mediaType = fieldValue(presentation, 'media_type');
  const isModel = family === 'models' || kind === '3d_model' || type === '3DModel';
  const isRoute = family === 'routes' || platform === 'wanderer' || routeKind !== null;
  const usefulReference = firstField(presentation, ['reference', 'repository', 'target', 'related_link', 'resource_url', 'gpx_url', 'game']);
  const additionalFields = additionalPresentationFields(presentation);
  const displayType = platform === 'wanderer' && typeof routeKind === 'string'
    ? humanizeNativeKind(routeKind)
    : type;
  const openUrl = typeof usefulReference === 'string' && isHttpUrl(usefulReference)
    ? usefulReference
    : presentation.controls.includes('open') && isHttpUrl(presentation.canonical_id)
      ? presentation.canonical_id
      : null;
  const detailCount = [
    rating,
    readingStatus,
    book,
    catalogType,
    category,
    difficulty,
    distance,
    duration,
    elevationGain,
    elevationLoss,
    gpxUrl,
    location,
    startTime,
    listingName,
    price,
    listingLocation,
    fen,
    game,
    san,
    action,
    provider,
    receiver,
    process,
    resource,
    quantity,
    valueflowsTime,
    resourceAuthor,
    resourceSubject,
    resourceLevel,
    resourceLanguage,
    resourceLicense,
    resourceUrl,
    artist,
    album,
    trackNumber,
    releaseDate,
    genres,
    channel,
    subtitle,
    byline,
    tags,
    repository,
    homepage,
    projectStatus,
    state,
    ticketKind,
    priority,
    version,
    labels,
    topics,
    condition,
    delivery,
    listingType,
    listingQuantity,
    expires,
    gameKind,
    players,
    creator,
    releaseYear,
    workflowStatus,
    purpose,
    skills,
    publishedAt,
    mediaType,
  ].filter((value) => value !== null).length + additionalFields.length;
  const hasDetails = detailCount > 0;
  const detailsCollapsible = detailCount > 4;
  const ratingValue = formatRating(rating, ratingBest);
  const readingStatusLabel = platform === 'neodb'
    ? <FormattedMessage id='status.native.status' defaultMessage='Status' />
    : <FormattedMessage id='status.native.reading_status' defaultMessage='Reading status' />;
  const bookLabel = platform === 'neodb'
    ? <FormattedMessage id='status.native.catalog_item' defaultMessage='Catalog item' />
    : <FormattedMessage id='status.native.book' defaultMessage='Book' />;

  return (
    <aside
      className='overflow-hidden border-y border-solid border-gray-200 text-sm text-gray-700 black:border-gray-800 black:text-gray-200 dark:border-gray-700 dark:text-gray-300'
      data-testid='native-status-context'
    >
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-1 py-3 black:border-gray-800 dark:border-gray-700'>
        {typeof fen === 'string' && fen ? (
          <div className='order-last w-full border-t border-gray-200 pt-3 black:border-gray-800 dark:border-gray-700'>
            <ChessPosition fen={fen} lastMove={typeof san === 'string' ? san : null} />
          </div>
        ) : null}

        <strong className='text-sm text-gray-900 black:text-white dark:text-gray-100'>
          {renderNativeTypeLabel(platform, type, displayType, family, kind)}
        </strong>

        <div className='flex flex-wrap items-start justify-end gap-2'>
          {openUrl ? (
            <a className='px-2 py-1 font-medium text-primary-700 hover:underline dark:text-primary-300' href={openUrl} target='_blank' rel='noopener'>
              <FormattedMessage id='status.native.open' defaultMessage='Open resource' />
            </a>
          ) : null}

          <NativeObjectStateControl authorAccountId={authorAccountId} native={presentation} statusId={statusId} />
          {statusId ? <NativeContextActions presentation={presentation} statusId={statusId} /> : null}

          {statusId && presentation.controls.includes('listen') ? (
            <NativeListenControl statusId={statusId} />
          ) : null}
        </div>
      </div>

      {isRoute ? (
        <NativeRouteMap
          gpxUrl={gpxUrl}
          label={location || displayType}
          latitude={latitude}
          longitude={longitude}
        />
      ) : null}

      {type === 'Video' || family === 'video' ? (
        <NativeLiveVideoContext
          embedUrl={embedUrl}
          isLiveBroadcast={isLiveBroadcast}
          startTime={liveStart}
        />
      ) : null}

      {isModel ? (
        <NativeModelResource
          canonicalUrl={presentation.canonical_id}
          fileFormat={fileFormat}
          fileName={fileName}
          license={resourceLicense}
          resourceUrl={resourceUrl}
        />
      ) : null}

      {hasDetails && (
        <>
          <dl
            className={clsx(
              'grid grid-cols-1 gap-x-6 gap-y-3 px-1 py-3 sm:grid-cols-2',
              detailsCollapsible
              && !detailsExpanded
              && '[&>*:nth-child(n+5)]:hidden',
            )}
          >
            {artist !== null ? <NativeField label={<FormattedMessage id='status.native.artist' defaultMessage='Artist' />} value={String(artist)} /> : null}
            {album !== null ? <NativeField label={<FormattedMessage id='status.native.album' defaultMessage='Album or series' />} value={String(album)} /> : null}
            {trackNumber !== null ? <NativeField label={<FormattedMessage id='status.native.track_number' defaultMessage='Track' />} value={String(trackNumber)} /> : null}
            {releaseDate !== null ? <NativeField label={<FormattedMessage id='status.native.release_date' defaultMessage='Released' />} value={formatFriendlyValue(releaseDate)} /> : null}
            {genres !== null ? <NativeField label={<FormattedMessage id='status.native.genres' defaultMessage='Genres' />} value={String(genres)} /> : null}
            {channel !== null ? <NativeField label={<FormattedMessage id='status.native.channel' defaultMessage='Channel' />} value={String(channel)} /> : null}
            {subtitle !== null ? <NativeField label={<FormattedMessage id='status.native.subtitle' defaultMessage='Subtitle' />} value={String(subtitle)} /> : null}
            {byline !== null ? <NativeField label={<FormattedMessage id='status.native.byline' defaultMessage='Byline' />} value={String(byline)} /> : null}
            {tags !== null ? <NativeField label={<FormattedMessage id='status.native.tags' defaultMessage='Tags' />} value={String(tags)} /> : null}
            {ratingValue !== null ? <NativeField label={<FormattedMessage id='status.native.rating' defaultMessage='Rating' />} value={ratingValue} /> : null}
            {readingStatus !== null ? (
              <NativeField
                label={readingStatusLabel}
                value={formatFriendlyValue(readingStatus)}
              />
            ) : null}
            {catalogType !== null ? <NativeField label={<FormattedMessage id='status.native.catalog_type' defaultMessage='Catalog type' />} value={formatFriendlyValue(catalogType)} /> : null}
            {book !== null ? (
              <NativeField
                label={bookLabel}
                value={renderLinkedValue(String(book))}
              />
            ) : null}
            {category !== null ? <NativeField label={<FormattedMessage id='status.native.route_category' defaultMessage='Category' />} value={formatFriendlyValue(category)} /> : null}
            {difficulty !== null ? <NativeField label={<FormattedMessage id='status.native.route_difficulty' defaultMessage='Difficulty' />} value={formatFriendlyValue(difficulty)} /> : null}
            {distance !== null ? <NativeField label={<FormattedMessage id='status.native.route_distance' defaultMessage='Distance' />} value={String(distance)} /> : null}
            {duration !== null ? <NativeField label={<FormattedMessage id='status.native.route_duration' defaultMessage='Duration' />} value={String(duration)} /> : null}
            {elevationGain !== null ? <NativeField label={<FormattedMessage id='status.native.route_elevation_gain' defaultMessage='Elevation gain' />} value={String(elevationGain)} /> : null}
            {elevationLoss !== null ? <NativeField label={<FormattedMessage id='status.native.route_elevation_loss' defaultMessage='Elevation loss' />} value={String(elevationLoss)} /> : null}
            {location !== null ? <NativeField label={<FormattedMessage id='status.native.route_location' defaultMessage='Location' />} value={String(location)} /> : null}
            {startTime !== null ? <NativeField label={<FormattedMessage id='status.native.route_start_time' defaultMessage='Start time' />} value={formatFriendlyValue(startTime)} /> : null}
            {typeof gpxUrl === 'string' ? <NativeField label={<FormattedMessage id='status.native.route_gpx' defaultMessage='Track' />} value={renderLinkedValue(gpxUrl)} /> : null}
            {listingName !== null ? <NativeField label={<FormattedMessage id='status.native.listing_name' defaultMessage='Listing' />} value={String(listingName)} /> : null}
            {price !== null ? <NativeField label={<FormattedMessage id='status.native.listing_price' defaultMessage='Price' />} value={[price, currency].filter((value) => value !== null).join(' ')} /> : null}
            {listingLocation !== null ? <NativeField label={<FormattedMessage id='status.native.listing_location' defaultMessage='Location' />} value={listingLocation} /> : null}
            {condition !== null ? <NativeField label={<FormattedMessage id='status.native.condition' defaultMessage='Condition' />} value={formatFriendlyValue(condition)} /> : null}
            {delivery !== null ? <NativeField label={<FormattedMessage id='status.native.delivery' defaultMessage='Delivery' />} value={String(delivery)} /> : null}
            {listingType !== null ? <NativeField label={<FormattedMessage id='status.native.listing_type' defaultMessage='Listing type' />} value={formatFriendlyValue(listingType)} /> : null}
            {listingQuantity !== null ? <NativeField label={<FormattedMessage id='status.native.listing_quantity' defaultMessage='Quantity' />} value={String(listingQuantity)} /> : null}
            {expires !== null ? <NativeField label={<FormattedMessage id='status.native.expires' defaultMessage='Expires' />} value={formatFriendlyValue(expires)} /> : null}
            {repository !== null ? <NativeField label={<FormattedMessage id='status.native.repository' defaultMessage='Repository' />} value={renderLinkedValue(String(repository))} /> : null}
            {homepage !== null ? <NativeField label={<FormattedMessage id='status.native.homepage' defaultMessage='Homepage' />} value={renderLinkedValue(String(homepage))} /> : null}
            {projectStatus !== null ? <NativeField label={<FormattedMessage id='status.native.project_status' defaultMessage='Project status' />} value={formatFriendlyValue(projectStatus)} /> : null}
            {state !== null ? <NativeField label={<FormattedMessage id='status.native.state' defaultMessage='State' />} value={formatFriendlyValue(state)} /> : null}
            {ticketKind !== null ? <NativeField label={<FormattedMessage id='status.native.ticket_kind' defaultMessage='Ticket type' />} value={formatFriendlyValue(ticketKind)} /> : null}
            {priority !== null ? <NativeField label={<FormattedMessage id='status.native.priority' defaultMessage='Priority' />} value={formatFriendlyValue(priority)} /> : null}
            {version !== null ? <NativeField label={<FormattedMessage id='status.native.version' defaultMessage='Version' />} value={String(version)} /> : null}
            {labels !== null ? <NativeField label={<FormattedMessage id='status.native.labels' defaultMessage='Labels' />} value={String(labels)} /> : null}
            {topics !== null ? <NativeField label={<FormattedMessage id='status.native.topics' defaultMessage='Topics' />} value={String(topics)} /> : null}
            {gameKind !== null ? <NativeField label={<FormattedMessage id='status.native.game_kind' defaultMessage='Game' />} value={formatFriendlyValue(gameKind)} /> : null}
            {players !== null ? <NativeField label={<FormattedMessage id='status.native.players' defaultMessage='Players' />} value={String(players)} /> : null}
            {san !== null ? <NativeField label={<FormattedMessage id='status.native.game_move' defaultMessage='Move' />} value={String(san)} /> : null}
            {fen !== null ? <NativeField label={<FormattedMessage id='status.native.game_position' defaultMessage='Position' />} value={String(fen)} /> : null}
            {typeof game === 'string' ? <NativeField label={<FormattedMessage id='status.native.game_link' defaultMessage='Game' />} value={renderLinkedValue(game)} /> : null}
            {creator !== null ? <NativeField label={<FormattedMessage id='status.native.creator' defaultMessage='Creator' />} value={String(creator)} /> : null}
            {releaseYear !== null ? <NativeField label={<FormattedMessage id='status.native.release_year' defaultMessage='Year' />} value={String(releaseYear)} /> : null}
            {workflowStatus !== null ? <NativeField label={<FormattedMessage id='status.native.workflow_status' defaultMessage='Status' />} value={formatFriendlyValue(workflowStatus)} /> : null}
            {purpose !== null ? <NativeField label={<FormattedMessage id='status.native.purpose' defaultMessage='Purpose' />} value={formatFriendlyValue(purpose)} /> : null}
            {skills !== null ? <NativeField label={<FormattedMessage id='status.native.skills' defaultMessage='Skills' />} value={String(skills)} /> : null}
            {action !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_action' defaultMessage='Action' />} value={formatFriendlyValue(action)} /> : null}
            {provider !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_provider' defaultMessage='Provider' />} value={renderLinkedValue(String(provider))} /> : null}
            {receiver !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_receiver' defaultMessage='Receiver' />} value={renderLinkedValue(String(receiver))} /> : null}
            {process !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_process' defaultMessage='Process' />} value={renderLinkedValue(String(process))} /> : null}
            {resource !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_resource' defaultMessage='Resource' />} value={renderLinkedValue(String(resource))} /> : null}
            {quantity !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_quantity' defaultMessage='Quantity' />} value={[quantity, quantityUnit].filter((value) => value !== null).join(' ')} /> : null}
            {valueflowsTime !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_time' defaultMessage='Time' />} value={formatFriendlyValue(valueflowsTime)} /> : null}
            {resourceAuthor !== null ? <NativeField label={<FormattedMessage id='status.native.resource_author' defaultMessage='Author' />} value={renderLinkedValue(String(resourceAuthor))} /> : null}
            {resourceSubject !== null ? <NativeField label={<FormattedMessage id='status.native.resource_subject' defaultMessage='Subject' />} value={String(resourceSubject)} /> : null}
            {resourceLevel !== null ? <NativeField label={<FormattedMessage id='status.native.resource_level' defaultMessage='Level' />} value={String(resourceLevel)} /> : null}
            {resourceLanguage !== null ? <NativeField label={<FormattedMessage id='status.native.resource_language' defaultMessage='Language' />} value={String(resourceLanguage)} /> : null}
            {resourceLicense !== null ? <NativeField label={<FormattedMessage id='status.native.resource_license' defaultMessage='License' />} value={String(resourceLicense)} /> : null}
            {typeof resourceUrl === 'string' ? <NativeField label={<FormattedMessage id='status.native.resource_file' defaultMessage='File' />} value={renderLinkedValue(resourceUrl)} /> : null}
            {publishedAt !== null ? <NativeField label={<FormattedMessage id='status.native.published_at' defaultMessage='Published' />} value={formatFriendlyValue(publishedAt)} /> : null}
            {mediaType !== null ? <NativeField label={<FormattedMessage id='status.native.media_type' defaultMessage='Format' />} value={String(mediaType)} /> : null}
            {additionalFields.map(({ key, label, value }) => (
              <NativeField key={key} label={label} value={renderAdditionalValue(value)} />
            ))}
          </dl>
          {detailsCollapsible ? (
            <button
              type='button'
              className='mb-3 ml-1 text-xs font-bold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300'
              aria-expanded={detailsExpanded}
              onClick={(event) => {
                event.stopPropagation();
                setDetailsExpanded((expanded) => !expanded);
              }}
            >
              {detailsExpanded
                ? <FormattedMessage {...messages.hideDetails} />
                : <FormattedMessage {...messages.showDetails} />}
            </button>
          ) : null}
        </>
      )}
    </aside>
  );
};

interface INativeContextActions {
  presentation: NativeActivityPresentation;
  statusId: string;
}

const NativeContextActions: React.FC<INativeContextActions> = ({ presentation, statusId }) => {
  const { account } = useOwnAccount();
  const { replyCompose } = useReplyCompose();
  const replyControl = ['contact', 'respond', 'discuss'].find((control) => presentation.controls.includes(control));
  const canReview = presentation.controls.includes('review');

  if (!account || (!replyControl && !canReview)) return null;

  const reference = firstField(presentation, ['catalog_item', 'in_reply_to_book', 'book', 'edition', 'work']) || presentation.canonical_id;
  const platform = fieldValue(presentation, 'platform');
  const family = fieldValue(presentation, 'family');
  const reviewFamily = platform === 'neodb' || family === 'culture' ? 'culture' : 'books';
  const reviewUrl = `/worlds/${reviewFamily}?create=1&reference=${encodeURIComponent(String(reference))}`;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {canReview ? <BookShelfControl native={presentation} bookUri={String(reference)} /> : null}
      {replyControl ? (
        <button
          className='rounded-md border border-solid border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-100 black:border-primary-700 black:bg-primary-950/40 black:text-primary-200 black:hover:bg-primary-900 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200 dark:hover:bg-primary-900'
          onClick={() => replyCompose(statusId, replyControl === 'contact' ? { visibility: 'direct' } : {})}
          title={replyControl === 'contact' ? 'Starts a private reply to the seller.' : undefined}
          type='button'
        >
          {contextualReplyLabel(replyControl)}
        </button>
      ) : null}

      {canReview ? (
        <Link
          className='rounded-md border border-solid border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-100 black:border-primary-700 black:bg-primary-950/40 black:text-primary-200 black:hover:bg-primary-900 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200 dark:hover:bg-primary-900'
          to={reviewUrl}
        >
          {platform === 'neodb' ? (
            <FormattedMessage id='status.native.rate_or_review' defaultMessage='Rate or review' />
          ) : (
            <FormattedMessage id='status.native.write_review' defaultMessage='Write review' />
          )}
        </Link>
      ) : null}
    </div>
  );
};

function contextualReplyLabel(control: string) {
  switch (control) {
    case 'contact':
      return <FormattedMessage id='status.native.contact_seller' defaultMessage='Contact seller' />;
    case 'respond':
      return <FormattedMessage id='status.native.respond' defaultMessage='Respond' />;
    default:
      return <FormattedMessage id='status.native.discuss' defaultMessage='Discuss' />;
  }
}

const NativeListenControl: React.FC<{ statusId: string }> = ({ statusId }) => {
  const api = useApi();
  const intl = useIntl();
  const { account } = useOwnAccount();
  const { mutate: recordListen, isPending } = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/statuses/${encodeURIComponent(statusId)}/listen`);
    },
    onSuccess: () => toast.success(intl.formatMessage(messages.listenRecorded)),
    onError: (error) => toast.showAlertForError(error as HTTPError),
  });

  if (!account) return null;

  return (
    <div className='flex flex-col items-end gap-1'>
      <button
        className='rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-wait disabled:opacity-60'
        disabled={isPending}
        onClick={() => recordListen()}
        type='button'
      >
        <FormattedMessage id='status.native.record_listen' defaultMessage='Record listen' />
      </button>
      <span className='text-xs text-gray-500 black:text-gray-400 dark:text-gray-400'>
        <FormattedMessage id='status.native.record_listen_hint' defaultMessage='Adds another entry to your federated listening history.' />
      </span>
    </div>
  );
};

interface INativeField {
  label: React.ReactNode;
  value: React.ReactNode;
}

const NativeField: React.FC<INativeField> = ({ label, value }) => (
  <div className='min-w-0'>
    <dt className='text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>{label}{nativeFieldSeparator}</dt>
    <dd className='mt-0.5 break-words font-medium text-gray-900 black:text-white dark:text-gray-100'>{value}</dd>
  </div>
);

function parsePresentation(value: unknown) {
  const candidate = immutableToJS(value);
  const result = nativeActivityPresentationSchema.safeParse(candidate);

  return result.success ? result.data : null;
}

function immutableToJS(value: unknown) {
  if (value && typeof value === 'object' && 'toJS' in value) {
    const toJS = Reflect.get(value, 'toJS');

    if (typeof toJS === 'function') {
      return Reflect.apply(toJS, value, []);
    }
  }

  return value;
}

function fieldValue(presentation: NativeActivityPresentation, key: string) {
  const value = presentation.fields[key];

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value.join(', ');
  }

  return null;
}

function firstField(presentation: NativeActivityPresentation, keys: string[]) {
  for (const key of keys) {
    const value = fieldValue(presentation, key);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function additionalPresentationFields(presentation: NativeActivityPresentation) {
  return Object.entries(presentation.fields)
    .filter(([key, value]) => !alreadyRenderedFields.has(key) && key !== 'family' && key !== 'kind' && value !== '' && value !== null)
    .map(([key, value]) => ({
      key,
      label: humanizeNativeKind(key),
      value,
    }));
}

function renderAdditionalValue(value: unknown) {
  if (typeof value === 'boolean') return formatFriendlyValue(value);
  if (Array.isArray(value)) return value.map(formatFriendlyValue).join(', ');
  if (typeof value === 'string' && isHttpUrl(value)) return renderLinkedValue(value);
  return formatFriendlyValue(value);
}

function shortNativeType(type: string) {
  const parts = type.split(/[/#:]/).filter(Boolean);

  return parts[parts.length - 1] || type;
}

function humanizeNativeKind(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderNativeTypeLabel(platform: unknown, type: string, displayType: string, family: unknown, kind: unknown) {
  if (platform === 'unfathomably') {
    return humanizeNativeKind(typeof kind === 'string' ? kind : typeof family === 'string' ? family : type);
  }

  switch (platform) {
    case 'wanderer':
      return (
        <FormattedMessage
          id='status.native.wanderer_type'
          defaultMessage='Wanderer {type}'
          values={{ type: displayType }}
        />
      );
    case 'castling':
      return <FormattedMessage id='status.native.castling_type' defaultMessage='Castling.club game' />;
    case 'flohmarkt':
      return <FormattedMessage id='status.native.flohmarkt_type' defaultMessage='Flohmarkt listing' />;
    case 'neodb':
      return <FormattedMessage id='status.native.neodb_type' defaultMessage='NeoDB {type}' values={{ type }} />;
    case 'bonfire_valueflows':
      return <FormattedMessage id='status.native.valueflows_type' defaultMessage='Bonfire ValueFlows {type}' values={{ type }} />;
    case 'zenpub':
      return <FormattedMessage id='status.native.zenpub_type' defaultMessage='ZenPub publishing resource' />;
  }

  if (bookStatusTypes.has(type)) {
    return <FormattedMessage id='status.native.bookwyrm_type' defaultMessage='BookWyrm {type}' values={{ type }} />;
  }

  return <FormattedMessage id='status.native.federated_type' defaultMessage='Federated {type}' values={{ type }} />;
}

function formatRating(rating: unknown, best: unknown) {
  if (rating === null) {
    return null;
  }

  if (best !== null) {
    const value = Number(rating);
    const maximum = Number(best);

    if (Number.isFinite(value) && Number.isFinite(maximum) && maximum > 0 && maximum <= 5) {
      const rounded = Math.max(0, Math.min(maximum, Math.round(value)));
      return `${'★'.repeat(rounded)}${'☆'.repeat(maximum - rounded)} ${String(rating)}/${String(best)}`;
    }

    return `${String(rating)}/${String(best)}`;
  }

  return String(rating);
}

function formatFriendlyValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);

    if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) && Number.isFinite(timestamp)) {
      const options: Intl.DateTimeFormatOptions = value.includes('T')
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { dateStyle: 'medium' };

      return new Intl.DateTimeFormat(undefined, options).format(new Date(timestamp));
    }

    return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return String(value);
}

function renderLinkedValue(value: string) {
  if (!isHttpUrl(value)) {
    return value;
  }

  const url = new URL(value);
  const path = url.pathname.replace(/\/$/, '');

  return (
    <a className='hover:underline' href={value} target='_blank' rel='noopener'>
      {url.hostname}{path}
    </a>
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}

export default NativeStatusContext;

/* end of src/components/native-status-context.tsx */
