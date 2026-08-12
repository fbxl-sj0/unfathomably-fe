import { useEffect } from 'react';

import { useConnectedNostr } from '@/contexts/nostr-context.tsx';
import { NBunker } from '@/features/nostr/NBunker.ts';
import { useSigner } from '@/hooks/nostr/useSigner.ts';

function useBunker() {
  const { signer: userSigner, bunkerSigner, authorizedPubkey } = useSigner();
  const enabled = !!userSigner && !!bunkerSigner && !!authorizedPubkey;
  const { relay } = useConnectedNostr(enabled);

  useEffect(() => {
    if (!relay || !userSigner || !bunkerSigner || !authorizedPubkey) return;

    const bunker = new NBunker({
      relay,
      userSigner,
      bunkerSigner,
      onError(error, event) {
        console.warn('Bunker error:', error, event);
      },
    });

    bunker.authorize(authorizedPubkey);

    return () => {
      bunker.close();
    };
  }, [relay, userSigner, bunkerSigner, authorizedPubkey]);
}

export { useBunker };
