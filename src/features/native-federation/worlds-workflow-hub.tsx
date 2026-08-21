/*
 * Unfathomably Worlds workflow hub
 * --------------------------------
 *
 * File: worlds-workflow-hub.tsx
 *
 * Purpose:
 *   Present specialized federation as familiar user goals rather than server,
 *   provider, protocol, or instance administration.
 *
 * Responsibilities:
 *   - explain the local-first discover, connect, and participate workflow
 *   - route each supported family to a stable, focused page
 *   - identify compatible ecosystems without asking users to choose an instance
 *
 * This file intentionally does not fetch remote catalogs, resolve ActivityPub
 * objects, create native objects, or render a native timeline.
 */

import { useEffect, useRef } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { openModal } from '@/actions/modals.ts';
import { useNativeWorkflows, type NativeWorkflowFamily } from '@/api/hooks/discovery/useNativeWorkflows.ts';
import DismissibleIntroduction from '@/components/dismissible-introduction.tsx';
import { Column } from '@/components/ui/column.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import { PERMISSION_CREATE_GROUPS, hasPermission } from '@/utils/permissions.ts';

const messages = defineMessages({
  audioTitle: { id: 'worlds.workflow.audio.title', defaultMessage: 'Listen to audio' },
  audioDescription: { id: 'worlds.workflow.audio.description', defaultMessage: 'Find music, podcasts, artists, albums, and libraries. Play recordings here and follow the people who publish them.' },
  videoTitle: { id: 'worlds.workflow.video.title', defaultMessage: 'Watch video and live streams' },
  videoDescription: { id: 'worlds.workflow.video.description', defaultMessage: 'Find channels, videos, playlists, and live streams. Watch, follow, comment, and react without treating a whole server as one channel.' },
  longformTitle: { id: 'worlds.workflow.longform.title', defaultMessage: 'Read articles and blogs' },
  longformDescription: { id: 'worlds.workflow.longform.description', defaultMessage: 'Read long-form writing and feed entries, follow authors, reply to articles, or publish your own writing.' },
  photoTitle: { id: 'worlds.workflow.photo.title', defaultMessage: 'Explore photography' },
  photoDescription: { id: 'worlds.workflow.photo.description', defaultMessage: 'Browse photographs and albums with their descriptions, follow photographers, reply, favourite, and share your own images.' },
  booksTitle: { id: 'worlds.workflow.books.title', defaultMessage: 'Find books and share reading' },
  booksDescription: { id: 'worlds.workflow.books.description', defaultMessage: 'Look up books and editions, read reviews, follow readers, organize shelves, and share reviews or reading progress.' },
  bookmarksTitle: { id: 'worlds.workflow.bookmarks.title', defaultMessage: 'Discover useful links' },
  bookmarksDescription: { id: 'worlds.workflow.bookmarks.description', defaultMessage: 'Browse bookmarks with notes and tags, follow link curators, save useful pages, and publish annotated links.' },
  groupsTitle: { id: 'worlds.workflow.groups.title', defaultMessage: 'Join communities and forums' },
  groupsDescription: { id: 'worlds.workflow.groups.description', defaultMessage: 'Find a community by topic, follow or join it, read discussions, post, reply, and use local moderation controls where supported.' },
  eventsTitle: { id: 'worlds.workflow.events.title', defaultMessage: 'Find events and gatherings' },
  eventsDescription: { id: 'worlds.workflow.events.description', defaultMessage: 'Discover online or local events, inspect places and organizers, RSVP, discuss an event, or create one.' },
  developmentTitle: { id: 'worlds.workflow.development.title', defaultMessage: 'Follow software projects' },
  developmentDescription: { id: 'worlds.workflow.development.description', defaultMessage: 'Explore repositories, issues, merge requests, commits, and project activity. Follow work here, then use the source forge for authoritative changes.' },
  modelsTitle: { id: 'worlds.workflow.models.title', defaultMessage: 'Find 3D models' },
  modelsDescription: { id: 'worlds.workflow.models.description', defaultMessage: 'Browse models, previews, files, collections, licenses, and creators. Resolve a model here before downloading from its source.' },
  marketplaceTitle: { id: 'worlds.workflow.marketplace.title', defaultMessage: 'Browse classifieds' },
  marketplaceDescription: { id: 'worlds.workflow.marketplace.description', defaultMessage: 'Find offers and requests, inspect price and location details, contact the seller privately, or publish a listing.' },
  gamesTitle: { id: 'worlds.workflow.games.title', defaultMessage: 'Follow games and challenges' },
  gamesDescription: { id: 'worlds.workflow.games.description', defaultMessage: 'Find players and chess games, inspect positions and moves, follow play, and join challenges on the authoritative game service.' },
  routesTitle: { id: 'worlds.workflow.routes.title', defaultMessage: 'Explore routes and trails' },
  routesDescription: { id: 'worlds.workflow.routes.description', defaultMessage: 'Find routes by place or activity, inspect maps and GPX details, follow route authors, and share a trail or journey.' },
  cultureTitle: { id: 'worlds.workflow.culture.title', defaultMessage: 'Explore film, music, games, and culture' },
  cultureDescription: { id: 'worlds.workflow.culture.description', defaultMessage: 'Find cultural works and collections, read ratings and reviews, follow reviewers, and share your own rating or review.' },
  coordinationTitle: { id: 'worlds.workflow.coordination.title', defaultMessage: 'Offer help and coordinate needs' },
  coordinationDescription: { id: 'worlds.workflow.coordination.description', defaultMessage: 'Find offers, needs, resources, and proposals. Offer help, ask for help, or publish an intention without turning mutual aid into a generic post.' },
  publishingTitle: { id: 'worlds.workflow.publishing.title', defaultMessage: 'Read publications and knowledge' },
  publishingDescription: { id: 'worlds.workflow.publishing.description', defaultMessage: 'Browse publications, documents, chapters, and shared knowledge. Follow publishers, discuss resources, and publish structured documents.' },
  createCommunity: { id: 'worlds.workflow.groups.create', defaultMessage: 'Create community' },
  createEvent: { id: 'worlds.workflow.events.create', defaultMessage: 'Plan event' },
});

