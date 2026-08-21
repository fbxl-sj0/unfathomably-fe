/*
 * Project: Unfathomably FE
 *
 * File: native-federation/index.tsx
 *
 * Purpose:
 *   Provide a discoverable timeline for richer ActivityPub presentations
 *   received from software beyond conventional microblogging platforms.
 *
 * Responsibilities:
 *   - page through the public federated timeline without losing its cursor
 *   - render the native-family statuses selected by the backend
 *   - present those statuses through approachable discovery families
 *
 * This file intentionally does NOT contain:
 *   - platform-specific status rendering
 *   - ActivityPub normalization
 *   - federation transport logic
 */

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation } from 'react-router-dom';

import { expandNativeFederationTimeline } from '@/actions/timelines.ts';
import { useNativeObjectResolve } from '@/api/hooks/discovery/useNativeObjectResolve.ts';
import { useTargetSearch } from '@/api/hooks/index.ts';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import { Column } from '@/components/ui/column.tsx';
import Tabs from '@/components/ui/tabs.tsx';
import StatusContainer from '@/containers/status-container.tsx';
import TargetSearchResults from '@/features/groups/components/discover/search/results.tsx';
import { useNativeFederationStream } from '@/api/hooks/streaming/useNativeFederationStream.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import { PERMISSION_CREATE_GROUPS, hasPermission } from '@/utils/permissions.ts';

import Timeline from '../ui/components/timeline.tsx';

import type { Item } from '@/components/ui/tabs.tsx';
import type { Status } from '@/types/entities.ts';
import NativeDiscoveryAccessNotice from './native-discovery-access-notice.tsx';
import NativeDiscoveryLoading from './native-discovery-loading.tsx';
import NativeDiscoveryState from './native-discovery-state.tsx';
import type { PresentationFamily } from './presentation-family.ts';
import { WorldsWorkflowHeader, WorldsWorkflowHub } from './worlds-workflow-hub.tsx';
import { resolveWorldsRouteFamily } from './worlds-route.ts';

const AudioDiscoveryPanel = lazy(() => import('./audio-discovery-panel.tsx'));
const CatalogDiscoveryPanel = lazy(() => import('./catalog-discovery-panel.tsx'));
const ChessDiscoveryPanel = lazy(() => import('./chess-discovery-panel.tsx'));
const CoordinationDiscoveryPanel = lazy(() => import('./coordination-discovery-panel.tsx'));
const CuratedGroupManager = lazy(() => import('./curated-group-manager.tsx'));
const EventDiscoveryPanel = lazy(() => import('./event-discovery-panel.tsx'));
const ForgeDiscoveryPanel = lazy(() => import('./forge-discovery-panel.tsx'));
const ForgeFedDiscoveryPanel = lazy(() => import('./forgefed-discovery-panel.tsx'));
const MarketplaceDiscoveryPanel = lazy(() => import('./marketplace-discovery-panel.tsx'));
const MobilizonDiscoveryPanel = lazy(() => import('./mobilizon-discovery-panel.tsx'));
const ModelDiscoveryPanel = lazy(() => import('./model-discovery-panel.tsx'));
const MusicCatalogDiscoveryPanel = lazy(() => import('./music-catalog-discovery-panel.tsx'));
const NativeDiscoveryPanel = lazy(() => import('./native-discovery-panel.tsx'));
const NeoDBActivityDiscoveryPanel = lazy(() => import('./neodb-activity-discovery-panel.tsx'));
const OwncastDiscoveryPanel = lazy(() => import('./owncast-discovery-panel.tsx'));
const PeerTubeChannelDiscoveryPanel = lazy(() => import('./peertube-channel-discovery-panel.tsx'));
const PhotoDiscoveryPanel = lazy(() => import('./photo-discovery-panel.tsx'));
const PublishingDiscoveryPanel = lazy(() => import('./publishing-discovery-panel.tsx'));
const ReadingDiscoveryPanel = lazy(() => import('./reading-discovery-panel.tsx'));
const ReceivedAudioDiscoveryPanel = lazy(() => import('./received-audio-discovery-panel.tsx'));
const ReceivedModelDiscoveryPanel = lazy(() => import('./received-model-discovery-panel.tsx'));
const ReceivedVideoDiscoveryPanel = lazy(() => import('./received-video-discovery-panel.tsx'));
const RouteDiscoveryPanel = lazy(() => import('./route-discovery-panel.tsx'));
const VideoPlaylistDiscoveryPanel = lazy(() => import('./video-playlist-discovery-panel.tsx'));
const NativeObjectComposer = lazy(() => import('./native-object-composer.tsx'));
const WorldsSearchPanel = lazy(() => import('./worlds-search-panel.tsx'));
const NativeFamilyGuide = lazy(() => import('./native-family-guide.tsx'));
const NativeResolvedObjectCard = lazy(() => import('./native-resolved-object-card.tsx'));
const WorldObjectLibrary = lazy(() => import('./world-object-library.tsx'));
const BookLibrary = lazy(() => import('@/components/book-shelf-control.tsx').then(module => ({ default: module.BookLibrary })));

