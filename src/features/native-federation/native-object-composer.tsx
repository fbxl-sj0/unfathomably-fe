/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/native-federation/native-object-composer.tsx

  Purpose:

    Provide useful authoring workflows for native objects shown in Worlds.

  Responsibilities:

    * collect type-specific metadata using familiar domain terminology
    * upload owned files through the normal Mastodon media API
    * submit only the bounded fields accepted by Unfathomably BE
    * explain what other people will be able to see and do

  This file intentionally does NOT contain:

    * arbitrary JSON-LD editing
    * remote URL fetching
    * upload storage or ActivityPub vocabulary construction
*/

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { updateMedia, uploadFile } from '@/actions/media.ts';
import { openModal } from '@/actions/modals.ts';
import { HTTPError } from '@/api/HTTPError.ts';
import BookShelfControl from '@/components/book-shelf-control.tsx';
import FileInput from '@/components/ui/file-input.tsx';
import Button from '@/components/ui/button.tsx';
import Checkbox from '@/components/ui/checkbox.tsx';
import Form from '@/components/ui/form.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Select from '@/components/ui/select.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import Textarea from '@/components/ui/textarea.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import toast from '@/toast.tsx';

import NativeWorkflowPath from './native-workflow-path.tsx';

import NativeCatalogLookup from './native-catalog-lookup.tsx';

type TemplateKey = 'audio' | 'video' | 'longform' | 'photo' | 'books' | 'bookmarks' | 'groups' | 'events' | 'software_project' | 'software' | 'models' | 'markets' | 'games' | 'routes' | 'culture' | 'coordination' | 'publishing';
type FieldValue = string | boolean;
type FieldInput = 'checkbox' | 'date' | 'datetime-local' | 'number' | 'select' | 'text' | 'url';
type BookAction = 'comment' | 'quote' | 'review';

interface WorkflowField {
  key: string;
  label: string;
  hint?: string;
  input?: FieldInput;
  max?: number;
  min?: number;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  step?: string;
}

interface WorkflowDefinition {
  accept: string;
  contentLabel: string;
  contentPlaceholder: string;
  fileHint: string;
  fields: WorkflowField[];
  label: string;
  launcher?: {
    label: string;
    modal: 'COMPOSE_EVENT' | 'CREATE_GROUP';
  };
  resourceFirst?: boolean;
  resourceRequired?: boolean;
  resourceRequiredMessage?: string;
  summary: string;
  submitLabel: string;
  titleLabel: string;
  titlePlaceholder: string;
}

interface MarketplaceConnectorStatus {
  connected_peers: number;
  pending_peers?: number;
  ready: boolean;
  requirements: string[];
  service_actor: string;
  unavailable_peers?: number;
}

interface ConnectorStatusResponse {
  marketplace?: MarketplaceConnectorStatus;
}

interface UploadedMedia {
  description: string;
  fileName: string;
  id: string;
  size: number;
}

interface NativeObjectResponse {
  id: string;
  url: string;
}

interface NativeObjectDraft {
  bookAction: BookAction;
  content: string;
  fieldValues: Record<string, FieldValue>;
  referenceUrl: string;
  spoilerText: string;
  title: string;
  uploadedMedia: UploadedMedia[];
  version: 1;
  visibility: string;
}

const messages = defineMessages({
  created: { id: 'native_federation.create.created', defaultMessage: 'World item published' },
  failedUpload: { id: 'native_federation.create.upload_failed', defaultMessage: 'The file could not be uploaded.' },
  locationFailed: { id: 'native_federation.create.location_failed', defaultMessage: 'Your approximate location could not be read. You can still publish this listing locally.' },
  locationReady: { id: 'native_federation.create.location_ready', defaultMessage: 'Approximate area added. Exact coordinates are not retained.' },
  tooManyFiles: { id: 'native_federation.create.too_many_files', defaultMessage: 'A World item can contain at most four files.' },
});

const option = (label: string, value: string) => ({ label, value });