interface WorkflowCopy {
  title: typeof messages.audioTitle;
  description: typeof messages.audioDescription;
}

const workflowCopy: Record<NativeWorkflowFamily, WorkflowCopy> = {
  audio: { title: messages.audioTitle, description: messages.audioDescription },
  video: { title: messages.videoTitle, description: messages.videoDescription },
  longform: { title: messages.longformTitle, description: messages.longformDescription },
  photo: { title: messages.photoTitle, description: messages.photoDescription },
  books: { title: messages.booksTitle, description: messages.booksDescription },
  bookmarks: { title: messages.bookmarksTitle, description: messages.bookmarksDescription },
  groups: { title: messages.groupsTitle, description: messages.groupsDescription },
  events: { title: messages.eventsTitle, description: messages.eventsDescription },
  development: { title: messages.developmentTitle, description: messages.developmentDescription },
  models: { title: messages.modelsTitle, description: messages.modelsDescription },
  marketplace: { title: messages.marketplaceTitle, description: messages.marketplaceDescription },
  games: { title: messages.gamesTitle, description: messages.gamesDescription },
  routes: { title: messages.routesTitle, description: messages.routesDescription },
  culture: { title: messages.cultureTitle, description: messages.cultureDescription },
  coordination: { title: messages.coordinationTitle, description: messages.coordinationDescription },
  publishing: { title: messages.publishingTitle, description: messages.publishingDescription },
};

