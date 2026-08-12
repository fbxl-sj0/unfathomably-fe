import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Redirect } from 'react-router-dom';

import {
  fetchStatusWithContext,
  fetchNext,
} from '@/actions/statuses.ts';
import MissingIndicator from '@/components/missing-indicator.tsx';
import PullToRefresh from '@/components/pull-to-refresh.tsx';
import { Column } from '@/components/ui/column.tsx';
import Stack from '@/components/ui/stack.tsx';
import PlaceholderStatus from '@/features/placeholder/components/placeholder-status.tsx';
import { useThreadStream } from '@/api/hooks/streaming/useThreadStream.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useLoggedIn } from '@/hooks/useLoggedIn.ts';
import { makeGetStatus } from '@/selectors/index.ts';

import ThreadLoginCta from './components/thread-login-cta.tsx';
import Thread, { getDescendantsIds } from './components/thread.tsx';

const messages = defineMessages({
  title: { id: 'status.title', defaultMessage: 'Post Details' },
  titleDirect: { id: 'status.title_direct', defaultMessage: 'Direct message' },
  deleteConfirm: { id: 'confirmations.delete.confirm', defaultMessage: 'Delete' },
  deleteHeading: { id: 'confirmations.delete.heading', defaultMessage: 'Delete post' },
  deleteMessage: { id: 'confirmations.delete.message', defaultMessage: 'Are you sure you want to delete this post?' },
  redraftConfirm: { id: 'confirmations.redraft.confirm', defaultMessage: 'Delete & redraft' },
  redraftHeading: { id: 'confirmations.redraft.heading', defaultMessage: 'Delete & redraft' },
  redraftMessage: { id: 'confirmations.redraft.message', defaultMessage: 'Are you sure you want to delete this post and re-draft it? Favorites and reposts will be lost, and replies to the original post will be orphaned.' },
  blockConfirm: { id: 'confirmations.block.confirm', defaultMessage: 'Block' },
  revealAll: { id: 'status.show_more_all', defaultMessage: 'Show more for all' },
  hideAll: { id: 'status.show_less_all', defaultMessage: 'Show less for all' },
  detailedStatus: { id: 'status.detailed_status', defaultMessage: 'Detailed conversation view' },
  replyConfirm: { id: 'confirmations.reply.confirm', defaultMessage: 'Reply' },
  replyMessage: { id: 'confirmations.reply.message', defaultMessage: 'Replying now will overwrite the message you are currently composing. Are you sure you want to proceed?' },
  blockAndReport: { id: 'confirmations.block.block_and_report', defaultMessage: 'Block & Report' },
  filtered: { id: 'status.filtered_with_reasons', defaultMessage: 'Filtered: {reasons}.' },
  showAnyway: { id: 'status.show_filter_reason', defaultMessage: 'Show anyway' },
});

const THREAD_REFRESH_INTERVAL = 60_000;

type RouteParams = {
  statusId: string;
  groupId?: string;
  groupSlug?: string;
};

interface IStatusDetails {
  params: RouteParams;
}

const StatusDetails: React.FC<IStatusDetails> = (props) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { isLoggedIn } = useLoggedIn();

  const getStatus = useCallback(makeGetStatus(), []);
  const status = useAppSelector((state) => getStatus(state, { id: props.params.statusId }));

  const [isLoaded, setIsLoaded] = useState<boolean>(!!status);
  const [next, setNext] = useState<string | null>(null);
  const [showFiltered, setShowFiltered] = useState(false);
  const refreshInFlight = useRef(false);

  /** Fetch the status (and context) from the API. */
  const fetchData = useCallback(async () => {
    if (refreshInFlight.current) return;

    refreshInFlight.current = true;

    try {
      const { next } = await dispatch(fetchStatusWithContext(props.params.statusId));
      setNext(next);
    } finally {
      refreshInFlight.current = false;
    }
  }, [dispatch, props.params.statusId]);

  const streamedDescendantIds = useAppSelector((state) => getDescendantsIds(state, props.params.statusId)).toArray();
  useThreadStream(props.params.statusId, streamedDescendantIds, fetchData);

  // Load data.
  useEffect(() => {
    let active = true;

    fetchData().then(() => {
      if (active) setIsLoaded(true);
    }).catch(() => {
      if (active) setIsLoaded(true);
    });

    const refreshVisibleThread = () => {
      if (!document.hidden) void fetchData();
    };

    const interval = window.setInterval(refreshVisibleThread, THREAD_REFRESH_INTERVAL);
    window.addEventListener('focus', refreshVisibleThread);
    document.addEventListener('visibilitychange', refreshVisibleThread);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshVisibleThread);
      document.removeEventListener('visibilitychange', refreshVisibleThread);
    };
  }, [fetchData]);

  useEffect(() => {
    setShowFiltered(false);
  }, [props.params.statusId]);

  const handleLoadMore = useCallback(debounce(() => {
    if (next && status) {
      dispatch(fetchNext(status.id, next)).then(({ next }) => {
        setNext(next);
      }).catch(() => { });
    }
  }, 300, { edges: ['leading'] }), [next, status]);

  useEffect(() => () => handleLoadMore.cancel(), [handleLoadMore]);

  const handleRefresh = () => {
    return fetchData();
  };

  if (status?.event) {
    return (
      <Redirect to={`/@${status.getIn(['account', 'acct'])}/events/${status.id}`} />
    );
  }

  if (!status && isLoaded) {
    return (
      <MissingIndicator />
    );
  } else if (!status) {
    return (
      <Column>
        <PlaceholderStatus />
      </Column>
    );
  }

  if (status.group && typeof status.group === 'object') {
    if (status.group.slug && !props.params.groupSlug) {
      return <Redirect to={`/group/${status.group.slug}/posts/${props.params.statusId}`} />;
    }
  }

  const titleMessage = () => {
    if (status.visibility === 'direct') return messages.titleDirect;
    return messages.title;
  };

  if (status.filtered.size > 0 && !showFiltered) {
    return (
      <Column label={intl.formatMessage(titleMessage())}>
        <div className='p-6 text-center text-gray-600 dark:text-gray-300'>
          <p>{intl.formatMessage(messages.filtered, { reasons: status.filtered.join(', ') })}</p>
          <button
            type='button'
            className='mt-2 text-primary-600 hover:underline dark:text-accent-blue'
            onClick={() => setShowFiltered(true)}
          >
            {intl.formatMessage(messages.showAnyway)}
          </button>
        </div>
      </Column>
    );
  }

  return (
    <Stack space={4}>
      <Column label={intl.formatMessage(titleMessage())}>
        <PullToRefresh onRefresh={handleRefresh}>
          <Thread
            status={status}
            next={next}
            handleLoadMore={handleLoadMore}
          />
        </PullToRefresh>
      </Column>

      {!isLoggedIn && <ThreadLoginCta />}
    </Stack>
  );
};

export default StatusDetails;