const workflows: Record<TemplateKey, WorkflowDefinition> = {
  audio: {
    accept: 'audio/*,image/*',
    contentLabel: 'Track or episode description',
    contentPlaceholder: 'Introduce the recording, credits, context, and anything listeners should know.',
    fileHint: 'Start with the audio file. You may also attach cover art; describe the cover for people who cannot see it.',
    fields: [
      { key: 'artist', label: 'Artist or show', placeholder: 'The performer, creator, or podcast', required: true },
      { key: 'album', label: 'Album or series', placeholder: 'Optional album, release, or podcast series' },
      { key: 'track_number', label: 'Track or episode number', input: 'number', min: 1, step: '1' },
      { key: 'release_date', label: 'Release date', input: 'date' },
      { key: 'genres', label: 'Genres and topics', hint: 'Comma-separated terms help compatible music clients organize the recording.', placeholder: 'ambient, field recording, history' },
      { key: 'license', label: 'Listening and reuse license', placeholder: 'CC BY 4.0, All rights reserved...' },
    ],
    label: 'Audio',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Choose an audio file before publishing.',
    summary: 'Publish a playable track or podcast episode, following Funkwhale\'s file-first workflow.',
    submitLabel: 'Publish audio',
    titleLabel: 'Track or episode title',
    titlePlaceholder: 'The title listeners will recognize',
  },
  video: {
    accept: 'video/*,image/*,.vtt,text/vtt',
    contentLabel: 'Video description',
    contentPlaceholder: 'Explain what the video contains, credit participants, and add useful context or chapter notes.',
    fileHint: 'Start with the video. An optional image can serve as artwork and a WebVTT file can carry captions.',
    fields: [
      { key: 'channel', label: 'Series or channel', placeholder: 'Optional programme, series, or channel name' },
      { key: 'category', label: 'Category', placeholder: 'Documentary, tutorial, performance...' },
      { key: 'language', label: 'Spoken language', placeholder: 'English, French, Polish...' },
      { key: 'tags', label: 'Topics', placeholder: 'Comma-separated topics' },
      { key: 'license', label: 'Video license', placeholder: 'CC BY-SA 4.0, All rights reserved...' },
    ],
    label: 'Video',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Choose a video file before publishing.',
    summary: 'Upload a playable video first, then add the descriptive details viewers expect in PeerTube.',
    submitLabel: 'Publish video',
    titleLabel: 'Video title',
    titlePlaceholder: 'A clear title for the video',
  },
  longform: {
    accept: 'image/*,application/pdf',
    contentLabel: 'Article',
    contentPlaceholder: 'Write the complete article here. Use blank lines to separate paragraphs.',
    fileHint: 'Optional cover image or downloadable PDF. The article remains readable without opening an attachment.',
    fields: [
      { key: 'subtitle', label: 'Subtitle or deck', placeholder: 'A short line that expands on the headline' },
      { key: 'byline', label: 'Byline', hint: 'Leave blank to use your account identity.', placeholder: 'Author or organization' },
      { key: 'language', label: 'Article language', placeholder: 'English, fr, pl...' },
      { key: 'tags', label: 'Topics', placeholder: 'Comma-separated topics' },
      { key: 'license', label: 'Publication license', placeholder: 'CC BY 4.0, All rights reserved...' },
      { key: 'published_at', label: 'Publication date', input: 'date' },
    ],
    label: 'Article',
    summary: 'Write a readable long-form article with its headline, body, byline, topics, and optional cover.',
    submitLabel: 'Publish article',
    titleLabel: 'Headline',
    titlePlaceholder: 'The article headline',
  },
  photo: {
    accept: 'image/*',
    contentLabel: 'Caption',
    contentPlaceholder: 'Tell people what is happening in the photograph and why you are sharing it.',
    fileHint: 'Start with one or more photographs. Give every image a useful description after upload.',
    fields: [
      { key: 'album', label: 'Album or series', placeholder: 'Optional collection name' },
      { key: 'location', label: 'General location', hint: 'Avoid a private address.', placeholder: 'City, park, venue, or region' },
      { key: 'taken_at', label: 'When it was taken', input: 'datetime-local' },
      { key: 'license', label: 'Photo license', placeholder: 'CC BY-NC 4.0, All rights reserved...' },
    ],
    label: 'Photos',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Choose at least one photograph before publishing.',
    summary: 'Share described photographs with the caption, place, date, album, and license viewers expect in Pixelfed.',
    submitLabel: 'Publish photos',
    titleLabel: 'Photo story title',
    titlePlaceholder: 'A short title for this set',
  },
  books: {
    accept: 'image/*',
    contentLabel: 'Your review',
    contentPlaceholder: 'What should another reader know? Avoid repeating the synopsis.',
    fileHint: 'Optional cover or edition photos. Add a description so screen-reader users know what each image shows.',
    fields: [
      { key: 'author', label: 'Author', placeholder: 'Author or editor' },
      { key: 'isbn', label: 'ISBN', hint: 'Optional identifier printed near the barcode or copyright page.', placeholder: 'ISBN-10 or ISBN-13' },
      { key: 'edition', label: 'Edition', hint: 'Only needed when the publisher, translation, or revision matters.', placeholder: 'Publisher, translation, or edition' },
      { key: 'rating', label: 'Rating', input: 'select', options: [option('No rating', ''), ...[1, 2, 3, 4, 5].map((value) => option(`${value} of 5`, String(value)))] },
      { key: 'language', label: 'Book language', placeholder: 'English, French, Polish...' },
    ],
    label: 'Book review',
    resourceRequired: true,
    resourceRequiredMessage: 'Choose a federated BookWyrm book or edition before publishing.',
    summary: 'Review a specific federated book or edition. Reading state belongs on your shelves.',
    submitLabel: 'Publish review',
    titleLabel: 'Book title',
    titlePlaceholder: 'The title readers will recognize',
  },
  bookmarks: {
    accept: 'image/*,application/pdf',
    contentLabel: 'Your note (optional)',
    contentPlaceholder: 'Why is this worth saving, and what should a future reader know before opening it?',
    fileHint: 'Optional screenshot or archival PDF. The original URL remains the primary destination.',
    fields: [
      { key: 'url', label: 'Web address', input: 'url', placeholder: 'https://example.org/useful-page', required: true },
      { key: 'tags', label: 'Tags', hint: 'Comma-separated tags make the bookmark easier to find later.', placeholder: 'research, accessibility, reference' },
      { key: 'site_name', label: 'Site or publication', hint: 'Optional. Use the name people recognize, not another URL.', placeholder: 'Example Journal' },
    ],
    label: 'Bookmark',
    summary: 'Save and annotate a URL with a title and tags, following Postmarks rather than a generic post form.',
    submitLabel: 'Save bookmark',
    titleLabel: 'Bookmark title',
    titlePlaceholder: 'The page or resource title',
  },
  groups: {
    accept: '', contentLabel: '', contentPlaceholder: '', fileHint: '', fields: [],
    label: 'Community',
    launcher: { label: 'Open community creator', modal: 'CREATE_GROUP' },
    summary: 'Create a public or private community with its own identity, description, artwork, and moderation settings.',
    submitLabel: '', titleLabel: '', titlePlaceholder: '',
  },
  events: {
    accept: '', contentLabel: '', contentPlaceholder: '', fileHint: '', fields: [],
    label: 'Event',
    launcher: { label: 'Open event creator', modal: 'COMPOSE_EVENT' },
    summary: 'Schedule a real event with organizer, time, place, banner, participation, visibility, and description.',
    submitLabel: '', titleLabel: '', titlePlaceholder: '',
  },
  software_project: {
    accept: 'image/*,text/plain,application/pdf',
    contentLabel: 'Project description',
    contentPlaceholder: 'Explain what the project does, who it serves, and where contributors should begin.',
    fileHint: 'Optional logo, roadmap, architecture notes, contributor guide, or other project document.',
    fields: [
      { key: 'repository', label: 'Source repository', hint: 'Where people can inspect or clone the source.', input: 'url', placeholder: 'https://code.example/project' },
      { key: 'homepage', label: 'Project homepage', hint: 'The public introduction or documentation page.', input: 'url', placeholder: 'https://project.example' },
      { key: 'license', label: 'Software license', hint: 'Use the SPDX identifier when one exists.', placeholder: 'AGPL-3.0-or-later' },
      { key: 'project_status', label: 'Project status', input: 'select', options: [option('Active development', 'active'), option('Maintenance', 'maintenance'), option('Archived', 'archived')] },
      { key: 'topics', label: 'Topics', hint: 'Comma-separated terms help people discover the project.', placeholder: 'activitypub, federation, frontend' },
    ],
    label: 'Software project',
    summary: 'Create a local project workspace that people can discover, discuss, and file issues against.',
    submitLabel: 'Create project',
    titleLabel: 'Project name',
    titlePlaceholder: 'A recognizable project name',
  },
  software: {
    accept: 'image/*,text/plain,application/pdf,.log,.patch,.diff',
    contentLabel: 'Issue details',
    contentPlaceholder: 'Describe the result you expected, what happened, and reproducible steps.',
    fileHint: 'Optional screenshots, logs, patches, or a short PDF. Remove secrets and personal data before uploading.',
    fields: [
      { key: 'repository', label: 'Project repository or project page', hint: 'Every issue belongs to a project. Use the repository or federated project page maintainers recognize.', input: 'url', placeholder: 'https://code.example/project', required: true },
      { key: 'ticket_kind', label: 'Ticket type', input: 'select', options: [option('Bug', 'bug'), option('Feature', 'feature'), option('Task', 'task'), option('Security', 'security'), option('Documentation', 'documentation')] },
      { key: 'priority', label: 'Impact', hint: 'How severely this affects use, not a promise about scheduling.', input: 'select', options: [option('Low', 'low'), option('Normal', 'normal'), option('High', 'high'), option('Urgent', 'urgent')] },
      { key: 'version', label: 'Affected version', hint: 'Leave blank when the issue is not tied to a release.', placeholder: '3.5.0 or commit identifier' },
      { key: 'labels', label: 'Topics', hint: 'Comma-separated terms that help people find or triage the ticket.', placeholder: 'federation, accessibility, backend' },
    ],
    label: 'Software ticket',
    summary: 'Report a bug, request a feature, or publish a task that ForgeFed-style clients can understand.',
    submitLabel: 'Publish ticket',
    titleLabel: 'Issue title',
    titlePlaceholder: 'A specific, actionable summary',
  },
  models: {
    accept: 'image/*,.stl,.obj,.3mf,.step,.stp,.glb,.gltf,.zip,application/zip',
    contentLabel: 'Model notes',
    contentPlaceholder: 'Explain what the model is for, assembly or print requirements, and known limitations.',
    fileHint: 'Upload the model or archive and optional preview images. File names and media types identify the downloadable formats.',
    fields: [
      { key: 'version', label: 'Version or revision', placeholder: 'v2, 2026-07, final...' },
      { key: 'license', label: 'Reuse license', hint: 'Explain what other people may do with the model.', placeholder: 'CC BY-SA 4.0, CERN-OHL-S...' },
      { key: 'category', label: 'Category', placeholder: 'Replacement part, miniature, tool...' },
      { key: 'scale', label: 'Scale or dimensions', placeholder: '1:100 or 120 x 80 x 30 mm' },
      { key: 'printable', label: 'Designed for 3D printing', input: 'checkbox' },
    ],
    label: '3D model',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Start by choosing a model file or archive. Details come next.',
    summary: 'Upload one model\'s related files, then add creator, collection, license, tags, and notes. This creates a downloadable federated model post; remote Manyfold models remain followable model actors.',
    submitLabel: 'Publish model',
    titleLabel: 'Model name',
    titlePlaceholder: 'A descriptive model or part name',
  },
  markets: {
    accept: 'image/*,application/pdf',
    contentLabel: 'Listing description',
    contentPlaceholder: 'Describe the item or need honestly, including defects, constraints, and what is included.',
    fileHint: 'Add clear photos first. Each photo can have its own description; never upload identity or payment documents.',
    fields: [
      { key: 'listing_type', label: 'Listing type', input: 'select', options: [option('I am offering this', 'offer'), option('I am looking for this', 'request')] },
      { key: 'listing_mode', label: 'Listing mode', input: 'select', options: [option('Sell', 'sell'), option('Give away', 'giveaway'), option('Wanted', 'wanted')] },
      { key: 'share_with_marketplaces', label: 'Share this offer with approved marketplaces', hint: 'Off by default. When selected, a public offer with price, currency, and approximate public coordinates may be sent to marketplace instances approved by this server’s administrator. Requests are never sent this way.', input: 'checkbox' },
      { key: 'price', label: 'Price', hint: 'Numbers only. Describe negotiable prices in the listing.', input: 'number', min: 0, step: '0.01', placeholder: 'For example, 25.00' },
      { key: 'currency', label: 'Currency', hint: 'Use the familiar three-letter code.', placeholder: 'CAD, USD, EUR...' },
      { key: 'location', label: 'Where is it?', hint: 'Use a city, neighbourhood, or public meeting area, never a home address.', placeholder: 'City or general area' },
      { key: 'tags', label: 'Tags', hint: 'A few comma-separated words help people find the listing.', placeholder: 'radio, electronics, vintage' },
      { key: 'latitude', label: 'Latitude', hint: 'Optional for local listings. Needed, with longitude, when an administrator connects a compatible local marketplace.', input: 'number', min: -90, max: 90, step: '0.000001', placeholder: '43.6532' },
      { key: 'longitude', label: 'Longitude', hint: 'Use a public meeting area or neighbourhood centre, never a home address.', input: 'number', min: -180, max: 180, step: '0.000001', placeholder: '-79.3832' },
    ],
    label: 'Marketplace listing',
    resourceFirst: true,
    summary: 'Sell, give away, or ask for something using the same photos, price, tags, and location workflow as a native classified marketplace.',
    submitLabel: 'Publish listing',
    titleLabel: 'Item or request',
    titlePlaceholder: 'What are you offering or looking for?',
  },
  games: {
    accept: 'image/*,video/*,.pgn,text/plain',
    contentLabel: 'Game details',
    contentPlaceholder: 'Explain the game, match, position, rules, or how another person can participate.',
    fileHint: 'Optional board image, short video, PGN, rules, or save file.',
    fields: [
      { key: 'game_kind', label: 'Game type', input: 'select', options: [option('Chess', 'chess'), option('Tabletop', 'tabletop'), option('Video game', 'video'), option('Puzzle', 'puzzle'), option('Match', 'match'), option('Other', 'other')] },
      { key: 'players', label: 'Players or participants', placeholder: 'Names, handles, or open seats' },
      { key: 'platform', label: 'Platform or venue', placeholder: 'Castling.club, local table, PC...' },
      { key: 'start_time', label: 'Start time', input: 'datetime-local' },
      { key: 'fen', label: 'Chess position', hint: 'For chess only. Paste a FEN position when the board state matters.', placeholder: 'Optional FEN position' },
    ],
    label: 'Game or match',
    summary: 'Publish a playable project, scheduled match, active game, puzzle, or final result.',
    submitLabel: 'Publish game',
    titleLabel: 'Game or match title',
    titlePlaceholder: 'Name the game, match, or position',
  },
  routes: {
    accept: 'image/*,.fit,.gpx,.kml,.tcx,application/gpx+xml,application/xml+gpx,application/vnd.ant.fit,application/vnd.garmin.tcx+xml,application/vnd.google-earth.kml+xml',
    contentLabel: 'Route notes',
    contentPlaceholder: 'Describe terrain, access, hazards, accessibility, seasonal conditions, and preparation.',
    fileHint: 'Start with a GPX, FIT, TCX, or KML route and optional photos. Distance, elevation, and recorded timing are read from text route files; remove private home locations first.',
    fields: [
      { key: 'route_kind', label: 'Activity', input: 'select', options: [option('Trail', 'trail'), option('Hike', 'hike'), option('Run', 'run'), option('Ride', 'ride'), option('Walk', 'walk'), option('Paddle', 'paddle'), option('Other', 'other')] },
      { key: 'distance', label: 'Distance', hint: 'Use the adjacent unit selector.', input: 'number', min: 0, step: '0.01' },
      { key: 'distance_unit', label: 'Distance unit', input: 'select', options: [option('Kilometres', 'km'), option('Miles', 'mi'), option('Metres', 'm')] },
      { key: 'difficulty', label: 'Difficulty', input: 'select', options: [option('Unspecified', ''), option('Easy', 'easy'), option('Moderate', 'moderate'), option('Hard', 'hard'), option('Expert', 'expert')] },
      { key: 'duration', label: 'Typical duration', placeholder: '2 hours 30 minutes' },
      { key: 'location', label: 'Trailhead or region', placeholder: 'Public place or general region' },
      { key: 'elevation_gain', label: 'Elevation gain (m)', input: 'number', min: 0, step: '0.01' },
      { key: 'elevation_loss', label: 'Elevation loss (m)', input: 'number', min: 0, step: '0.01' },
      { key: 'start_time', label: 'Planned start', input: 'datetime-local' },
    ],
    label: 'Route or trail',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Choose a GPX, FIT, TCX, or KML route file before publishing.',
    summary: 'Share a usable route with distance, terrain, timing, elevation, location, and GPX.',
    submitLabel: 'Publish route',
    titleLabel: 'Route name',
    titlePlaceholder: 'A recognizable trail or route name',
  },
  culture: {
    accept: 'image/*',
    contentLabel: 'Your review or note (optional)',
    contentPlaceholder: 'What should someone else know about it? Leave blank if you only want to track or rate it.',
    fileHint: 'Optional personal photo. The catalog provider supplies the official cover and credits.',
    fields: [
      { key: 'status', label: 'My list', input: 'select', options: [option('Do not change a list', ''), option('Wishlist', 'wishlist'), option('In progress', 'progress'), option('Complete', 'complete'), option('Dropped', 'dropped')] },
      { key: 'rating', label: 'My rating', input: 'select', options: [option('No rating', ''), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => option(`${value} of 10`, String(value)))] },
      { key: 'category', label: 'Catalog kind', hint: 'Filled automatically when you choose a NeoDB result.', input: 'select', options: [option('Film', 'film'), option('Series', 'series'), option('Album', 'album'), option('Podcast', 'podcast'), option('Performance', 'performance'), option('Exhibition', 'exhibition'), option('Game', 'game'), option('Other work', 'other')] },
    ],
    label: 'Culture activity',
    resourceRequired: true,
    resourceRequiredMessage: 'Choose a federated NeoDB catalog item before tracking or reviewing it.',
    summary: 'Choose a real NeoDB catalog item, then put it on a list, rate it, or review it.',
    submitLabel: 'Share activity',
    titleLabel: 'Catalog item',
    titlePlaceholder: 'Choose an item above',
  },
  coordination: {
    accept: 'image/*,application/pdf,text/plain',
    contentLabel: 'What should people know?',
    contentPlaceholder: 'Explain what you are offering or requesting, any constraints, and how someone should respond.',
    fileHint: 'Optional plan, diagram, requirements, or reference document. Replies provide the local discussion channel.',
    fields: [
      { key: 'purpose', label: 'I am...', input: 'select', options: [option('Offering something', 'offer'), option('Looking for something', 'request')], required: true },
      { key: 'flow_action', label: 'Kind of exchange or activity', hint: 'This describes what will happen to the resource. It does not commit either person to a transaction.', input: 'select', options: [option('Give or transfer something', 'transfer'), option('Perform work or a service', 'work'), option('Let someone use something', 'use'), option('Produce or make something', 'produce'), option('Deliver a service', 'deliver-service'), option('Consume or use up something', 'consume')], required: true },
      { key: 'resource', label: 'What is needed or offered?', hint: 'Name the resource, service, or concrete outcome.', placeholder: 'Translation, transport, meeting space...', required: true },
      { key: 'quantity', label: 'How much?', hint: 'Use this only when the amount matters.', input: 'number', min: 0, step: '0.01' },
      { key: 'unit', label: 'Measured in', hint: 'Describe what the quantity counts.', placeholder: 'hours, seats, kg, copies...' },
      { key: 'location', label: 'Location or scope', placeholder: 'Online, city, region, project...' },
      { key: 'due', label: 'Needed by', input: 'datetime-local' },
      { key: 'skills', label: 'Skills or tags', placeholder: 'editing, carpentry, transport...' },
    ],
    label: 'Coordination',
    summary: 'Publish a ValueFlows offer or request. Your account is identified automatically as the provider or receiver; replies are the discussion channel.',
    submitLabel: 'Publish coordination item',
    titleLabel: 'Offer or request',
    titlePlaceholder: 'What are you offering or looking for?',
  },
  publishing: {
    accept: 'application/pdf,application/epub+zip,text/plain,text/markdown,.md,.epub,.odt,.doc,.docx,image/*',
    contentLabel: 'Abstract or introduction',
    contentPlaceholder: 'Give readers enough context to decide whether the document is useful to them.',
    fileHint: 'Upload the document or an accessible preview. The published World item becomes its permanent page.',
    fields: [
      { key: 'author', label: 'Author credit', hint: 'Leave blank to use the publishing account.', placeholder: 'Person or organization, if different' },
      { key: 'subject', label: 'Subject', placeholder: 'Primary topic or discipline' },
      { key: 'language', label: 'Language', placeholder: 'English, fr, pl...' },
      { key: 'license', label: 'License', placeholder: 'CC BY 4.0, All rights reserved...' },
      { key: 'level', label: 'Audience or level', placeholder: 'Introductory, technical, grades 9-12...' },
      { key: 'published_at', label: 'Publication date', input: 'date' },
    ],
    label: 'Publication',
    resourceFirst: true,
    resourceRequired: true,
    resourceRequiredMessage: 'Choose the document or an accessible preview before publishing.',
    summary: 'Publish a document with author, subject, language, license, audience, and downloadable file.',
    submitLabel: 'Publish document',
    titleLabel: 'Document title',
    titlePlaceholder: 'A clear publication title',
  },
};

