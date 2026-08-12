import quoteIcon from '@tabler/icons/outline/quote.svg';
import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { makeGetStatus } from '@/selectors/index.ts';

interface IQuotedStatusIndicator {
  /** The quoted status id. */
  statusId: string;
}

const QuotedStatusIndicator: React.FC<IQuotedStatusIndicator> = ({ statusId }) => {
  const getStatus = useCallback(makeGetStatus(), []);

  const status = useAppSelector(state => getStatus(state, { id: statusId }));

  if (!status) return null;

  const statusPath = `/@${status.account.acct}/posts/${status.id}`;

  return (
    <Link
      to={statusPath}
      className='block text-primary-600 hover:underline dark:text-accent-blue'
      onClick={(event) => event.stopPropagation()}
    >
      <HStack alignItems='center' space={1}>
        <Icon className='size-5' src={quoteIcon} aria-hidden />
        <Text truncate>
          <FormattedMessage
            id='status.nested_quote_link'
            defaultMessage='View quoted post by @{account}'
            values={{ account: status.account.acct }}
          />
        </Text>
      </HStack>
    </Link>
  );
};

export default QuotedStatusIndicator;
