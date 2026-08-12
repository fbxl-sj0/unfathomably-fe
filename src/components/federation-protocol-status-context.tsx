/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/components/federation-protocol-status-context.tsx

  Purpose:

    Identify statuses projected from selective non-ActivityPub bridges.

  Responsibilities:

    * label AT Protocol and diaspora* provenance supplied by the backend
    * expose a safe native source link when one is available
    * preserve the compact status-header layout

  This file intentionally does NOT contain:

    * protocol network access
    * federation capability decisions
    * post interaction behavior
*/

import { FormattedMessage } from 'react-intl';

interface AtprotoProvenance {
  uri: string;
  cid: string;
  url?: string | null;
}

interface DiasporaProvenance {
  guid: string;
  author: string;
}

interface IFederationProtocolStatusContext {
  atproto?: AtprotoProvenance | null;
  diaspora?: DiasporaProvenance | null;
}

const FederationProtocolStatusContext: React.FC<IFederationProtocolStatusContext> = ({ atproto, diaspora }) => {
  if (atproto) {
    const label = <FormattedMessage id='status.atproto.source' defaultMessage='Bluesky' />;

    return atproto.url ? (
      <a
        className='inline-flex items-center whitespace-nowrap text-sm font-semibold text-gray-500 hover:underline black:text-gray-400 dark:text-gray-400'
        href={atproto.url}
        target='_blank'
        rel='noopener noreferrer'
        onClick={(event) => event.stopPropagation()}
      >
        {label}
      </a>
    ) : (
      <div className='inline-flex items-center whitespace-nowrap text-sm font-semibold text-gray-500 black:text-gray-400 dark:text-gray-400'>
        {label}
      </div>
    );
  }

  if (diaspora) {
    return (
      <div
        className='inline-flex items-center whitespace-nowrap text-sm font-semibold text-gray-500 black:text-gray-400 dark:text-gray-400'
        title={diaspora.author}
      >
        <FormattedMessage id='status.diaspora.source' defaultMessage='diaspora*' />
      </div>
    );
  }

  return null;
};

export default FederationProtocolStatusContext;

/* end of src/components/federation-protocol-status-context.tsx */
