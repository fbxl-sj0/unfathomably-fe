/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/nostr-status-context.tsx

  Purpose:

    Identify a Nostr-origin post without replacing the standard status card.

  Responsibilities:

    * show compact Nostr provenance supplied by the backend
    * identify the relay without exposing raw bridge internals
    * preserve the configured frontend color scheme

  This file intentionally does NOT contain:

    * Nostr relay access
    * repost or quote behavior
    * ActivityPub visibility decisions
*/

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  tooltip: {
    id: 'status.nostr.source_tooltip',
    defaultMessage: 'Received through {relay}',
  },
});

interface NostrProvenance {
  event_id: string;
  pubkey: string;
  relay: string;
}

interface INostrStatusContext {
  provenance?: NostrProvenance | null;
}

const relayName = (relay: string): string => {
  try {
    return new URL(relay).hostname;
  } catch {
    return relay;
  }
};

const NostrStatusContext: React.FC<INostrStatusContext> = ({ provenance }) => {
  const intl = useIntl();

  if (!provenance) return null;

  const relay = relayName(provenance.relay);

  return (
    <div
      className='inline-flex items-center whitespace-nowrap text-sm font-semibold text-gray-500 black:text-gray-400 dark:text-gray-400'
      title={intl.formatMessage(messages.tooltip, { relay })}
    >
      <span>
        <FormattedMessage
          id='status.nostr.source'
          defaultMessage='Nostr'
        />
      </span>
    </div>
  );
};

export default NostrStatusContext;

/* end of src/components/nostr-status-context.tsx */