const workflowGroups: Array<{
  id: string;
  title: React.ReactNode;
  description: React.ReactNode;
  families: NativeWorkflowFamily[];
}> = [
  {
    id: 'read-watch-listen',
    title: <FormattedMessage id='worlds.group.media.title' defaultMessage='Read, watch, and listen' />,
    description: <FormattedMessage id='worlds.group.media.description' defaultMessage='Choose the kind of work you want, not a server to browse.' />,
    families: ['books', 'culture', 'audio', 'video', 'photo', 'longform', 'bookmarks', 'publishing'],
  },
  {
    id: 'meet-participate',
    title: <FormattedMessage id='worlds.group.participate.title' defaultMessage='Meet and participate' />,
    description: <FormattedMessage id='worlds.group.participate.description' defaultMessage='Join people around communities, events, games, and practical needs.' />,
    families: ['groups', 'events', 'games', 'coordination'],
  },
  {
    id: 'make-build-exchange',
    title: <FormattedMessage id='worlds.group.create.title' defaultMessage='Make, build, and exchange' />,
    description: <FormattedMessage id='worlds.group.create.description' defaultMessage='Find useful things and the people making, sharing, or offering them.' />,
    families: ['marketplace', 'routes', 'models', 'development'],
  },
];

interface WorldsWorkflowHeaderProps {
  family: NativeWorkflowFamily;
  launchCreate?: boolean;
}