const initialValues = (template: TemplateKey): Record<string, FieldValue> => {
  const defaults: Partial<Record<TemplateKey, Record<string, FieldValue>>> = {
    software_project: { project_status: 'active' },
    software: { priority: 'normal', state: 'open', ticket_kind: 'bug' },
    models: { printable: true },
    markets: { listing_mode: 'sell', listing_type: 'offer', share_with_marketplaces: false },
    games: { game_kind: 'other', state: 'planned' },
    routes: { distance_unit: 'km', route_kind: 'trail' },
    culture: { category: 'other' },
    coordination: { flow_action: 'transfer', purpose: 'offer' },
  };

  return { ...(defaults[template] || {}) };
};

const bookActions: Array<{ label: string; value: BookAction }> = [
  { label: 'Write a review', value: 'review' },
  { label: 'Comment on it', value: 'comment' },
  { label: 'Share a quote', value: 'quote' },
];

const isBookAction = (value: unknown): value is BookAction => (
  typeof value === 'string' && bookActions.some((action) => action.value === value)
);

const bookContentForSubmission = (
  action: BookAction,
  title: string,
  content: string,
  rating: FieldValue | undefined,
  quote: FieldValue | undefined,
): string => {
  const note = content.trim();
  if (note) return note;

  if (action === 'review') {
    return typeof rating === 'string' && rating
      ? `Rated ${title.trim()} ${rating} out of 5.`
      : '';
  }

  if (action === 'quote' && typeof quote === 'string' && quote.trim()) {
    return `Quoted from ${title.trim()}.`;
  }

  return '';
};