const TIMELINE_ID = 'native-federation';
type WorldView = 'feed' | 'browse' | 'search' | 'library' | 'create';

const cultureCategories = new Set(['film', 'series', 'album', 'podcast', 'performance', 'exhibition', 'game', 'other']);
const familyNamesForLibrary: Partial<Record<PresentationFamily, string>> = {
  audio: 'audio',
  video: 'videos',
  longform: 'reading',
  photo: 'photos',
  bookmarks: 'bookmarks',
  groups: 'communities',
  events: 'events',
  development: 'projects',
  models: 'models',
  marketplace: 'listings',
  games: 'games',
  routes: 'routes',
  culture: 'culture',
  coordination: 'coordination',
  publishing: 'publications',
};
const familiesWithSpecializedDiscovery = new Set<PresentationFamily>([
  'audio', 'books', 'coordination', 'culture', 'development', 'events', 'games',
  'longform', 'marketplace', 'models', 'photo', 'publishing', 'routes', 'video',
]);

const messages = defineMessages({
  title: { id: 'column.native_federation', defaultMessage: 'Worlds' },
  feedTab: { id: 'native_federation.tabs.feed', defaultMessage: 'Feed' },
  browseTab: { id: 'native_federation.tabs.browse', defaultMessage: 'Browse' },
  searchTab: { id: 'native_federation.tabs.search', defaultMessage: 'Search' },
  libraryTab: { id: 'native_federation.tabs.library', defaultMessage: 'My books' },
  createTab: { id: 'native_federation.tabs.create', defaultMessage: 'Create' },
  createGamesTab: { id: 'native_federation.tabs.create_games', defaultMessage: 'Find challenge' },
  createAudioTab: { id: 'native_federation.tabs.create_audio', defaultMessage: 'Share audio' },
  createVideoTab: { id: 'native_federation.tabs.create_video', defaultMessage: 'Share video' },
  createLongformTab: { id: 'native_federation.tabs.create_longform', defaultMessage: 'Write' },
  createPhotoTab: { id: 'native_federation.tabs.create_photo', defaultMessage: 'Share photo' },
  createBooksTab: { id: 'native_federation.tabs.create_books', defaultMessage: 'Book activity' },
  createBookmarksTab: { id: 'native_federation.tabs.create_bookmarks', defaultMessage: 'Save link' },
  createGroupsTab: { id: 'native_federation.tabs.create_groups', defaultMessage: 'Create group' },
  createEventsTab: { id: 'native_federation.tabs.create_events', defaultMessage: 'Plan event' },
  createDevelopmentTab: { id: 'native_federation.tabs.create_development', defaultMessage: 'Project work' },
  createModelsTab: { id: 'native_federation.tabs.create_models', defaultMessage: 'Share model' },
  createMarketplaceTab: { id: 'native_federation.tabs.create_marketplace', defaultMessage: 'List item' },
  createRoutesTab: { id: 'native_federation.tabs.create_routes', defaultMessage: 'Share route' },
  createCultureTab: { id: 'native_federation.tabs.create_culture', defaultMessage: 'Write review' },
  createCoordinationTab: { id: 'native_federation.tabs.create_coordination', defaultMessage: 'Offer / ask' },
  createPublishingTab: { id: 'native_federation.tabs.create_publishing', defaultMessage: 'Publish' },
  emptyBrowseAction: { id: 'native_federation.empty.browse', defaultMessage: 'Browse worlds' },
  emptySearchAction: { id: 'native_federation.empty.search', defaultMessage: 'Find something' },
  emptyCreateAction: { id: 'native_federation.empty.create', defaultMessage: 'Create something' },
  all: { id: 'native_federation.family.all', defaultMessage: 'All' },
  audio: { id: 'native_federation.family.audio', defaultMessage: 'Audio' },
  video: { id: 'native_federation.family.video', defaultMessage: 'Video' },
  longform: { id: 'native_federation.family.longform', defaultMessage: 'Articles' },
  photo: { id: 'native_federation.family.photo', defaultMessage: 'Photos' },
  books: { id: 'native_federation.family.books', defaultMessage: 'Books' },
  bookmarks: { id: 'native_federation.family.bookmarks', defaultMessage: 'Bookmarks' },
  groups: { id: 'native_federation.family.groups', defaultMessage: 'Communities' },
  events: { id: 'native_federation.family.events', defaultMessage: 'Events' },
  development: { id: 'native_federation.family.development', defaultMessage: 'Software' },
  models: { id: 'native_federation.family.models', defaultMessage: '3D models' },
  marketplace: { id: 'native_federation.family.marketplace', defaultMessage: 'Markets' },
  games: { id: 'native_federation.family.games', defaultMessage: 'Games' },
  routes: { id: 'native_federation.family.routes', defaultMessage: 'Routes' },
  culture: { id: 'native_federation.family.culture', defaultMessage: 'Culture' },
  coordination: { id: 'native_federation.family.coordination', defaultMessage: 'Coordination' },
  publishing: { id: 'native_federation.family.publishing', defaultMessage: 'Publishing' },
  targetPlaceholder: { id: 'native_federation.connect.placeholder', defaultMessage: '@name@example.org or a profile, community, feed, or item link' },
});

