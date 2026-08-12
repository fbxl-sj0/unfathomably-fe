import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import List, { ListItem } from '@/components/list.tsx';
import { Column } from '@/components/ui/column.tsx';
import { useInstance } from '@/hooks/useInstance.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

interface IEditIdentity {
}

const messages = defineMessages({
  title: { id: 'settings.edit_identity', defaultMessage: 'Identity' },
  activityPub: { id: 'edit_identity.activitypub', defaultMessage: 'ActivityPub' },
  activityPubHint: { id: 'edit_identity.activitypub_hint', defaultMessage: 'Your primary federated address.' },
  nostr: { id: 'edit_identity.nostr', defaultMessage: 'Nostr' },
  nostrHint: { id: 'edit_identity.nostr_hint', defaultMessage: 'Automatically assigned from your ActivityPub username. No review is required.' },
});

/** Display the protocol addresses derived from the local ActivityPub account. */
const EditIdentity: React.FC<IEditIdentity> = () => {
  const intl = useIntl();
  const { instance } = useInstance();
  const { account } = useOwnAccount();

  if (!account) return null;

  const activityPubAddress = `@${account.username}@${instance.domain}`;
  const nostrAddress = account.nostr.nip05 || `${account.username}@${instance.domain}`;

  return (
    <Column label={intl.formatMessage(messages.title)}>
      <List>
        <ListItem
          label={<FormattedMessage {...messages.activityPub} />}
          hint={<FormattedMessage {...messages.activityPubHint} />}
        >
          <span className='select-all font-mono text-sm'>{activityPubAddress}</span>
        </ListItem>
        <ListItem
          label={<FormattedMessage {...messages.nostr} />}
          hint={<FormattedMessage {...messages.nostrHint} />}
        >
          <span className='select-all font-mono text-sm'>{nostrAddress}</span>
        </ListItem>
      </List>
    </Column>
  );
};

export default EditIdentity;