const isTemplateKey = (value: string | undefined): value is TemplateKey => (
  !!value && Object.prototype.hasOwnProperty.call(workflows, value)
);

const templatesByFamily: Record<string, TemplateKey[]> = {
  audio: ['audio'],
  video: ['video'],
  longform: ['longform'],
  photo: ['photo'],
  books: ['books'],
  bookmarks: ['bookmarks'],
  groups: ['groups'],
  events: ['events'],
  development: ['software_project', 'software'],
  models: ['models'],
  marketplace: ['markets'],
  games: ['games'],
  routes: ['routes'],
  culture: ['culture'],
  coordination: ['coordination'],
  publishing: ['publishing'],
};

const titleCanSupplyContent: TemplateKey[] = [
  'audio',
  'video',
  'photo',
  'bookmarks',
  'models',
  'routes',
  'publishing',
];

const draftStorageKey = (accountId: string, template: TemplateKey) => (
  `unfathomably:world-draft:v1:${accountId}:${template}`
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isUploadedMedia = (value: unknown): value is UploadedMedia => (
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.fileName === 'string'
  && typeof value.description === 'string'
  && typeof value.size === 'number'
  && Number.isFinite(value.size)
);

const readNativeObjectDraft = (accountId: string, template: TemplateKey): NativeObjectDraft | undefined => {
  try {
    const serialized = window.localStorage.getItem(draftStorageKey(accountId, template));
    if (!serialized) return undefined;

    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.version !== 1) return undefined;

    const storedFields = isRecord(value.fieldValues) ? value.fieldValues : {};
    const fieldValues = Object.fromEntries(
      Object.entries(storedFields)
        .filter((entry): entry is [string, FieldValue] => typeof entry[1] === 'string' || typeof entry[1] === 'boolean'),
    );

    const uploadedMedia = Array.isArray(value.uploadedMedia)
      ? value.uploadedMedia
        .filter(isUploadedMedia)
        .slice(0, 4)
        .map((media) => ({
          description: media.description.slice(0, 1500),
          fileName: media.fileName.slice(0, 512),
          id: media.id,
          size: Math.max(0, media.size),
        }))
      : [];

    const visibility = typeof value.visibility === 'string' && ['public', 'unlisted', 'private'].includes(value.visibility)
      ? value.visibility
      : 'public';

    return {
      bookAction: isBookAction(value.bookAction) ? value.bookAction : 'review',
      content: typeof value.content === 'string' ? value.content.slice(0, 100_000) : '',
      fieldValues: { ...initialValues(template), ...fieldValues },
      referenceUrl: typeof value.referenceUrl === 'string' ? value.referenceUrl.slice(0, 2048) : '',
      spoilerText: typeof value.spoilerText === 'string' ? value.spoilerText.slice(0, 500) : '',
      title: typeof value.title === 'string' ? value.title.slice(0, 200) : '',
      uploadedMedia,
      version: 1,
      visibility,
    };
  } catch {
    return undefined;
  }
};

const nativeObjectDraftHasContent = (template: TemplateKey, draft: NativeObjectDraft) => {
  const defaults = initialValues(template);
  const fieldKeys = new Set([...Object.keys(defaults), ...Object.keys(draft.fieldValues)]);
  const fieldsChanged = Array.from(fieldKeys).some((key) => draft.fieldValues[key] !== defaults[key]);

  return Boolean(
    draft.title.trim()
    || draft.content.trim()
    || draft.referenceUrl.trim()
    || draft.spoilerText.trim()
    || draft.uploadedMedia.length
    || fieldsChanged
    || draft.visibility !== 'public',
  );
};

