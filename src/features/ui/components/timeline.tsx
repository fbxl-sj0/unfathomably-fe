import { debounce } from 'es-toolkit';
import { OrderedSet as ImmutableOrderedSet } from 'immutable';
import { useCallback, useEffect, useRef, useState } from 'react';

import { dequeueTimeline, scrollTopTimeline } from '@/actions/timelines.ts';
import StatusList, { IStatusList } from '@/components/status-list.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { setNotification } from '@/reducers/notificationsSlice.ts';
import { makeGetStatusIds } from '@/selectors/index.ts';

const TOP_REFRESH_INTERVAL = 30 * 1000;

const isDocumentHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
const isBrowserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

interface ITimeline extends Omit<IStatusList, 'statusIds' | 'isLoading' | 'hasMore'> {
  /** ID of the timeline in Redux. */
  timelineId: string;
  /** Settings path to use instead of the timelineId. */
  prefix?: string;
  /** Optional refresh hook used by timelines that are not backed by a stream. */
  onRefreshAtTop?: () => void;
  /** Refresh cadence for non-streamed timelines while the user is already at the top. */
  refreshAtTopInterval?: number;
}

/** Scrollable list of statuses from a timeline in the Redux store. */
const Timeline: React.FC<ITimeline> = ({
  timelineId,
  onLoadMore,
  prefix,
  onRefreshAtTop,
  refreshAtTopInterval = TOP_REFRESH_INTERVAL,
  ...rest
}) => {
  const dispatch = useAppDispatch();
  const getStatusIds = useCallback(makeGetStatusIds(), []);

  const lastStatusId = useAppSelector(state => (state.timelines.get(timelineId)?.items || ImmutableOrderedSet()).last() as string | undefined);
  const statusIds = useAppSelector(state => getStatusIds(state, { type: timelineId, prefix }));
  const isLoading = useAppSelector(state => (state.timelines.get(timelineId) || { isLoading: true }).isLoading === true);
  const isPartial = useAppSelector(state => (state.timelines.get(timelineId)?.isPartial || false) === true);
  const hasMore = useAppSelector(state => state.timelines.get(timelineId)?.hasMore === true);
  const hasQueuedItems = useAppSelector(state => state.timelines.get(timelineId)?.totalQueuedItemsCount || 0);

  const [isInTop, setIsInTop] = useState<boolean>(window.scrollY < 50);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const handleDequeueTimeline = useCallback(() => {
    dispatch(dequeueTimeline(timelineId, onLoadMore));
  }, [dispatch, timelineId, onLoadMore]);

  const handleScrollToTop = useCallback(debounce(() => {
    setIsInTop(true);
    dispatch(scrollTopTimeline(timelineId, true));
  }, 100), [dispatch, timelineId]);

  const handleScroll = useCallback(debounce(() => {
    const top = window.scrollY < 50;

    setIsInTop(top);
    dispatch(scrollTopTimeline(timelineId, top));
  }, 100), [dispatch, timelineId]);

  useEffect(() => {
    if (hasQueuedItems) {
      dispatch(setNotification({ timelineId: timelineId, value: hasQueuedItems > 0 }));
    }
  }, [hasQueuedItems, timelineId]);

  useEffect(() => {
    if (isInTop) {
      if (!intervalRef.current) {
        handleDequeueTimeline();
        const interval = setInterval(handleDequeueTimeline, 2000);
        intervalRef.current = interval;
        dispatch(setNotification({ timelineId: timelineId, value: false }));
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch, handleDequeueTimeline, isInTop, timelineId]);

  useEffect(() => {
    if (!onRefreshAtTop || !isInTop) {
      return;
    }

    const refresh = () => {
      if (isDocumentHidden() || isBrowserOffline()) {
        return;
      }

      onRefreshAtTop();
    };

    const interval = setInterval(refresh, refreshAtTopInterval);

    return () => clearInterval(interval);
  }, [isInTop, onRefreshAtTop, refreshAtTopInterval]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <>
      <StatusList
        timelineId={timelineId}
        onScrollToTop={handleScrollToTop}
        onScroll={handleScroll}
        lastStatusId={lastStatusId}
        statusIds={statusIds}
        isLoading={isLoading}
        isPartial={isPartial}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        {...rest}
      />
    </>
  );
};

export default Timeline;
