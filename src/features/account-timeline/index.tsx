import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { fetchAccountByUsername } from '@/actions/accounts.ts';
import { fetchPatronAccount } from '@/actions/patron.ts';
import { expandAccountFeaturedTimeline, expandAccountTimeline } from '@/actions/timelines.ts';
import { useAccountLookup } from '@/api/hooks/index.ts';
import MissingIndicator from '@/components/missing-indicator.tsx';
import StatusList from '@/components/status-list.tsx';
import { Card, CardBody } from '@/components/ui/card.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Text from '@/components/ui/text.tsx';
import { useAccountStream } from '@/api/hooks/streaming/useAccountStream.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useSettings } from '@/hooks/useSettings.ts';
import { useSoapboxConfig } from '@/hooks/useSoapboxConfig.ts';
import { makeGetStatusIds } from '@/selectors/index.ts';

const getStatusIds = makeGetStatusIds();

interface IAccountTimeline {
  params: {
    username: string;
  };
  nativeFamily?: string;
  withReplies?: boolean;
}

const AccountTimeline: React.FC<IAccountTimeline> = ({ nativeFamily, params, withReplies = false }) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const features = useFeatures();
  const settings = useSettings();
  const soapboxConfig = useSoapboxConfig();

  const { account } = useAccountLookup(params.username, { withRelationship: true });
  const [accountLoading, setAccountLoading] = useState<boolean>(!account);

  let path = account?.id;

  if (nativeFamily) {
    path = `${account?.id}:worlds:${nativeFamily}`;
  } else if (withReplies) {
    path = `${account?.id}:with_replies`;
  }

  const timelineId = `account:${path}`;
  useAccountStream(timelineId, account?.id || '', { nativeFamily, withReplies });

  const showPins = settings.account_timeline.shows.pinned && !withReplies && !nativeFamily;
  const statusIds = useAppSelector(state => getStatusIds(state, { type: timelineId, prefix: 'account_timeline' }));
  const featuredStatusIds = useAppSelector(state => getStatusIds(state, { type: `account:${account?.id}:pinned`, prefix: 'account_timeline' }));

  const isBlocked = useAppSelector(state => state.relationships.getIn([account?.id, 'blocked_by']) === true);
  const unavailable = isBlocked && !features.blockersVisible;
  const patronEnabled = soapboxConfig.getIn(['extensions', 'patron', 'enabled']) === true;
  const isLoading = useAppSelector(state => state.timelines.getIn([`account:${path}`, 'isLoading']) === true);
  const hasMore = useAppSelector(state => state.timelines.getIn([`account:${path}`, 'hasMore']) === true);
  const next = useAppSelector(state => state.timelines.get(`account:${path}`)?.next);

  const accountUsername = account?.username || params.username;

  useEffect(() => {
    dispatch(fetchAccountByUsername(params.username, history))
      .then(() => setAccountLoading(false))
      .catch(() => setAccountLoading(false));
  }, [params.username]);

  useEffect(() => {
    if (account && !withReplies && !nativeFamily) {
      dispatch(expandAccountFeaturedTimeline(account.id));
    }
  }, [account?.id, nativeFamily, withReplies]);

  useEffect(() => {
    if (account && patronEnabled) {
      dispatch(fetchPatronAccount(account.url));
    }
  }, [account?.url, patronEnabled]);

  useEffect(() => {
    if (account) {
      dispatch(expandAccountTimeline(account.id, { nativeFamily, withReplies }));
    }
  }, [account?.id, nativeFamily, withReplies]);

  const handleLoadMore = (maxId: string) => {
    if (account) {
      dispatch(expandAccountTimeline(account.id, { url: next, maxId, nativeFamily, withReplies }));
    }
  };

  if (!account && accountLoading) {
    return <Spinner />;
  } else if (!account) {
    return <MissingIndicator nested />;
  }

  if (unavailable) {
    return (
      <Card>
        <CardBody>
          <Text align='center'>
            {isBlocked ? (
              <FormattedMessage id='empty_column.account_blocked' defaultMessage='You are blocked by @{accountUsername}.' values={{ accountUsername }} />
            ) : (
              <FormattedMessage id='empty_column.account_unavailable' defaultMessage='Profile unavailable' />
            )}
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <StatusList
      scrollKey='account_timeline'
      statusIds={statusIds}
      featuredStatusIds={showPins ? featuredStatusIds : undefined}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      emptyMessage={nativeFamily
        ? <FormattedMessage id='empty_column.account_world' defaultMessage='No {family} entries here yet.' values={{ family: nativeFamily }} />
        : <FormattedMessage id='empty_column.account_timeline' defaultMessage='No posts here!' />}
    />
  );
};

export default AccountTimeline;