const presentationFamilies: Array<{
  id: PresentationFamily;
  message: typeof messages.all;
}> = [
  { id: 'all', message: messages.all },
  { id: 'audio', message: messages.audio },
  { id: 'video', message: messages.video },
  { id: 'longform', message: messages.longform },
  { id: 'photo', message: messages.photo },
  { id: 'books', message: messages.books },
  { id: 'bookmarks', message: messages.bookmarks },
  { id: 'groups', message: messages.groups },
  { id: 'events', message: messages.events },
  { id: 'development', message: messages.development },
  { id: 'models', message: messages.models },
  { id: 'marketplace', message: messages.marketplace },
  { id: 'games', message: messages.games },
  { id: 'routes', message: messages.routes },
  { id: 'culture', message: messages.culture },
  { id: 'coordination', message: messages.coordination },
  { id: 'publishing', message: messages.publishing },
];

const composerTemplateByFamily: Partial<Record<PresentationFamily, string>> = {
  audio: 'audio',
  books: 'books',
  bookmarks: 'bookmarks',
  coordination: 'coordination',
  culture: 'culture',
  development: 'software',
  longform: 'longform',
  marketplace: 'markets',
  models: 'models',
  photo: 'photo',
  publishing: 'publishing',
  routes: 'routes',
  video: 'video',
};

const createTabMessageByFamily: Partial<Record<PresentationFamily, typeof messages.createTab>> = {
  games: messages.createGamesTab,
  audio: messages.createAudioTab,
  video: messages.createVideoTab,
  longform: messages.createLongformTab,
  photo: messages.createPhotoTab,
  books: messages.createBooksTab,
  bookmarks: messages.createBookmarksTab,
  groups: messages.createGroupsTab,
  events: messages.createEventsTab,
  development: messages.createDevelopmentTab,
  models: messages.createModelsTab,
  marketplace: messages.createMarketplaceTab,
  routes: messages.createRoutesTab,
  culture: messages.createCultureTab,
  coordination: messages.createCoordinationTab,
  publishing: messages.createPublishingTab,
};

interface ISpecializedDiscoveryPanels {
  enabled: boolean;
  family: PresentationFamily;
}

interface INativeFederationTimeline {
  params?: {
    family?: string;
  };
}

