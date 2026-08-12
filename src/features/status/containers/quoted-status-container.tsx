import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchStatus } from '@/actions/statuses.ts';
import QuotedStatus from '@/components/quoted-status.tsx';
import Tombstone from '@/components/tombstone.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { makeGetStatus } from '@/selectors/index.ts';

interface IQuotedStatusContainer {
  /** Status ID to the quoted status. */
  statusId: string;
}

const QuotedStatusContainer: React.FC<IQuotedStatusContainer> = ({ statusId }) => {
  const dispatch = useAppDispatch();
  const getStatus = useCallback(makeGetStatus(), []);
  const status = useAppSelector(state => getStatus(state, { id: statusId }));
  const relationship = useAppSelector(state => status ? state.relationships.get(status.account.id) : undefined);
  const attemptedStatusIds = useRef(new Set<string>());
  const [unavailableStatusId, setUnavailableStatusId] = useState<string | null>(null);

  useEffect(() => {
    if (status || attemptedStatusIds.current.has(statusId)) return;

    attemptedStatusIds.current.add(statusId);
    let active = true;

    dispatch(fetchStatus(statusId))
      .then(result => {
        if (active && !result) setUnavailableStatusId(statusId);
      })
      .catch(() => {
        if (active) setUnavailableStatusId(statusId);
      });

    return () => {
      active = false;
    };
  }, [dispatch, status, statusId]);

  if (!status) {
    return unavailableStatusId === statusId ? <Tombstone id={statusId} /> : null;
  }

  if (status.tombstone) {
    return <Tombstone id={status.id} />;
  }

  return (
    <QuotedStatus
      status={status}
      relationship={relationship}
    />
  );
};

export default QuotedStatusContainer;
