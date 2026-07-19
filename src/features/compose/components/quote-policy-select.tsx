/*
  Project: Unfathomably FE
  File: features/compose/components/quote-policy-select.tsx

  Purpose:
    Let an author choose who may quote a new post.

  Responsibilities:
    Display the supported quote policies and store the selected policy in the
    active composer.

  This file intentionally does NOT contain:
    Server policy enforcement or quote-request approval controls.
*/

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { changeComposeQuotePolicy } from '@/actions/compose.ts';
import Stack from '@/components/ui/stack.tsx';
import Select from '@/components/ui/select.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

interface IQuotePolicySelect {
  composeId: string;
}

const messages = defineMessages({
  anyone: { id: 'compose.quote_policy.anyone', defaultMessage: 'Anyone' },
  followers: { id: 'compose.quote_policy.followers', defaultMessage: 'Followers' },
  following: { id: 'compose.quote_policy.following', defaultMessage: 'People you follow' },
  manual: { id: 'compose.quote_policy.manual', defaultMessage: 'Ask for approval' },
  nobody: { id: 'compose.quote_policy.nobody', defaultMessage: 'Nobody' },
});

const QuotePolicySelect: React.FC<IQuotePolicySelect> = ({ composeId }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const value = useAppSelector(state => state.compose.get(composeId)?.quote_approval_policy || 'public');

  return (
    <Stack space={1}>
      <Text size='sm' weight='medium'>
        <FormattedMessage id='compose.quote_policy.label' defaultMessage='Who can quote this post?' />
      </Text>

      <Select
        className='w-full rounded-md border border-solid border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
        value={value}
        onChange={(event) => dispatch(changeComposeQuotePolicy(composeId, event.target.value))}
      >
        <option value='public'>{intl.formatMessage(messages.anyone)}</option>
        <option value='followers'>{intl.formatMessage(messages.followers)}</option>
        <option value='following'>{intl.formatMessage(messages.following)}</option>
        <option value='manual'>{intl.formatMessage(messages.manual)}</option>
        <option value='nobody'>{intl.formatMessage(messages.nobody)}</option>
      </Select>
    </Stack>
  );
};

export default QuotePolicySelect;

/* end of features/compose/components/quote-policy-select.tsx */
