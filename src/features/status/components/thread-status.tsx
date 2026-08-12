import clsx from 'clsx';
import { OrderedSet as ImmutableOrderedSet } from 'immutable';

import StatusContainer from '@/containers/status-container.tsx';
import PlaceholderStatus from '@/features/placeholder/components/placeholder-status.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const MAX_THREAD_GUIDE_DEPTH = 5;
const THREAD_GUIDE_START = 20;
const THREAD_GUIDE_STEP = 7;

interface IThreadStatus {
  id: string;
  contextType?: string;
  focusedStatusId: string;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  visibleStatusIds?: ImmutableOrderedSet<string>;
}

type ParentLookup = (id: string) => string | undefined;

const getThreadDepth = (id: string, focusedStatusId: string, getParentId: ParentLookup): number => {
  const seen = new Set<string>();
  let currentId: string | undefined = id;
  let depth = 0;

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);

    const parentId = getParentId(currentId);
    if (!parentId) break;

    depth += 1;
    if (parentId === focusedStatusId) break;

    currentId = parentId;
  }

  return depth;
};

/** Status with reply-connector in threads. */
const ThreadStatus: React.FC<IThreadStatus> = (props): JSX.Element => {
  const { id, focusedStatusId, visibleStatusIds } = props;

  const getStoredParentId = (state: any, statusId: string): string | undefined =>
    state.contexts.inReplyTos.get(statusId) || state.statuses.get(statusId)?.in_reply_to_id || undefined;

  const replyToId = useAppSelector(state => {
    const parentId = getStoredParentId(state, id);
    return !visibleStatusIds || (parentId && visibleStatusIds.has(parentId)) ? parentId : undefined;
  });
  const replyCount = useAppSelector(state => {
    if (!visibleStatusIds) {
      return state.contexts.replies.get(id, ImmutableOrderedSet()).size;
    }

    return visibleStatusIds.count(statusId => getStoredParentId(state, statusId) === id);
  });
  const replyDepth = useAppSelector(state => getThreadDepth(id, focusedStatusId, statusId => {
    const parentId = getStoredParentId(state, statusId);
    return !visibleStatusIds || (parentId && visibleStatusIds.has(parentId)) ? parentId : undefined;
  }));
  const isLoaded = useAppSelector(state => Boolean(state.statuses.get(id)));

  const renderConnector = (): JSX.Element | null => {
    const isConnectedTop = replyToId && replyToId !== focusedStatusId;
    const isConnectedBottom = replyCount > 0;
    const isConnected = isConnectedTop || isConnectedBottom;
    const guideCount = Math.min(MAX_THREAD_GUIDE_DEPTH, Math.max(replyDepth, isConnectedBottom ? 1 : 0));

    if (!isConnected) return null;

    const lineClass = 'absolute z-[1] w-0.5 rounded-full bg-primary-200 black:bg-gray-800 dark:bg-primary-700';

    return (
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 left-0 z-[1] w-11 rtl:left-auto rtl:right-0'
        data-testid='thread-connector'
        data-thread-depth={replyDepth}
      >
        {Array.from({ length: guideCount }).map((_, index) => {
          const isActiveGuide = index === guideCount - 1;
          const style = { insetInlineStart: THREAD_GUIDE_START + (index * THREAD_GUIDE_STEP) };

          if (!isActiveGuide) {
            return (
              <span
                key={index}
                className={clsx(lineClass, 'inset-y-0')}
                data-testid='thread-connector-guide'
                style={style}
              />
            );
          }

          return (
            <span key={index} data-testid='thread-connector-guide'>
              {isConnectedTop ? (
                <span
                  className={clsx(lineClass, 'top-0 h-[calc(12px+21px)]')}
                  data-testid='thread-connector-top'
                  style={style}
                />
              ) : null}

              {isConnectedBottom ? (
                <span
                  className={clsx(lineClass, 'bottom-0 top-[calc(12px+21px)]')}
                  data-testid='thread-connector-bottom'
                  style={style}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className='thread__status'>
      {renderConnector()}
      {isLoaded ? (
        // @ts-ignore FIXME
        <StatusContainer {...props} showGroup={false} />
      ) : (
        <PlaceholderStatus slim />
      )}
    </div>
  );
};

export default ThreadStatus;
