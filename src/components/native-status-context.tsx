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
    * expose only the backend-approved open control

  This file intentionally does NOT contain:

    * status visibility decisions
    * remote mutations
    * inference of unsupported capabilities
*/

import { FormattedMessage } from 'react-intl';

import { nativeActivityPresentationSchema, type NativeActivityPresentation } from '@/schemas/native-activity.ts';

interface INativeStatusContext {
  native: unknown;
}

const bookStatusTypes = new Set(['Comment', 'Quotation', 'Rating', 'Review']);
const nativeFieldSeparator = ': ';

const NativeStatusContext: React.FC<INativeStatusContext> = ({ native }) => {
  const presentation = parsePresentation(native);

  if (!presentation || presentation.class !== 'status') {
    return null;
  }

  const type = shortNativeType(presentation.type);
  const platform = fieldValue(presentation, 'platform');
  const action = fieldValue(presentation, 'action');
  const book = firstField(presentation, ['in_reply_to_book', 'book', 'edition', 'work', 'catalog_item']);
  const catalogType = fieldValue(presentation, 'catalog_type');
  const category = fieldValue(presentation, 'category');
  const difficulty = fieldValue(presentation, 'difficulty');
  const distance = fieldValue(presentation, 'distance');
  const duration = fieldValue(presentation, 'duration');
  const elevationGain = fieldValue(presentation, 'elevation_gain');
  const elevationLoss = fieldValue(presentation, 'elevation_loss');
  const gpxUrl = fieldValue(presentation, 'gpx_url');
  const fen = fieldValue(presentation, 'fen');
  const game = fieldValue(presentation, 'game');
  const location = fieldValue(presentation, 'location');
  const listingName = fieldValue(presentation, 'listing_name');
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
  const displayType = platform === 'wanderer' && typeof routeKind === 'string'
    ? humanizeNativeKind(routeKind)
    : type;
  const openUrl = presentation.controls.includes('open') && isHttpUrl(presentation.canonical_id)
    ? presentation.canonical_id
    : null;
  const hasDetails = [
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
  ].some((value) => value !== null);
  const ratingValue = formatRating(rating, ratingBest);
  const readingStatusLabel = platform === 'neodb'
    ? <FormattedMessage id='status.native.status' defaultMessage='Status' />
    : <FormattedMessage id='status.native.reading_status' defaultMessage='Reading status' />;
  const bookLabel = platform === 'neodb'
    ? <FormattedMessage id='status.native.catalog_item' defaultMessage='Catalog item' />
    : <FormattedMessage id='status.native.book' defaultMessage='Book' />;

  return (
    <aside
      className='rounded-lg border border-solid border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-gray-300'
      data-testid='native-status-context'
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <strong className='text-gray-900 dark:text-gray-100'>
          {renderNativeTypeLabel(platform, type, displayType)}
        </strong>

        {openUrl ? (
          <a className='font-medium text-primary-700 hover:underline dark:text-primary-300' href={openUrl} target='_blank' rel='noopener'>
            <FormattedMessage id='status.native.open' defaultMessage='Open native object' />
          </a>
        ) : null}
      </div>

      {hasDetails && (
        <dl className='mt-1 space-y-1'>
          {ratingValue !== null ? <NativeField label={<FormattedMessage id='status.native.rating' defaultMessage='Rating' />} value={ratingValue} /> : null}
          {readingStatus !== null ? (
            <NativeField
              label={readingStatusLabel}
              value={String(readingStatus)}
            />
          ) : null}
          {catalogType !== null ? <NativeField label={<FormattedMessage id='status.native.catalog_type' defaultMessage='Catalog type' />} value={String(catalogType)} /> : null}
          {book !== null ? (
            <NativeField
              label={bookLabel}
              value={renderLinkedValue(String(book))}
            />
          ) : null}
          {category !== null ? <NativeField label={<FormattedMessage id='status.native.route_category' defaultMessage='Category' />} value={String(category)} /> : null}
          {difficulty !== null ? <NativeField label={<FormattedMessage id='status.native.route_difficulty' defaultMessage='Difficulty' />} value={String(difficulty)} /> : null}
          {distance !== null ? <NativeField label={<FormattedMessage id='status.native.route_distance' defaultMessage='Distance' />} value={String(distance)} /> : null}
          {duration !== null ? <NativeField label={<FormattedMessage id='status.native.route_duration' defaultMessage='Duration' />} value={String(duration)} /> : null}
          {elevationGain !== null ? <NativeField label={<FormattedMessage id='status.native.route_elevation_gain' defaultMessage='Elevation gain' />} value={String(elevationGain)} /> : null}
          {elevationLoss !== null ? <NativeField label={<FormattedMessage id='status.native.route_elevation_loss' defaultMessage='Elevation loss' />} value={String(elevationLoss)} /> : null}
          {location !== null ? <NativeField label={<FormattedMessage id='status.native.route_location' defaultMessage='Location' />} value={String(location)} /> : null}
          {startTime !== null ? <NativeField label={<FormattedMessage id='status.native.route_start_time' defaultMessage='Start time' />} value={String(startTime)} /> : null}
          {typeof gpxUrl === 'string' ? <NativeField label={<FormattedMessage id='status.native.route_gpx' defaultMessage='Track' />} value={renderLinkedValue(gpxUrl)} /> : null}
          {listingName !== null ? <NativeField label={<FormattedMessage id='status.native.listing_name' defaultMessage='Listing' />} value={String(listingName)} /> : null}
          {price !== null ? <NativeField label={<FormattedMessage id='status.native.listing_price' defaultMessage='Price' />} value={[price, currency].filter((value) => value !== null).join(' ')} /> : null}
          {listingLocation !== null ? <NativeField label={<FormattedMessage id='status.native.listing_location' defaultMessage='Location' />} value={listingLocation} /> : null}
          {san !== null ? <NativeField label={<FormattedMessage id='status.native.game_move' defaultMessage='Move' />} value={String(san)} /> : null}
          {fen !== null ? <NativeField label={<FormattedMessage id='status.native.game_position' defaultMessage='Position' />} value={String(fen)} /> : null}
          {typeof game === 'string' ? <NativeField label={<FormattedMessage id='status.native.game_link' defaultMessage='Game' />} value={renderLinkedValue(game)} /> : null}
          {action !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_action' defaultMessage='Action' />} value={String(action)} /> : null}
          {provider !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_provider' defaultMessage='Provider' />} value={renderLinkedValue(String(provider))} /> : null}
          {receiver !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_receiver' defaultMessage='Receiver' />} value={renderLinkedValue(String(receiver))} /> : null}
          {process !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_process' defaultMessage='Process' />} value={renderLinkedValue(String(process))} /> : null}
          {resource !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_resource' defaultMessage='Resource' />} value={renderLinkedValue(String(resource))} /> : null}
          {quantity !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_quantity' defaultMessage='Quantity' />} value={[quantity, quantityUnit].filter((value) => value !== null).join(' ')} /> : null}
          {valueflowsTime !== null ? <NativeField label={<FormattedMessage id='status.native.valueflows_time' defaultMessage='Time' />} value={String(valueflowsTime)} /> : null}
          {resourceAuthor !== null ? <NativeField label={<FormattedMessage id='status.native.resource_author' defaultMessage='Author' />} value={renderLinkedValue(String(resourceAuthor))} /> : null}
          {resourceSubject !== null ? <NativeField label={<FormattedMessage id='status.native.resource_subject' defaultMessage='Subject' />} value={String(resourceSubject)} /> : null}
          {resourceLevel !== null ? <NativeField label={<FormattedMessage id='status.native.resource_level' defaultMessage='Level' />} value={String(resourceLevel)} /> : null}
          {resourceLanguage !== null ? <NativeField label={<FormattedMessage id='status.native.resource_language' defaultMessage='Language' />} value={String(resourceLanguage)} /> : null}
          {resourceLicense !== null ? <NativeField label={<FormattedMessage id='status.native.resource_license' defaultMessage='License' />} value={String(resourceLicense)} /> : null}
          {typeof resourceUrl === 'string' ? <NativeField label={<FormattedMessage id='status.native.resource_file' defaultMessage='File' />} value={renderLinkedValue(resourceUrl)} /> : null}
        </dl>
      )}
    </aside>
  );
};

interface INativeField {
  label: React.ReactNode;
  value: React.ReactNode;
}

const NativeField: React.FC<INativeField> = ({ label, value }) => (
  <div>
    <dt className='inline font-semibold'>{label}{nativeFieldSeparator}</dt>
    <dd className='inline'>{value}</dd>
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

function renderNativeTypeLabel(platform: unknown, type: string, displayType: string) {
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
    return `${String(rating)}/${String(best)}`;
  }

  return String(rating);
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