const WorldsWorkflowHeader: React.FC<WorldsWorkflowHeaderProps> = ({ family, launchCreate = false }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { account } = useOwnAccount();
  const canCreateGroup = useAppSelector((state) => hasPermission(state, PERMISSION_CREATE_GROUPS));
  const manifest = useNativeWorkflows();
  const workflow = manifest.workflows.find(item => item.family === family);
  const copy = workflowCopy[family];
  const availableActions = workflow?.actions?.length ? workflow.actions : workflow?.participation || [];
  const creationSteps = workflow?.creation || [];
  const canCreateNative = Boolean(account) && (family === 'events' || (family === 'groups' && canCreateGroup));
  const createLaunched = useRef(false);

  const createNative = () => {
    if (family === 'events') {
      dispatch(openModal('COMPOSE_EVENT'));
    } else if (family === 'groups' && canCreateGroup) {
      dispatch(openModal('CREATE_GROUP'));
    }
  };

  useEffect(() => {
    if (!launchCreate || !canCreateNative || createLaunched.current) return;

    createLaunched.current = true;
    createNative();
  }, [canCreateGroup, canCreateNative, dispatch, family, launchCreate]);

  return (
    <section className='border-b border-gray-200 bg-white px-4 py-4 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'>
      <div className='flex min-w-0 items-center justify-between gap-4'>
        <h1 className='min-w-0 truncate text-xl font-black text-gray-950 black:text-white dark:text-white'>
          {intl.formatMessage(copy.title)}
        </h1>
        <div className='flex shrink-0 items-center gap-3'>
          {canCreateNative && (
            <button
              className='rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-white hover:bg-primary-500'
              type='button'
              onClick={createNative}
            >
              {intl.formatMessage(family === 'events' ? messages.createEvent : messages.createCommunity)}
            </button>
          )}
          <Link className='text-sm font-bold text-primary-700 hover:underline black:text-primary-300 dark:text-primary-300' to='/worlds'>
            <FormattedMessage id='worlds.workflow.back' defaultMessage='All worlds' />
          </Link>
        </div>
      </div>

      {workflow && (
        <details className='mt-2 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <summary className='cursor-pointer font-bold hover:text-primary-700 black:hover:text-primary-300 dark:hover:text-primary-300'>
            <FormattedMessage id='worlds.workflow.about' defaultMessage='About this world' />
          </summary>
          <div className='mt-2 max-w-3xl space-y-3 leading-6'>
            <p>{intl.formatMessage(copy.description)}</p>
            <div className='grid gap-3 sm:grid-cols-2'>
              <section>
                <h2 className='font-black text-gray-950 black:text-white dark:text-white'>
                  <FormattedMessage id='worlds.workflow.actions' defaultMessage='What you can do' />
                </h2>
                <ul className='mt-1 list-disc space-y-1 pl-5'>
                  {availableActions.map(action => <li key={action}>{action}</li>)}
                </ul>
              </section>
              {creationSteps.length > 0 && (
                <section>
                  <h2 className='font-black text-gray-950 black:text-white dark:text-white'>
                    <FormattedMessage id='worlds.workflow.creation' defaultMessage='To make one' />
                  </h2>
                  <ol className='mt-1 list-decimal space-y-1 pl-5'>
                    {creationSteps.map(step => <li key={step}>{step}</li>)}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </details>
      )}
    </section>
  );
};

interface WorldsWorkflowHubProps {
  embedded?: boolean;
}

const WorldsWorkflowHub: React.FC<WorldsWorkflowHubProps> = ({ embedded = false }) => {
  const intl = useIntl();
  const manifest = useNativeWorkflows();

  const content = (
    <>
      <DismissibleIntroduction
        storageKey='soapbox:introduction:worlds-workflows-v1'
        className='border-b border-gray-200 bg-white px-4 py-5 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:px-5'
      >
        <p className='text-xs font-bold uppercase tracking-[0.18em] text-primary-700 black:text-primary-300 dark:text-primary-300'>
          <FormattedMessage id='worlds.hub.eyebrow' defaultMessage='Worlds' />
        </p>
        <h1 className='mt-1 text-2xl font-black tracking-tight text-gray-950 black:text-white dark:text-white'>
          <FormattedMessage id='worlds.hub.title' defaultMessage='What do you want to do?' />
        </h1>
        <p className='mt-2 max-w-2xl text-sm leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'>
          <FormattedMessage id='worlds.hub.description' defaultMessage='Choose a familiar activity below. You do not need to know which software or server hosts it.' />
        </p>
      </DismissibleIntroduction>

      <div className='space-y-6 py-5'>
        {workflowGroups.map(group => (
          <section key={group.id} aria-labelledby={`worlds-${group.id}`}>
            <h2 id={`worlds-${group.id}`} className='px-4 text-base font-black text-gray-950 black:text-white dark:text-white sm:px-5'>{group.title}</h2>
            <div className='mt-2 grid border-y border-gray-200 black:border-gray-800 dark:border-gray-800 sm:grid-cols-2'>
              {group.families.map(family => {
                const copy = workflowCopy[family];
                const description = intl.formatMessage(copy.description);
                const workflow = manifest.workflows.find(item => item.family === family);
                const objectLabels = workflow?.objects.slice(0, 4) || [];
                const actionLabels = workflow?.participation.slice(0, 2) || [];

                return (
                  <Link
                    key={family}
                    to={`/worlds/${family}`}
                    title={description}
                    className='group border-b border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 black:border-gray-800 black:hover:bg-primary-900/40 dark:border-gray-800 dark:hover:bg-primary-800/40 sm:px-5'
                  >
                    <h3 className='font-bold text-gray-950 group-hover:text-primary-700 black:text-white black:group-hover:text-primary-300 dark:text-white dark:group-hover:text-primary-300'>
                      {intl.formatMessage(copy.title)}
                    </h3>
                    {objectLabels.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1.5' aria-label='World objects'>
                        {objectLabels.map(object => (
                          <span key={object} className='rounded-full border border-primary-200 px-2 py-0.5 text-xs font-bold text-primary-700 black:border-primary-800 black:text-primary-300 dark:border-primary-700 dark:text-primary-300'>
                            {object}
                          </span>
                        ))}
                      </div>
                    )}
                    {actionLabels.length > 0 && (
                      <p className='mt-2 text-xs font-bold text-gray-500 black:text-gray-400 dark:text-gray-400'>
                        {actionLabels.join(' / ')}
                      </p>
                    )}
                    <span className='sr-only'>{description}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <Column withHeader={false} label={intl.formatMessage({ id: 'column.native_federation', defaultMessage: 'Worlds' })} slim>
      {content}
    </Column>
  );
};

export { WorldsWorkflowHeader, WorldsWorkflowHub };

/* end of worlds-workflow-hub.tsx */
