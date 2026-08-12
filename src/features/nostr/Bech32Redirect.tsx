import { nip19 } from 'nostr-tools';
import { Redirect } from 'react-router-dom';

import MissingIndicator from '@/components/missing-indicator.tsx';

interface INIP19Redirect {
  params: {
    bech32: string;
  };
}

const Bech32Redirect: React.FC<INIP19Redirect> = ({ params }) => {
  try {
    const result = nip19.decode(params.bech32);

    switch (result.type) {
      case 'npub':
      case 'nprofile':
        return <Redirect to={`/@${params.bech32}`} />;
      case 'note':
        return <Redirect to={`/posts/${params.bech32}`} />;
      case 'nevent':
        return <Redirect to={`/posts/${params.bech32}`} />;
      case 'naddr':
        return <Redirect to={`/search?q=${encodeURIComponent(params.bech32)}`} />;
      default:
        return <MissingIndicator />;
    }

  } catch (e) {
    return <MissingIndicator />;
  }
};

export default Bech32Redirect;