const SpecializedDiscoveryPanels: React.FC<ISpecializedDiscoveryPanels> = ({ enabled, family }) => (
  <Suspense fallback={<NativeDiscoveryLoading />}>
    {family === 'books' && (
      <>
        <CatalogDiscoveryPanel enabled={enabled} family={family} />
        <ReadingDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'culture' && (
      <>
        <CatalogDiscoveryPanel enabled={enabled} family={family} />
        <NeoDBActivityDiscoveryPanel enabled={enabled} family={family} />
        <ReadingDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'audio' && (
      <>
        <MusicCatalogDiscoveryPanel enabled={enabled} family={family} />
        <ReceivedAudioDiscoveryPanel enabled={enabled} family={family} />
        <AudioDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'events' && (
      <>
        <EventDiscoveryPanel enabled={enabled} family={family} />
        <MobilizonDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'development' && (
      <>
        <ForgeDiscoveryPanel enabled={enabled} family={family} />
        <ForgeFedDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'models' && (
      <>
        <ModelDiscoveryPanel enabled={enabled} family={family} />
        <ReceivedModelDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'video' && (
      <>
        <ReceivedVideoDiscoveryPanel enabled={enabled} family={family} />
        <VideoPlaylistDiscoveryPanel enabled={enabled} family={family} />
        <OwncastDiscoveryPanel enabled={enabled} family={family} />
        <PeerTubeChannelDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}

    {family === 'photo' && <PhotoDiscoveryPanel enabled={enabled} family={family} />}
    {family === 'marketplace' && <MarketplaceDiscoveryPanel enabled={enabled} family={family} />}
    {family === 'routes' && <RouteDiscoveryPanel enabled={enabled} family={family} />}
    {family === 'coordination' && <CoordinationDiscoveryPanel enabled={enabled} family={family} />}
    {family === 'games' && (
      <>
        <CatalogDiscoveryPanel enabled={enabled} family={family} />
        <ChessDiscoveryPanel enabled={enabled} family={family} />
      </>
    )}
    {(family === 'publishing' || family === 'longform') && (
      <PublishingDiscoveryPanel enabled={enabled} family={family} />
    )}

    <NativeDiscoveryPanel enabled={enabled} family={family} />
  </Suspense>
);

const NativeFederationTimeline: React.FC<INativeFederationTimeline> = ({ params }) => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const routeFamily = resolveWorldsRouteFamily(params?.family, location.pathname);
  const { account } = useOwnAccount();
  const features = useFeatures();
  const canCreateGroup = useAppSelector((state) => hasPermission(state, PERMISSION_CREATE_GROUPS));
  const searchParams = new URLSearchParams(location.search);
  const selectedFamily = (routeFamily || searchParams.get('family') || 'all') as PresentationFamily;
  const family = presentationFamilies.some(item => item.id === selectedFamily) ? selectedFamily : 'all';
  const createRequested = searchParams.get('create') === '1';
  const onlyMine = searchParams.get('mine') === '1';
  const initialReferenceUrl = searchParams.get('reference') || undefined;
  const initialTitle = (searchParams.get('title') || '').trim().slice(0, 200) || undefined;
  const requestedCategory = (searchParams.get('category') || '').trim();
  const initialCategory = family === 'culture' && cultureCategories.has(requestedCategory)
    ? requestedCategory
    : undefined;
  const delegatedTemplate = family === 'events'
    ? 'events'
    : family === 'groups' && canCreateGroup
      ? 'groups'
      : undefined;
  const createTemplate = composerTemplateByFamily[family] || delegatedTemplate;
  const hasCreateView = Boolean(account) && (Boolean(createTemplate) || family === 'games');
  const requestedTemplate = searchParams.get('template') || createTemplate;
  const initialResolveQuery = (searchParams.get('resolve') || '').trim().slice(0, 2048);
  const nativeQuery = (searchParams.get('q') || '').trim().slice(0, 200);
  const requestedView = searchParams.get('view');
  let activeView: WorldView;

  if (family === 'all') {
    activeView = requestedView === 'browse' ? 'browse' : 'feed';
  } else if (requestedView === 'feed' || requestedView === 'search' || (requestedView === 'library' && Boolean(account)) || (requestedView === 'create' && hasCreateView)) {
    activeView = requestedView;
  } else if ((createRequested || initialReferenceUrl) && hasCreateView) {
    activeView = 'create';
  } else if (initialResolveQuery || nativeQuery) {
    activeView = 'search';
  } else {
    activeView = 'feed';
  }
  const familyTimelineId = family === 'all' ? TIMELINE_ID : `${TIMELINE_ID}:${family}`;
  const timelineId = nativeQuery ? `${familyTimelineId}:search:${encodeURIComponent(nativeQuery.toLowerCase())}` : familyTimelineId;
  const canLoadFeed = Boolean(account) || features.anonymousPublicTimeline;
  useNativeFederationStream(timelineId, family, activeView === 'feed' && !nativeQuery && canLoadFeed);
  const [targetQuery, setTargetQuery] = useState(initialResolveQuery);
  const [submittedTargetQuery, setSubmittedTargetQuery] = useState(initialResolveQuery);
  const [browsingKnownTargets, setBrowsingKnownTargets] = useState(false);
  const [specializedDiscoveryOpen, setSpecializedDiscoveryOpen] = useState(false);
  const targetSearchResult = useTargetSearch(account ? submittedTargetQuery : '', {
    nativeBrowse: Boolean(account) && browsingKnownTargets,
    nativeFamily: family,
    nativeMode: Boolean(account),
  });
  const nativeObjectResolveResult = useNativeObjectResolve(
    account ? submittedTargetQuery : '',
    Boolean(account),
  );
  const hasResolvedItem = Boolean(nativeObjectResolveResult.statusId || nativeObjectResolveResult.resource);
  const objectResolutionSettled = !nativeObjectResolveResult.isResolvable || nativeObjectResolveResult.isFetched;
  const resolverIsFetching = targetSearchResult.isFetching || nativeObjectResolveResult.isFetching;
  const resolverHasError = targetSearchResult.isError
    && (!nativeObjectResolveResult.isResolvable || nativeObjectResolveResult.isError);
  const pushSearchParams = useCallback((params: URLSearchParams) => {
    const search = params.toString();

    history.push({
      pathname: location.pathname,
      search: search ? `?${search}` : '',
    });
  }, [history, location.pathname]);

  const switchView = useCallback((view: WorldView) => {
    const params = new URLSearchParams(location.search);

    params.set('view', view);
    params.delete('create');
    params.delete('title');
    params.delete('category');

    if (view === 'feed' || view === 'browse') {
      params.delete('q');
      params.delete('resolve');
      params.delete('reference');
      params.delete('template');
    } else if (view === 'search') {
      params.delete('reference');
      params.delete('template');
    } else {
      params.delete('q');
      params.delete('resolve');
      params.delete('reference');
      params.delete('template');
    }

    pushSearchParams(params);
  }, [location.search, pushSearchParams]);
  const createTabItems: Item[] = hasCreateView
    ? [{
      text: intl.formatMessage(createTabMessageByFamily[family] || messages.createTab),
      action: () => switchView('create'),
      name: 'create',
    }]
    : [];
  const libraryTabItems: Item[] = family !== 'all' && account
    ? [{
      text: family === 'books' ? intl.formatMessage(messages.libraryTab) : `My ${familyNamesForLibrary[family] || 'items'}`,
      action: () => switchView('library'),
      name: 'library',
    }]
    : [];
  const tabItems: Item[] = family === 'all'
    ? [
      {
        text: intl.formatMessage(messages.feedTab),
        action: () => switchView('feed'),
        name: 'feed',
      },
      {
        text: intl.formatMessage(messages.browseTab),
        action: () => switchView('browse'),
        name: 'browse',
      },
    ]
    : [
      {
        text: intl.formatMessage(messages.feedTab),
        action: () => switchView('feed'),
        name: 'feed',
      },
      ...libraryTabItems,
      {
        text: intl.formatMessage(messages.searchTab),
        action: () => switchView('search'),
        name: 'search',
      },
      ...createTabItems,
    ];

  const statusFilter = useCallback(
    (status: Status) => !onlyMine || status.account.id === account?.id,
    [account?.id, onlyMine],
  );

  const handleLoadMore = (maxId: string) => {
    dispatch(expandNativeFederationTimeline({ maxId, family, query: nativeQuery, timelineId }));
  };

  const handleRefresh = () => dispatch(expandNativeFederationTimeline({ family, query: nativeQuery, timelineId }));

  const submitTargetSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = targetQuery.trim().slice(0, 2048);
    if (query) {
      setBrowsingKnownTargets(false);
      setSubmittedTargetQuery(query);
    }
  };

  const browseKnownTargets = () => {
    setTargetQuery('');
    setSubmittedTargetQuery('');
    setBrowsingKnownTargets(currentlyBrowsing => !currentlyBrowsing);
  };

  useEffect(() => {
    setTargetQuery(initialResolveQuery);
    setSubmittedTargetQuery(initialResolveQuery);
    setBrowsingKnownTargets(false);
    setSpecializedDiscoveryOpen(false);
  }, [family, initialResolveQuery]);

  useEffect(() => {
    if (initialResolveQuery) {
      document.getElementById('native-federation-target-search')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [initialResolveQuery]);

  useEffect(() => {
    if (activeView !== 'feed' || !canLoadFeed) return;

    dispatch(expandNativeFederationTimeline({ family, query: nativeQuery, timelineId }));
  }, [activeView, canLoadFeed, family, nativeQuery]);

  return (
    <Column withHeader={family === 'all'} label={intl.formatMessage(messages.title)} slim>
      {family !== 'all' && <WorldsWorkflowHeader family={family} launchCreate={createRequested} />}
      <div className='sticky top-11 z-40 bg-white black:bg-black dark:bg-primary-900 lg:top-0'>
        <Tabs items={tabItems} activeItem={activeView} />
      </div>

      {activeView === 'browse' && <WorldsWorkflowHub embedded />}

      {activeView === 'library' && family === 'books' && (
        <Suspense fallback={<NativeDiscoveryLoading />}>
          <BookLibrary />
        </Suspense>
      )}

      {activeView === 'feed' && !canLoadFeed && (
        <NativeDiscoveryState
          action={(
            <Link className='inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-black text-white hover:bg-primary-500' to='/login'>
              <FormattedMessage id='native_federation.feed.sign_in' defaultMessage='Sign in' />
            </Link>
          )}
        >
          <FormattedMessage id='native_federation.feed.authentication_required' defaultMessage='Sign in to view this server&apos;s Worlds feed.' />
        </NativeDiscoveryState>
      )}

      {activeView === 'feed' && canLoadFeed && (
        <PullToRefresh onRefresh={handleRefresh}>
          <Timeline
            scrollKey={timelineId}
            timelineId={timelineId}
            statusFilter={statusFilter}
            onLoadMore={handleLoadMore}
            emptyMessage={(
              <div className='flex flex-col items-center gap-3'>
                {onlyMine ? (
                  <FormattedMessage
                    id='native_federation.empty_mine'
                    defaultMessage='You have not shared anything in this world yet.'
                  />
                ) : (
                  <FormattedMessage
                    id='native_federation.empty'
                    defaultMessage='Nothing from this world has reached your server yet.'
                  />
                )}

                <div className='flex flex-wrap justify-center gap-2'>
                  <button
                    type='button'
                    className='rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-500'
                    onClick={() => switchView(family === 'all' ? 'browse' : 'search')}
                  >
                    {intl.formatMessage(family === 'all' ? messages.emptyBrowseAction : messages.emptySearchAction)}
                  </button>
                  {family !== 'all' && hasCreateView && (
                    <button
                      type='button'
                      className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-900 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-white black:hover:text-primary-300 dark:border-gray-700 dark:text-white dark:hover:text-primary-300'
                      onClick={() => switchView('create')}
                    >
                      {intl.formatMessage(messages.emptyCreateAction)}
                    </button>
                  )}
                </div>
              </div>
            )}
          />
        </PullToRefresh>
      )}

      {activeView === 'library' && family !== 'books' && account && (
        <Suspense fallback={<NativeDiscoveryLoading />}>
          <WorldObjectLibrary family={family} />
        </Suspense>
      )}

      {activeView === 'search' && (
        <>
          <Suspense fallback={<NativeDiscoveryLoading />}>
            <WorldsSearchPanel enabled={Boolean(account)} family={family} initialQuery={nativeQuery} />
          </Suspense>

          {family === 'groups' && account?.admin && (
            <Suspense fallback={<NativeDiscoveryLoading />}>
              <CuratedGroupManager />
            </Suspense>
          )}

          {familiesWithSpecializedDiscovery.has(family) && (
            <details
              className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'
              onToggle={event => setSpecializedDiscoveryOpen(event.currentTarget.open)}
            >
              <summary className='cursor-pointer px-4 py-4 text-sm font-black text-gray-950 hover:text-primary-600 black:text-white black:hover:text-primary-300 dark:text-white dark:hover:text-primary-300 sm:px-5'>
                <FormattedMessage id='native_federation.find_more' defaultMessage='More ways to find things' />
              </summary>
              {specializedDiscoveryOpen && (
                <div className='border-t border-gray-200 black:border-gray-800 dark:border-gray-800'>
                  <Suspense fallback={<NativeDiscoveryLoading />}>
                    <SpecializedDiscoveryPanels enabled={Boolean(account)} family={family} />
                  </Suspense>
                </div>
              )}
            </details>
          )}

          <NativeDiscoveryAccessNotice family={family} signedIn={Boolean(account)} />

          <Suspense fallback={<NativeDiscoveryLoading />}>
            <NativeFamilyGuide family={family} />
          </Suspense>

          <details
            id='worlds-connect'
            className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'
            open={Boolean(initialResolveQuery)}
          >
            <summary className='cursor-pointer px-4 py-4 text-sm font-black text-gray-900 hover:text-primary-700 black:text-white black:hover:text-primary-300 dark:text-white dark:hover:text-primary-300 sm:px-5'>
              <FormattedMessage id='native_federation.connect.heading' defaultMessage='Open a shared link or handle' />
            </summary>
            <div className='border-t border-gray-200 p-4 black:border-gray-800 dark:border-gray-800 sm:p-5'>
              <p className='max-w-2xl text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
                <FormattedMessage
                  id='native_federation.connect.description'
                  defaultMessage='Paste an exact public link or account handle. You choose whether to follow anything it finds.'
                />
              </p>

              {account ? (
                <>
                  <form className='mt-4 flex flex-col gap-2 sm:flex-row' onSubmit={submitTargetSearch}>
                    <label className='sr-only' htmlFor='native-federation-target-search'>
                      <FormattedMessage id='native_federation.connect.label' defaultMessage='Name, handle, or link' />
                    </label>
                    <input
                      id='native-federation-target-search'
                      type='search'
                      maxLength={2048}
                      className='min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-950 outline-none ring-primary-500 placeholder:text-gray-500 focus:ring-2 black:border-gray-700 black:bg-black black:text-white black:placeholder:text-gray-400 dark:border-gray-700 dark:bg-primary-800 dark:text-white'
                      value={targetQuery}
                      placeholder={intl.formatMessage(messages.targetPlaceholder)}
                      onChange={(event) => setTargetQuery(event.target.value)}
                    />
                    <button
                      type='submit'
                      className='rounded-lg bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50'
                      disabled={!targetQuery.trim() || resolverIsFetching}
                    >
                      <FormattedMessage id='native_federation.connect.search' defaultMessage='Open' />
                    </button>

                    <button
                      type='button'
                      className='rounded-lg border border-gray-300 px-5 py-2.5 font-bold text-gray-900 hover:border-primary-500 hover:text-primary-700 black:border-gray-700 black:text-white black:hover:text-primary-300 dark:border-gray-700 dark:text-white dark:hover:text-primary-300'
                      onClick={browseKnownTargets}
                    >
                      {browsingKnownTargets ? <FormattedMessage id='native_federation.connect.hide_known' defaultMessage='Hide suggestions' /> : <FormattedMessage id='native_federation.connect.browse_known' defaultMessage='Browse suggestions' />}
                    </button>
                  </form>

                  {(targetSearchResult.isLoading || nativeObjectResolveResult.isFetching) && (
                    <div className='mt-4 overflow-hidden'>
                      <NativeDiscoveryLoading />
                    </div>
                  )}

                  {targetSearchResult.isError && browsingKnownTargets && (
                    <NativeDiscoveryState className='mt-4' tone='danger'>
                      <FormattedMessage id='native_federation.connect.browse_error' defaultMessage='Known worlds could not be loaded right now.' />
                    </NativeDiscoveryState>
                  )}

                  {resolverHasError && !browsingKnownTargets && (
                    <NativeDiscoveryState className='mt-4' tone='danger'>
                      <FormattedMessage id='native_federation.connect.error' defaultMessage='That link or handle could not be opened.' />
                    </NativeDiscoveryState>
                  )}

                  {(submittedTargetQuery || browsingKnownTargets) && targetSearchResult.isFetched && objectResolutionSettled && !resolverHasError && !resolverIsFetching && targetSearchResult.targets.length === 0 && !hasResolvedItem && (
                    <NativeDiscoveryState className='mt-4'>
                      {browsingKnownTargets ? (
                        <FormattedMessage id='native_federation.connect.no_known_results' defaultMessage='No known sources in this world yet.' />
                      ) : (
                        <FormattedMessage id='native_federation.connect.no_results' defaultMessage='No matching link or account was found.' />
                      )}
                    </NativeDiscoveryState>
                  )}

                  {hasResolvedItem && (
                    <div className='mt-6 border-t border-gray-200 black:border-gray-800 pt-5 dark:border-gray-800'>
                      <h3 className='mb-4 text-sm font-black uppercase tracking-wide text-gray-950 black:text-white dark:text-white'>
                        <FormattedMessage id='native_federation.connect.resolved_item' defaultMessage='Found item' />
                      </h3>
                      {nativeObjectResolveResult.statusId && <StatusContainer id={nativeObjectResolveResult.statusId} />}
                      {nativeObjectResolveResult.resource && (
                        <Suspense fallback={<NativeDiscoveryLoading />}>
                          <NativeResolvedObjectCard resource={nativeObjectResolveResult.resource} />
                        </Suspense>
                      )}
                    </div>
                  )}

                  {targetSearchResult.targets.length > 0 && (
                    <div className='mt-6 border-t border-gray-200 black:border-gray-800 pt-5 dark:border-gray-800'>
                      {browsingKnownTargets && (
                        <p className='mb-4 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
                          <FormattedMessage id='native_federation.connect.known_hint' defaultMessage='These are people, groups, and sources this server already knows about. Nothing is followed until you choose it.' />
                        </p>
                      )}
                      <TargetSearchResults targetSearchResult={targetSearchResult} showNativeFamilies />
                    </div>
                  )}
                </>
              ) : (
                <Link className='mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-3 font-black text-white hover:bg-primary-500' to='/login'>
                  <FormattedMessage id='native_federation.connect.sign_in' defaultMessage='Sign in to connect' />
                </Link>
              )}

              <div className='mt-6 flex flex-wrap gap-3 border-t border-gray-200 black:border-gray-800 pt-5 text-sm font-bold dark:border-gray-800'>
                <Link className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to='/groups/discover'>
                  <FormattedMessage id='native_federation.connect.browse_groups' defaultMessage='Browse known groups' />
                </Link>
                <Link className='text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300' to='/feeds/my'>
                  <FormattedMessage id='native_federation.connect.manage_sources' defaultMessage='Manage feeds and sources' />
                </Link>
              </div>
            </div>
          </details>
        </>
      )}

      {activeView === 'create' && (
        <div id='worlds-create' className='px-4 py-4 sm:px-5 sm:py-5'>
          <Suspense fallback={<NativeDiscoveryLoading />}>
            {family === 'games' ? (
              <ChessDiscoveryPanel enabled={Boolean(account)} family={family} />
            ) : (
              <NativeObjectComposer
                family={family}
                initialCategory={initialCategory}
                initialReferenceUrl={initialReferenceUrl}
                initialTitle={initialTitle}
                initiallyExpanded
                preferredTemplate={requestedTemplate}
              />
            )}
          </Suspense>
        </div>
      )}
    </Column>
  );
};

export default NativeFederationTimeline;

/* end of native-federation/index.tsx */
