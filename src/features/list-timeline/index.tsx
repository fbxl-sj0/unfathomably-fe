import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { fetchList } from '@/actions/lists.ts';
import { openModal } from '@/actions/modals.ts';
import { expandListTimeline } from '@/actions/timelines.ts';
import { useListStream } from '@/api/hooks/index.ts';
import MissingIndicator from '@/components/missing-indicator.tsx';
import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

import Timeline from '../ui/components/timeline.tsx';

interface IListTimeline {
  params: {
    id?: string;
  };
}

const ListTimeline: React.FC<IListTimeline> = ({ params }) => {
  const dispatch = useAppDispatch();
  const { id } = params;
  const timelineId = id ? `list:${id}` : null;

  const list = useAppSelector((state) => id ? state.lists.get(id) : undefined);
  const next = useAppSelector(state => timelineId ? state.timelines.get(timelineId)?.next : null);

  useListStream(id);

  useEffect(() => {
    if (!id) return;

    dispatch(fetchList(id));
    dispatch(expandListTimeline(id));
  }, [id]);

  const handleLoadMore = (maxId: string) => {
    if (!id) return;

    dispatch(expandListTimeline(id, { url: next, maxId }));
  };

  const handleEditClick = () => {
    if (!id) return;

    dispatch(openModal('LIST_EDITOR', { listId: id }));
  };

  const listEmoji = list ? list.getIn(['pleroma', 'emoji']) : null;
  const title = list ? [listEmoji, list.title].filter(Boolean).join(' ') : id;

  if (!id || typeof list === 'undefined') {
    return (
      <Column>
        <div>
          <Spinner />
        </div>
      </Column>
    );
  } else if (list === false) {
    return (
      <MissingIndicator />
    );
  }

  const emptyMessage = (
    <div>
      <FormattedMessage id='empty_column.list' defaultMessage='There is nothing in this list yet. Add people you follow, and their posts will appear here.' />
      <br /><br />
      <Button onClick={handleEditClick}><FormattedMessage id='list.click_to_add' defaultMessage='Manage members' /></Button>
    </div>
  );

  return (
    <Column
      label={title}
      action={<Button onClick={handleEditClick}><FormattedMessage id='list.manage_members' defaultMessage='Manage members' /></Button>}
    >
      <Timeline
        className='black:p-4 black:sm:p-5'
        scrollKey='list_timeline'
        timelineId={`list:${id}`}
        onLoadMore={handleLoadMore}
        emptyMessage={emptyMessage}
      />
    </Column>
  );
};

export default ListTimeline;
