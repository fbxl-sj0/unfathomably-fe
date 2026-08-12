import { debounce } from 'es-toolkit';
import { OrderedSet as ImmutableOrderedSet } from 'immutable';
import { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { expandStatusQuotes, fetchStatusQuotes } from '@/actions/status-quotes.ts';
import MissingIndicator from '@/components/missing-indicator.tsx';
import StatusList from '@/components/status-list.tsx';
import { Column } from '@/components/ui/column.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useIsMobile } from '@/hooks/useIsMobile.ts';

const messages = defineMessages({
  heading: { id: 'column.quotes', defaultMessage: 'Post quotes' },
});

const handleLoadMore = debounce((statusId: string, dispatch: React.Dispatch<any>) =>
  dispatch(expandStatusQuotes(statusId)), 300, { edges: ['leading'] });

interface IQuotes {
  params: {
    statusId?: string;
  };
}

const Quotes: React.FC<IQuotes> = ({ params }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { statusId } = params;
  const isMobile = useIsMobile();
  const listKey = statusId ? `quotes:${statusId}` : 'quotes:';

  const statusIds = useAppSelector((state) => state.status_lists.getIn([listKey, 'items'], ImmutableOrderedSet<string>()));
  const isLoading = useAppSelector((state) => state.status_lists.getIn([listKey, 'isLoading'], true));
  const hasMore = useAppSelector((state) => !!state.status_lists.getIn([listKey, 'next']));

  useEffect(() => {
    if (statusId) dispatch(fetchStatusQuotes(statusId));
  }, [dispatch, statusId]);

  const handleRefresh = async() => {
    if (statusId) await dispatch(fetchStatusQuotes(statusId));
  };

  const emptyMessage = <FormattedMessage id='empty_column.quotes' defaultMessage='This post has not been quoted yet.' />;

  if (!statusId) return <MissingIndicator />;

  return (
    <Column label={intl.formatMessage(messages.heading)} transparent={!isMobile}>
      <StatusList
        className='black:p-4 black:sm:p-5'
        statusIds={statusIds as ImmutableOrderedSet<string>}
        scrollKey={listKey}
        hasMore={hasMore}
        isLoading={typeof isLoading === 'boolean' ? isLoading : true}
        onLoadMore={() => handleLoadMore(statusId, dispatch)}
        onRefresh={handleRefresh}
        emptyMessage={emptyMessage}
      />
    </Column>
  );
};

export default Quotes;
