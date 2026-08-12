/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-workflow-path.tsx

  Purpose:

    Show the concrete creation and participation path for a Worlds object.

  Responsibilities:

    * provide direct post-publication routes to the object and its World
    * provide project-to-issue continuity for local software projects

  This file intentionally does NOT contain:

    * form state or validation
    * tutorial copy already expressed by the form
    * inferred remote capabilities
    * ActivityPub object construction
*/

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

interface CreatedObject {
  id: string;
  url: string;
}

interface NativeWorkflowPathProps {
  created?: CreatedObject;
  template: string;
}

interface WorkflowPath {
  family: string;
  item: string;
  world: string;
}

const workflowPaths: Record<string, WorkflowPath> = {
  audio: { family: 'audio', item: 'recording', world: 'audio' },
  video: { family: 'video', item: 'video', world: 'video' },
  longform: { family: 'longform', item: 'article', world: 'articles' },
  photo: { family: 'photo', item: 'photograph', world: 'photography' },
  books: { family: 'books', item: 'reading activity', world: 'books' },
  bookmarks: { family: 'bookmarks', item: 'saved link', world: 'bookmarks' },
  groups: { family: 'groups', item: 'community', world: 'communities' },
  events: { family: 'events', item: 'event', world: 'events' },
  software_project: { family: 'development', item: 'project', world: 'software projects' },
  software: { family: 'development', item: 'issue', world: 'software projects' },
  models: { family: 'models', item: '3D model', world: '3D models' },
  markets: { family: 'marketplace', item: 'listing', world: 'classifieds' },
  games: { family: 'games', item: 'game', world: 'games' },
  routes: { family: 'routes', item: 'route', world: 'routes' },
  culture: { family: 'culture', item: 'rating or review', world: 'culture' },
  coordination: { family: 'coordination', item: 'offer or request', world: 'coordination' },
  publishing: { family: 'publishing', item: 'publication', world: 'publications' },
};

const fallbackPath: WorkflowPath = { family: 'longform', item: 'post', world: 'articles' };

const NativeWorkflowPath: React.FC<NativeWorkflowPathProps> = ({ created, template }) => {
  const path = workflowPaths[template] || fallbackPath;
  const worldUrl = `/worlds/${path.family}?view=feed`;
  const issueUrl = template === 'software_project' && created
    ? `/worlds/development?view=create&template=software&reference=${encodeURIComponent(created.url)}#worlds-create`
    : null;

  if (!created) return null;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Link
        className='inline-flex rounded-md bg-primary-600 px-3 py-2 text-sm font-bold text-white hover:bg-primary-500'
        to={`/notice/${created.id}`}
      >
        <FormattedMessage id='native_workflow.created.view_item' defaultMessage='View {item}' values={{ item: path.item }} />
      </Link>
      {issueUrl ? (
        <Link
          className='inline-flex rounded-md border border-primary-500 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-950/10 black:text-primary-300 dark:text-primary-300'
          to={issueUrl}
        >
          <FormattedMessage
            id='native_workflow.created.file_first_issue'
            defaultMessage='File its first issue'
          />
        </Link>
      ) : null}
      <Link
        className='inline-flex rounded-md border border-primary-500 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-950/10 black:text-primary-300 dark:text-primary-300'
        to={worldUrl}
      >
        <FormattedMessage id='native_workflow.created.back_to_world' defaultMessage='Back to {world}' values={{ world: path.world }} />
      </Link>
    </div>
  );
};

export default NativeWorkflowPath;

/* end of src/features/native-federation/native-workflow-path.tsx */