const storeNativeObjectDraft = (accountId: string, template: TemplateKey, draft: NativeObjectDraft) => {
  try {
    const key = draftStorageKey(accountId, template);

    if (nativeObjectDraftHasContent(template, draft)) {
      window.localStorage.setItem(key, JSON.stringify(draft));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Browsers may deny or exhaust local storage. Publishing must remain usable.
  }
};

const removeNativeObjectDraft = (accountId: string, template: TemplateKey) => {
  try {
    window.localStorage.removeItem(draftStorageKey(accountId, template));
  } catch {
    // Clearing the visible form is still useful when storage is unavailable.
  }
};

interface INativeObjectComposer {
  family?: string;
  initialCategory?: string;
  initialReferenceUrl?: string;
  initialTitle?: string;
  initiallyExpanded?: boolean;
  preferredTemplate?: string;
}

const NativeObjectComposer: React.FC<INativeObjectComposer> = ({
  family,
  initialCategory,
  initialReferenceUrl,
  initialTitle,
  initiallyExpanded = false,
  preferredTemplate,
}) => {
  const api = useApi();
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const availableTemplates = templatesByFamily[family || ''] || (Object.keys(workflows) as TemplateKey[]);
  const preferredTemplateIsAvailable = isTemplateKey(preferredTemplate) && availableTemplates.includes(preferredTemplate);
  const startingTemplate = preferredTemplateIsAvailable ? preferredTemplate : availableTemplates[0] || 'books';
  const startingFields = {
    ...initialValues(startingTemplate),
    ...(startingTemplate === 'culture' && initialCategory ? { category: initialCategory } : {}),
  };
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [template, setTemplate] = useState<TemplateKey>(startingTemplate);
  const [bookAction, setBookAction] = useState<BookAction>('review');
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState('');
  const [referenceUrl, setReferenceUrl] = useState(initialReferenceUrl || '');
  const [spoilerText, setSpoilerText] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>(startingFields);
  const [visibility, setVisibility] = useState('public');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [created, setCreated] = useState<NativeObjectResponse>();
  const [draftContext, setDraftContext] = useState('');
  const definition = workflows[template];
  const { account } = useOwnAccount();

  const { data: connectorStatus } = useQuery({
    queryKey: ['native-federation', 'connectors'],
    queryFn: async (): Promise<ConnectorStatusResponse> => {
      const response = await api.get('/api/v1/discovery/native-objects/connectors');
      return response.json() as Promise<ConnectorStatusResponse>;
    },
    retry: false,
    staleTime: 60_000,
  });

  const marketplaceConnector = connectorStatus?.marketplace;

  const requiredFieldsReady = useMemo(() => definition.fields
    .filter((field) => field.required)
    .every((field) => {
      const value = fieldValues[field.key];
      return typeof value === 'boolean' ? value : Boolean(value?.trim());
    }), [definition.fields, fieldValues]);

  const referenceCanSupplyResource = ['books', 'culture', 'models', 'routes', 'publishing'].includes(template);
  const resourceReady = !definition.resourceRequired
    || uploadedMedia.length > 0
    || (referenceCanSupplyResource && Boolean(referenceUrl.trim()));

  const { mutate: createNativeObject, isPending } = useMutation({
    mutationFn: async (): Promise<NativeObjectResponse> => {
      await Promise.all(uploadedMedia.map(async (media) => {
        if (!media.description.trim()) return;
        const response = await dispatch(updateMedia(media.id, { description: media.description.trim() }));
        if (!response.ok) throw new Error('An attachment description could not be saved.');
      }));

      const fields: Record<string, FieldValue> = Object.fromEntries(Object.entries(fieldValues).filter(([_key, value]) => (
        typeof value === 'boolean' || value.trim() !== ''
      )));
      let submissionContent = content.trim();

      if (!submissionContent && titleCanSupplyContent.includes(template)) {
        submissionContent = title.trim();
      }

      if (template === 'books') {
        submissionContent = bookContentForSubmission(bookAction, title, content, fieldValues.rating, fieldValues.quote);
        fields.book_action = bookAction;
        delete fields.reading_status;

        if (bookAction === 'review') {
          delete fields.page;
          delete fields.quote;
        } else if (bookAction === 'comment') {
          delete fields.quote;
          delete fields.rating;
        } else {
          delete fields.rating;
        }
      }

      if (template === 'markets') {
        if (fields.listing_mode === 'giveaway') {
          fields.listing_type = 'offer';

          if (fields.share_with_marketplaces === true) {
            fields.price = '0.00';
          } else {
            delete fields.price;
            delete fields.currency;
          }
        } else if (fields.listing_mode === 'wanted') {
          fields.listing_type = 'request';
          fields.share_with_marketplaces = false;
        } else {
          fields.listing_type = 'offer';
        }
      }

      if (template === 'culture' && !submissionContent) {
        const status = typeof fieldValues.status === 'string' ? fieldValues.status : '';
        const rating = typeof fieldValues.rating === 'string' ? fieldValues.rating : '';
        const statusLabel = workflows.culture.fields
          .find((field) => field.key === 'status')
          ?.options?.find((item) => item.value === status)?.label;

        submissionContent = statusLabel && status
          ? `${statusLabel}: ${title.trim()}.`
          : rating
            ? `Rated ${title.trim()} ${rating} out of 10.`
            : `Shared ${title.trim()} from the cultural catalog.`;
      }

      const response = await api.post('/api/v1/discovery/native-objects', {
        template,
        title: title.trim(),
        content: submissionContent,
        fields,
        media_ids: uploadedMedia.map((media) => media.id),
        reference_url: referenceUrl || undefined,
        spoiler_text: spoilerText.trim() || undefined,
        visibility,
      });
      const result = await response.json() as Partial<NativeObjectResponse>;

      if (typeof result.id !== 'string' || typeof result.url !== 'string') {
        throw new Error('The server returned an invalid World item.');
      }

      return { id: result.id, url: result.url };
    },
    onSuccess: (result) => {
      if (account?.id) removeNativeObjectDraft(account.id, template);
      setCreated(result);
      setTitle('');
      setContent('');
      setBookAction('review');
      setReferenceUrl('');
      setSpoilerText('');
      setFieldValues(initialValues(template));
      setUploadedMedia([]);
      toast.success(messages.created);
    },
    onError: (error) => toast.showAlertForError(error as HTTPError),
  });

  const currentDraft = useMemo<NativeObjectDraft>(() => ({
    bookAction,
    content,
    fieldValues,
    referenceUrl,
    spoilerText,
    title,
    uploadedMedia,
    version: 1,
    visibility,
  }), [bookAction, content, fieldValues, referenceUrl, spoilerText, title, uploadedMedia, visibility]);

  const hasDraft = useMemo(
    () => nativeObjectDraftHasContent(template, currentDraft),
    [currentDraft, template],
  );

  const persistCurrentDraft = useCallback(() => {
    if (!account?.id || draftContext !== draftStorageKey(account.id, template)) return;
    storeNativeObjectDraft(account.id, template, currentDraft);
  }, [account?.id, currentDraft, draftContext, template]);

  const applyDraft = useCallback((
    nextTemplate: TemplateKey,
    draft: NativeObjectDraft | undefined,
    fallbackReference = '',
    fallbackTitle = '',
    fallbackCategory = '',
  ) => {
    setTitle(draft?.title || fallbackTitle);
    setContent(draft?.content || '');
    setBookAction(draft?.bookAction || 'review');
    setReferenceUrl(draft?.referenceUrl || fallbackReference);
    setSpoilerText(draft?.spoilerText || '');
    setFieldValues(draft?.fieldValues || {
      ...initialValues(nextTemplate),
      ...(nextTemplate === 'culture' && fallbackCategory ? { category: fallbackCategory } : {}),
    });
    setVisibility(draft?.visibility || 'public');
    setUploadedMedia(draft?.uploadedMedia || []);
  }, []);

  const selectTemplate = useCallback((
    nextTemplate: TemplateKey,
    fallbackReference = '',
    fallbackTitle = '',
    fallbackCategory = '',
  ) => {
    if (!availableTemplates.includes(nextTemplate)) return;

    persistCurrentDraft();

    const nextDraft = account?.id ? readNativeObjectDraft(account.id, nextTemplate) : undefined;
    setTemplate(nextTemplate);
    applyDraft(nextTemplate, nextDraft, fallbackReference, fallbackTitle, fallbackCategory);
    setDraftContext(account?.id ? draftStorageKey(account.id, nextTemplate) : '');
    setCreated(undefined);
  }, [account?.id, applyDraft, availableTemplates, persistCurrentDraft]);

  useEffect(() => {
    if (!account?.id) return;

    const context = draftStorageKey(account.id, template);
    if (draftContext === context) return;

    const savedDraft = initialReferenceUrl ? undefined : readNativeObjectDraft(account.id, template);
    applyDraft(
      template,
      savedDraft,
      initialReferenceUrl || '',
      initialTitle || '',
      initialCategory || '',
    );
    setDraftContext(context);
  }, [account?.id, applyDraft, draftContext, initialCategory, initialReferenceUrl, initialTitle, template]);

  useEffect(() => {
    if (!account?.id || draftContext !== draftStorageKey(account.id, template)) return;

    const timeout = window.setTimeout(() => {
      storeNativeObjectDraft(account.id, template, currentDraft);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [account?.id, currentDraft, draftContext, template]);

  useEffect(() => {
    if (isTemplateKey(preferredTemplate) && availableTemplates.includes(preferredTemplate) && preferredTemplate !== template) {
      selectTemplate(preferredTemplate, initialReferenceUrl || '', initialTitle || '', initialCategory || '');
    }
  }, [availableTemplates, initialCategory, initialReferenceUrl, initialTitle, preferredTemplate, selectTemplate, template]);

  useEffect(() => {
    if (initialReferenceUrl && !referenceUrl && !created) setReferenceUrl(initialReferenceUrl);
  }, [created, initialReferenceUrl, referenceUrl]);

  useEffect(() => {
    if (initialTitle && !title && !created) setTitle(initialTitle);
  }, [created, initialTitle, title]);

  const clearDraft = () => {
    if (account?.id) removeNativeObjectDraft(account.id, template);
    applyDraft(template, undefined);
    setCreated(undefined);
  };

  const updateField = (key: string, value: FieldValue) => {
    setFieldValues((current) => ({ ...current, [key]: value }));
  };

  const useApproximateLocation = () => {
    if (!navigator.geolocation) {
      toast.error(messages.locationFailed);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Two decimal places identify an area of roughly one kilometre rather
        // than publishing the device's precise position as listing metadata.
        setFieldValues((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(2),
          longitude: coords.longitude.toFixed(2),
        }));
        setIsLocating(false);
        toast.success(messages.locationReady);
      },
      () => {
        setIsLocating(false);
        toast.error(messages.locationFailed);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(event.target.files || []);
    event.target.value = '';

    if (uploadedMedia.length + files.length > 4) {
      toast.error(messages.tooManyFiles);
      return;
    }

    if (template === 'routes') {
      const { isRouteDataFile, prepareRouteDataFileForUpload, readRouteFileMetadata } = await import('./route-file-metadata.ts');
      const routeFile = files.find(isRouteDataFile);
      if (routeFile) {
        const metadata = await readRouteFileMetadata(routeFile).catch(() => null);

        if (metadata) {
          if (!title.trim() && metadata.title) setTitle(metadata.title);
          setFieldValues((current) => ({ ...current, ...metadata.fields }));
        }
      }

      files = files.map((file) => isRouteDataFile(file) ? prepareRouteDataFileForUpload(file) : file);
    }

    setIsUploading(true);

    try {
      const uploaded: UploadedMedia[] = [];

      for (const file of files) {
        const media = await new Promise<UploadedMedia>((resolve, reject) => {
          dispatch(uploadFile(
            file,
            intl,
            (data) => {
              const id = data && typeof data.id === 'string' ? data.id : null;
              if (!id) {
                reject(new Error('The media server returned an invalid attachment.'));
                return;
              }
              resolve({ id, fileName: file.name, size: file.size, description: '' });
            },
            reject,
          ));
        });

        uploaded.push(media);
      }

      setUploadedMedia((current) => [...current, ...uploaded]);
    } catch (error) {
      toast.showAlertForError((error || new Error(intl.formatMessage(messages.failedUpload))) as HTTPError);
    } finally {
      setIsUploading(false);
    }
  };

  const [isLocating, setIsLocating] = useState(false);
  const marketplaceSharing = template === 'markets' && fieldValues.share_with_marketplaces === true;
  const marketplaceMode = template === 'markets'
    ? String(fieldValues.listing_mode || (fieldValues.listing_type === 'request' ? 'wanted' : 'sell'))
    : 'sell';
  const marketplaceShareReady = !marketplaceSharing || (
    fieldValues.listing_type === 'offer'
    && (marketplaceMode === 'giveaway' || Boolean(String(fieldValues.price || '').trim()))
    && Boolean(String(fieldValues.currency || '').trim())
    && Boolean(String(fieldValues.latitude || '').trim())
    && Boolean(String(fieldValues.longitude || '').trim())
    && visibility === 'public'
  );
  const submissionContent = template === 'books'
    ? bookContentForSubmission(bookAction, title, content, fieldValues.rating, fieldValues.quote)
    : content.trim() || (
      titleCanSupplyContent.includes(template)
        ? title.trim()
        : ''
    );
  const bookQuote = typeof fieldValues.quote === 'string' ? fieldValues.quote.trim() : '';
  const bookActionReady = template !== 'books'
    || (bookAction === 'review' && Boolean(content.trim() || fieldValues.rating))
    || (bookAction === 'comment' && Boolean(content.trim()))
    || (bookAction === 'quote' && Boolean(bookQuote));
  const canSubmit = !isPending
    && !isUploading
    && !isLocating
    && Boolean(title.trim())
    && (template === 'culture' || Boolean(submissionContent))
    && bookActionReady
    && requiredFieldsReady
    && resourceReady
    && marketplaceShareReady;

  const visibleFields = definition.fields.filter((field) => {
    if (template === 'books') return field.key !== 'rating';
    if (template === 'markets') {
      if (['listing_type', 'listing_mode', 'share_with_marketplaces', 'latitude', 'longitude'].includes(field.key)) return false;
      if (marketplaceMode === 'giveaway' && field.key === 'price') return false;
      if (marketplaceMode === 'giveaway' && !marketplaceSharing && field.key === 'currency') return false;
    }
    return true;
  });

  const renderBookActions = () => (
    <Stack space={3}>
      {referenceUrl ? (
        <BookShelfControl
          bookUri={referenceUrl}
          canReview={false}
          native={{
            author: typeof fieldValues.author === 'string' ? fieldValues.author : undefined,
            isbn: typeof fieldValues.isbn === 'string' ? fieldValues.isbn : undefined,
            title,
          }}
        />
      ) : null}

      <FormGroup labelText='What do you want to share?'>
        <div className='flex flex-wrap gap-2'>
          {bookActions.map((action) => (
            <Button
              key={action.value}
              type='button'
              theme={bookAction === action.value ? 'primary' : 'secondary'}
              aria-pressed={bookAction === action.value}
              onClick={() => setBookAction(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </FormGroup>

      {bookAction === 'review' ? (
        <FormGroup labelText='Your rating' hintText='Optional. Select a star again to use a half-star rating.'>
          <div className='flex flex-wrap items-center gap-2'>
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = Number(fieldValues.rating || 0);
              const halfSelected = rating === star - 0.5;
              const fullSelected = rating >= star;

              return (
                <button
                  key={star}
                  type='button'
                  className='min-h-11 min-w-11 rounded-lg border border-gray-300 px-3 py-2 text-xl font-black text-primary-700 hover:border-primary-500 black:border-gray-700 black:text-primary-300 dark:border-gray-700 dark:text-primary-300'
                  aria-label={`${halfSelected ? star - 0.5 : star} out of 5 stars`}
                  aria-pressed={halfSelected || fullSelected}
                  onClick={() => updateField('rating', String(rating === star ? star - 0.5 : star))}
                >
                  {fullSelected ? '★' : halfSelected ? '½' : '☆'}
                </button>
              );
            })}
            {fieldValues.rating ? (
              <Button type='button' theme='tertiary' onClick={() => updateField('rating', '')}>Clear rating</Button>
            ) : null}
          </div>
        </FormGroup>
      ) : null}

      {bookAction === 'quote' ? (
        <FormGroup labelText='Passage' hintText='Enter the words exactly as they appear in the edition.'>
          <Textarea rows={5} value={typeof fieldValues.quote === 'string' ? fieldValues.quote : ''} placeholder='The passage you want to share' onChange={(event) => updateField('quote', event.target.value)} required />
        </FormGroup>
      ) : null}

      {bookAction !== 'review' ? (
        <WorkflowInput
          field={{ key: 'page', label: 'Page', hint: 'Optional. Use the page number from this edition.', input: 'number', min: 1, max: 1_000_000, step: '1' }}
          value={fieldValues.page}
          onChange={(value) => updateField('page', value)}
        />
      ) : null}

      <FormGroup
        labelText={bookAction === 'review' ? 'Your review' : bookAction === 'comment' ? 'Your comment' : 'Your thoughts'}
        hintText={bookAction === 'review' ? 'A rating can stand alone. The book title identifies the work; your review does not need a headline.' : bookAction === 'comment' ? 'Comments discuss the book without presenting a full review.' : 'Optional context for the quoted passage.'}
      >
        <Textarea rows={7} value={content} placeholder={bookAction === 'review' ? definition.contentPlaceholder : bookAction === 'comment' ? 'What do you want to say about this book?' : 'Why does this passage matter to you?'} onChange={(event) => setContent(event.target.value)} required={bookAction === 'comment'} />
      </FormGroup>

      <FormGroup labelText='Content warning' hintText='Optional. Readers can choose whether to reveal this post.'>
        <Input value={spoilerText} maxLength={500} placeholder='For example: discusses the ending' onChange={(event) => setSpoilerText(event.target.value)} />
      </FormGroup>

      <details className='border-y border-gray-200 py-3 black:border-gray-800 dark:border-gray-800'>
        <summary className='cursor-pointer text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>Edition details</summary>
        <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {visibleFields.map((field) => (
            <WorkflowInput key={field.key} field={field} value={fieldValues[field.key]} onChange={(value) => updateField(field.key, value)} />
          ))}
        </div>
      </details>
    </Stack>
  );

  const renderCoordinationActions = () => {
    const purpose = fieldValues.purpose === 'request' ? 'request' : 'offer';
    const actionLabels: Record<string, [string, string]> = {
      consume: ['Take or use up supplies', 'I need consumable supplies'],
      'deliver-service': ['Provide a service', 'I need a service'],
      produce: ['Make something', 'I need something made'],
      transfer: ['Give something', 'I need an item'],
      use: ['Lend something', 'I need to borrow something'],
      work: ['Offer time or a skill', 'I need help with a task'],
    };
    const coordinationField = (key: string) => definition.fields.find((field) => field.key === key);
    const renderCoordinationField = (key: string) => {
      const field = coordinationField(key);
      return field ? <WorkflowInput key={key} field={field} value={fieldValues[key]} onChange={(value) => updateField(key, value)} /> : null;
    };

    return (
      <>
        <FormGroup labelText='What brings you here?'>
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button type='button' theme={purpose === 'offer' ? 'primary' : 'secondary'} aria-pressed={purpose === 'offer'} onClick={() => updateField('purpose', 'offer')}>I can help</Button>
            <Button type='button' theme={purpose === 'request' ? 'primary' : 'secondary'} aria-pressed={purpose === 'request'} onClick={() => updateField('purpose', 'request')}>I need help</Button>
          </div>
        </FormGroup>

        <FormGroup labelText={purpose === 'offer' ? 'What can you offer?' : 'What do you need?'}>
          <div className='flex flex-wrap gap-2'>
            {Object.entries(actionLabels).map(([value, labels]) => (
              <Button key={value} type='button' theme={fieldValues.flow_action === value ? 'primary' : 'secondary'} aria-pressed={fieldValues.flow_action === value} onClick={() => updateField('flow_action', value)}>
                {labels[purpose === 'offer' ? 0 : 1]}
              </Button>
            ))}
          </div>
        </FormGroup>

        {renderCoordinationField('resource')}

        <FormGroup labelText='Details' hintText='Explain enough for someone to decide whether they can respond.'>
          <Textarea rows={7} value={content} placeholder={definition.contentPlaceholder} onChange={(event) => setContent(event.target.value)} required />
        </FormGroup>

        <details className='border-y border-gray-200 py-3 black:border-gray-800 dark:border-gray-800'>
          <summary className='cursor-pointer text-sm font-bold text-primary-700 black:text-primary-300 dark:text-primary-300'>Timing, place, amount, and skills</summary>
          <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {['quantity', 'unit', 'location', 'due', 'skills'].map(renderCoordinationField)}
          </div>
        </details>
      </>
    );
  };

  const renderCultureActions = () => {
    const category = String(fieldValues.category || 'other');
    const statusWords: Record<string, [string, string, string]> = {
      album: ['listen to', 'Listening', 'Listened'],
      film: ['watch', 'Watching', 'Watched'],
      game: ['play', 'Playing', 'Played'],
      podcast: ['listen to', 'Listening', 'Listened'],
      series: ['watch', 'Watching', 'Watched'],
    };
    const [wishlistVerb, progressLabel, completeLabel] = statusWords[category] || ['try', 'In progress', 'Complete'];
    const statuses = [
      { label: `Want to ${wishlistVerb}`, value: 'wishlist' },
      { label: progressLabel, value: 'progress' },
      { label: completeLabel, value: 'complete' },
      { label: 'Stopped', value: 'dropped' },
    ];

    return (
      <>
        <FormGroup labelText='Add to my list' hintText='Optional. Choose the state that matches what you are doing now.'>
          <div className='flex flex-wrap gap-2'>
            {statuses.map((status) => (
              <Button key={status.value} type='button' theme={fieldValues.status === status.value ? 'primary' : 'secondary'} aria-pressed={fieldValues.status === status.value} onClick={() => updateField('status', fieldValues.status === status.value ? '' : status.value)}>
                {status.label}
              </Button>
            ))}
          </div>
        </FormGroup>

        <FormGroup labelText='My rating' hintText='Optional. Select a star again to use a half-star rating.'>
          <div className='flex flex-wrap items-center gap-2'>
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = Number(fieldValues.rating || 0);
              const fullValue = star * 2;
              const halfSelected = rating === fullValue - 1;
              const fullSelected = rating >= fullValue;

              return (
                <button
                  key={star}
                  type='button'
                  className='min-h-11 min-w-11 rounded-lg border border-gray-300 px-3 py-2 text-xl font-black text-primary-700 hover:border-primary-500 black:border-gray-700 black:text-primary-300 dark:border-gray-700 dark:text-primary-300'
                  aria-label={`${halfSelected ? star - 0.5 : star} out of 5 stars`}
                  aria-pressed={halfSelected || fullSelected}
                  onClick={() => updateField('rating', String(rating === fullValue ? fullValue - 1 : fullValue))}
                >
                  {fullSelected ? '★' : halfSelected ? '½' : '☆'}
                </button>
              );
            })}
            {fieldValues.rating ? <Button type='button' theme='tertiary' onClick={() => updateField('rating', '')}>Clear rating</Button> : null}
          </div>
        </FormGroup>

        <FormGroup labelText='Your review or note' hintText='Optional when you only want to update your list or rating.'>
          <Textarea rows={7} value={content} placeholder={definition.contentPlaceholder} onChange={(event) => setContent(event.target.value)} />
        </FormGroup>
      </>
    );
  };

  const renderMarketplaceStart = () => (
    <FormGroup labelText='What are you doing?'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
        <Button
          type='button'
          theme={marketplaceMode === 'sell' ? 'primary' : 'secondary'}
          aria-pressed={marketplaceMode === 'sell'}
          onClick={() => setFieldValues((current) => ({ ...current, listing_mode: 'sell', listing_type: 'offer' }))}
        >
          Sell
        </Button>
        <Button
          type='button'
          theme={marketplaceMode === 'giveaway' ? 'primary' : 'secondary'}
          aria-pressed={marketplaceMode === 'giveaway'}
          onClick={() => setFieldValues((current) => ({ ...current, listing_mode: 'giveaway', listing_type: 'offer', price: '' }))}
        >
          Give away
        </Button>
        <Button
          type='button'
          theme={marketplaceMode === 'wanted' ? 'primary' : 'secondary'}
          aria-pressed={marketplaceMode === 'wanted'}
          onClick={() => setFieldValues((current) => ({ ...current, listing_mode: 'wanted', listing_type: 'request', share_with_marketplaces: false }))}
        >
          Wanted
        </Button>
      </div>
    </FormGroup>
  );

  const renderMarketplaceReach = () => {
    if (fieldValues.listing_type === 'request' || !marketplaceConnector?.ready) return null;

    const hasApproximateArea = Boolean(fieldValues.latitude && fieldValues.longitude);

    return (
      <Stack space={2} className='border-y border-gray-200 py-4 black:border-gray-800 dark:border-gray-800'>
        <label className='flex cursor-pointer items-start gap-3'>
          <Checkbox
            checked={marketplaceSharing}
            onChange={() => {
              const enabled = !marketplaceSharing;
              updateField('share_with_marketplaces', enabled);
              if (enabled) setVisibility('public');
            }}
          />
          <span>
            <Text size='sm' weight='semibold'>Show this {marketplaceMode === 'giveaway' ? 'giveaway' : 'listing'} on connected local marketplaces</Text>
            <Text size='xs' theme='muted'>Choose a currency and approximate area. Giveaways are sent with a zero price. Exact device coordinates are never published.</Text>
          </span>
        </label>

        {marketplaceSharing ? (
          <div className='flex flex-wrap items-center gap-2 pl-8'>
            <Button type='button' theme='secondary' disabled={isLocating} onClick={useApproximateLocation}>
              {isLocating ? 'Finding your area...' : hasApproximateArea ? 'Update approximate area' : 'Use my approximate area'}
            </Button>
            {hasApproximateArea ? <Text size='sm' theme='muted'>Approximate area ready</Text> : <Text size='sm' theme='danger'>Add an approximate area before publishing to connected markets.</Text>}
          </div>
        ) : null}
      </Stack>
    );
  };

  const renderModelMetadata = () => {
    const fields = [
      { key: 'creator', label: 'Designer or creator', hint: 'Credit the person or organization responsible for the model.', placeholder: 'Name or studio' },
      { key: 'collection', label: 'Collection', hint: 'Group related parts or models under a name people can browse.', placeholder: 'Project, set, or collection' },
      { key: 'license', label: 'License', hint: 'Use the license identifier supplied by the creator when possible.', placeholder: 'CC-BY-SA-4.0, GPL-3.0-only...' },
      { key: 'tags', label: 'Tags', hint: 'Comma-separated terms make the model easier to find.', placeholder: 'enclosure, radio, printable' },
    ];

    return (
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {fields.map((field) => (
          <WorkflowInput key={field.key} field={field} value={fieldValues[field.key]} onChange={(value) => updateField(field.key, value)} />
        ))}
      </div>
    );
  };

  const renderRouteMetadata = () => {
    const routeFields = definition.fields.filter((field) => ['route_kind', 'difficulty', 'location'].includes(field.key));
    const derivedFacts = [
      fieldValues.distance ? `${fieldValues.distance} ${fieldValues.distance_unit || 'm'}` : '',
      fieldValues.elevation_gain ? `+${fieldValues.elevation_gain} m` : '',
      fieldValues.elevation_loss ? `-${fieldValues.elevation_loss} m` : '',
      fieldValues.duration ? `${fieldValues.duration} seconds recorded` : '',
    ].filter(Boolean);

    return (
      <Stack space={3}>
        {derivedFacts.length > 0 ? (
          <div className='rounded-lg border border-primary-300 bg-primary-50 p-3 black:border-primary-800 black:bg-primary-950 dark:border-primary-700 dark:bg-primary-950/50'>
            <Text size='sm' weight='semibold'>Read from the route file</Text>
            <Text className='mt-1' size='sm' theme='muted'>{derivedFacts.join(' / ')}</Text>
          </div>
        ) : null}

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {routeFields.map((field) => (
            <WorkflowInput key={field.key} field={field} value={fieldValues[field.key]} onChange={(value) => updateField(field.key, value)} />
          ))}
          <WorkflowInput
            field={{ key: 'tags', label: 'Tags', hint: 'Add a few comma-separated route qualities people might search for.', placeholder: 'forest, dog-friendly, sunset' }}
            value={fieldValues.tags}
            onChange={(value) => updateField('tags', value)}
          />
        </div>
      </Stack>
    );
  };

  const renderFiles = () => (
    <>
      <FormGroup labelText={<FormattedMessage id='native_federation.create.files' defaultMessage='Files and images' />} hintText={definition.fileHint}>
        <FileInput accept={definition.accept} multiple disabled={isUploading || uploadedMedia.length >= 4} onChange={uploadFiles} />
        {isUploading ? <Text size='sm' theme='muted'><FormattedMessage id='native_federation.create.uploading' defaultMessage='Uploading and processing files...' /></Text> : null}
        {definition.resourceRequired && !resourceReady ? <Text size='sm' theme='danger'>{definition.resourceRequiredMessage || 'Upload at least one file.'}</Text> : null}
      </FormGroup>

      {uploadedMedia.length > 0 ? (
        <Stack space={2} className='rounded-xl border border-solid border-gray-200 black:border-gray-800 bg-white black:bg-black p-3 dark:border-gray-700 dark:bg-primary-800/40'>
          {uploadedMedia.map((media) => (
            <div key={media.id} className='grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]'>
              <div className='min-w-0'>
                <Text size='sm' weight='medium' truncate>{media.fileName}</Text>
                <Text size='xs' theme='muted'>{formatFileSize(media.size)}</Text>
              </div>
              <Input
                value={media.description}
                maxLength={1500}
                placeholder='Describe this file or image for people who cannot inspect it'
                onChange={(event) => setUploadedMedia((current) => current.map((item) => item.id === media.id ? { ...item, description: event.target.value } : item))}
              />
              <Button type='button' theme='secondary' onClick={() => setUploadedMedia((current) => current.filter((item) => item.id !== media.id))}>
                <FormattedMessage id='native_federation.create.remove_file' defaultMessage='Remove' />
              </Button>
            </div>
          ))}
        </Stack>
      ) : null}
    </>
  );

  return (
    <section className='relative rounded-xl border border-solid border-gray-200 black:border-gray-800 bg-white black:bg-black shadow-sm dark:border-gray-800 dark:bg-primary-900'>
      <div className='p-5 sm:p-6'>
        <Stack space={4}>
          <HStack alignItems='center' justifyContent='between' space={4}>
            <Stack space={1}>
              <Text size='lg' weight='bold'>{availableTemplates.length === 1 ? definition.label : family === 'development' ? 'What are you working on?' : <FormattedMessage id='native_federation.create.heading' defaultMessage='Make something the wider fediverse can use' />}</Text>
              <Text size='sm' theme='muted'>{availableTemplates.length === 1 ? definition.summary : <FormattedMessage id='native_federation.create.summary' defaultMessage='Choose what you want to make. Each workflow follows the conventions people already know from that kind of software.' />}</Text>
            </Stack>
            {!family ? (
              <Button type='button' theme={expanded ? 'secondary' : 'primary'} onClick={() => setExpanded((value) => !value)}>
                {expanded ? <FormattedMessage id='native_federation.create.close' defaultMessage='Close' /> : <FormattedMessage id='native_federation.create.open' defaultMessage='Create' />}
              </Button>
            ) : null}
          </HStack>

          {(expanded || Boolean(family)) && (
            <Stack space={5}>
              {availableTemplates.length > 1 ? (
                <div className='grid grid-cols-2 gap-2'>
                  {availableTemplates.map((key) => {
                    const workflow = workflows[key];
                    const selected = key === template;
                    return (
                      <button
                        key={key}
                        type='button'
                        title={workflow.summary}
                        aria-label={`${workflow.label}: ${workflow.summary}`}
                        className={`min-h-12 min-w-0 break-words rounded-lg border border-solid px-3 py-2 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 black:focus-visible:ring-offset-black dark:focus-visible:ring-offset-primary-900 ${selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 black:border-gray-700 bg-white black:bg-black text-gray-700 black:text-gray-200 hover:border-primary-500 hover:text-primary-700 black:hover:text-primary-300 dark:border-gray-700 dark:bg-primary-900 dark:text-gray-200 dark:hover:border-primary-400 dark:hover:bg-primary-800 dark:hover:text-white'}`}
                        aria-pressed={selected}
                        onClick={() => selectTemplate(key)}
                      >
                        {workflow.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <NativeWorkflowPath template={template} />

              {definition.launcher ? (
                <div className='rounded-xl border border-solid border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 p-5 dark:border-primary-800 dark:bg-primary-950/30'>
                  <Text size='lg' weight='bold'>{definition.label}</Text>
                  <Text className='mt-2' theme='muted'>{definition.summary}</Text>
                  <Button className='mt-4' type='button' theme='primary' onClick={() => dispatch(openModal(definition.launcher!.modal))}>
                    {definition.launcher.label}
                  </Button>
                </div>
              ) : (
                <Form onSubmit={() => createNativeObject()}>
                  <NativeCatalogLookup
                    key={template}
                    template={template}
                    onApply={(candidate) => {
                      setTitle(candidate.title);
                      setFieldValues((values) => ({ ...values, ...candidate.fields }));
                      setReferenceUrl(candidate.reference_url || '');
                      if (template === 'books') setBookAction('review');
                    }}
                  />
                  {definition.resourceFirst ? renderFiles() : null}
                  {definition.resourceFirst && definition.resourceRequired && !resourceReady ? (
                    <Text size='sm' theme='muted'>Choose the file or resource first. The details will appear after it is ready.</Text>
                  ) : (
                    <>
                      {template === 'markets' ? renderMarketplaceStart() : null}

                      {(template === 'books' || template === 'culture') && referenceUrl && title ? (
                        <section className='border-y border-gray-200 py-3 black:border-gray-800 dark:border-gray-800'>
                          <p className='text-xs font-bold uppercase tracking-wide text-gray-500 black:text-gray-400 dark:text-gray-400'>{template === 'books' ? 'Selected book' : 'Selected catalog item'}</p>
                          <p className='mt-1 text-base font-black text-gray-950 black:text-white dark:text-white'>{title}</p>
                          {template === 'books' && typeof fieldValues.author === 'string' && fieldValues.author.trim() ? <p className='text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>by {fieldValues.author}</p> : null}
                          <Button
                            className='mt-2'
                            type='button'
                            theme='tertiary'
                            onClick={() => {
                              setTitle('');
                              setReferenceUrl('');
                              setFieldValues(initialValues(template));
                            }}
                          >
                            {template === 'books' ? 'Choose another book' : 'Choose another item'}
                          </Button>
                        </section>
                      ) : (
                        <FormGroup labelText={definition.titleLabel} hintText={<FormattedMessage id='native_federation.create.permalink_hint' defaultMessage='A permanent link is created automatically when you publish.' />}>
                          <Input value={title} maxLength={200} placeholder={definition.titlePlaceholder} onChange={(event) => setTitle(event.target.value)} required />
                        </FormGroup>
                      )}

                      {template === 'books' ? renderBookActions() : template === 'culture' ? renderCultureActions() : template === 'coordination' ? renderCoordinationActions() : (
                        <FormGroup labelText={definition.contentLabel}>
                          <Textarea rows={template === 'longform' ? 14 : 5} value={content} placeholder={definition.contentPlaceholder} onChange={(event) => setContent(event.target.value)} required={!titleCanSupplyContent.includes(template)} />
                        </FormGroup>
                      )}

                      {template === 'models' ? renderModelMetadata() : template === 'routes' ? renderRouteMetadata() : template !== 'books' && template !== 'culture' && template !== 'coordination' ? (
                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                          {visibleFields.map((field) => (
                            <WorkflowInput key={field.key} field={field} value={fieldValues[field.key]} onChange={(value) => updateField(field.key, value)} />
                          ))}
                        </div>
                      ) : null}

                      {template === 'markets' ? renderMarketplaceReach() : null}
                      {!definition.resourceFirst ? renderFiles() : null}

                      <FormGroup labelText={<FormattedMessage id='native_federation.create.visibility' defaultMessage='Who can see this?' />} hintText={<FormattedMessage id='native_federation.create.visibility_hint' defaultMessage='Replies, favourites, shares, and deletion work like they do for an ordinary post.' />}>
                        <Select value={visibility} disabled={marketplaceSharing} onChange={(event) => setVisibility(event.target.value)}>
                          <option value='public'>{intl.formatMessage({ id: 'privacy.public.short', defaultMessage: 'Public' })}</option>
                          <option value='unlisted'>{intl.formatMessage({ id: 'privacy.unlisted.short', defaultMessage: 'Unlisted' })}</option>
                          <option value='private'>{intl.formatMessage({ id: 'native_composer.visibility.followers_only', defaultMessage: 'Followers only' })}</option>
                        </Select>
                      </FormGroup>

                      <FormActions>
                        {hasDraft && (
                          <Button type='button' theme='tertiary' onClick={clearDraft}>
                            <FormattedMessage id='native_federation.create.clear_draft' defaultMessage='Clear draft' />
                          </Button>
                        )}
                        <Button type='submit' theme='primary' disabled={!canSubmit}>
                          {isPending ? <FormattedMessage id='native_federation.create.creating' defaultMessage='Publishing...' /> : definition.submitLabel}
                        </Button>
                      </FormActions>
                    </>
                  )}
                </Form>
              )}
            </Stack>
          )}

          {created && (
            <div className='space-y-3 rounded-lg border border-solid border-primary-700 bg-primary-800/40 p-3'>
              <Text size='sm' weight='medium'><FormattedMessage id='native_federation.create.ready' defaultMessage='Published successfully. Its native actions are available on the item.' /></Text>
              <NativeWorkflowPath created={created} template={template} />
            </div>
          )}
        </Stack>
      </div>
    </section>
  );
};

interface IWorkflowInput {
  field: WorkflowField;
  onChange: (value: FieldValue) => void;
  value?: FieldValue;
}

const WorkflowInput: React.FC<IWorkflowInput> = ({ field, onChange, value }) => {
  if (field.input === 'checkbox') {
    return (
      <label className='flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-solid border-gray-200 black:border-gray-800 bg-white black:bg-black px-3 py-2 dark:border-gray-800 dark:bg-primary-900'>
        <Checkbox checked={value === true} onChange={() => onChange(value !== true)} />
        <span className='min-w-0'>
          <Text size='sm' weight='medium'>{field.label}</Text>
          {field.hint ? <Text size='xs' theme='muted'>{field.hint}</Text> : null}
        </span>
      </label>
    );
  }

  return (
    <FormGroup labelText={field.label} hintText={field.hint}>
      {field.input === 'select' ? (
        <Select aria-label={field.label} value={typeof value === 'string' ? value : ''} required={field.required} onChange={(event) => onChange(event.target.value)}>
          {(field.options || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      ) : (
        <Input
          aria-label={field.label}
          type={field.input || 'text'}
          value={typeof value === 'string' ? value : ''}
          min={field.min}
          max={field.max}
          step={field.step}
          maxLength={field.input === 'number' ? undefined : 240}
          placeholder={field.placeholder}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormGroup>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default NativeObjectComposer;

/* end of src/features/native-federation/native-object-composer.tsx */
