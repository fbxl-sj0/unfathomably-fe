import { NSet, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { isEqual } from 'es-toolkit';
import { useEffect, useRef, useState } from 'react';

import { useConnectedNostr } from '@/contexts/nostr-context.tsx';
import { useForceUpdate } from '@/hooks/useForceUpdate.ts';

/**
 * Streams events from the relay for the given filters.
 */
export function useNostrReq(filters: NostrFilter[]): { events: NostrEvent[]; eose: boolean; closed: boolean } {
  const { relay } = useConnectedNostr();

  const nset = useRef<NSet>(new NSet());
  const forceUpdate = useForceUpdate();

  const [closed, setClosed] = useState(false);
  const [eose, setEose] = useState(false);

  const value = useValue(filters);

  useEffect(() => {
    const controller = new AbortController();

    nset.current = new NSet();
    setEose(false);
    setClosed(false);
    forceUpdate();

    if (relay && value.length) {
      void (async () => {
        try {
          for await (const msg of relay.req(value, { signal: controller.signal })) {
            if (msg[0] === 'EVENT') {
              nset.current.add(msg[2]);
              forceUpdate();
            } else if (msg[0] === 'EOSE') {
              setEose(true);
            } else if (msg[0] === 'CLOSED') {
              setClosed(true);
              break;
            }
          }
        } catch {
          if (!controller.signal.aborted) setClosed(true);
        }
      })();
    }

    return () => {
      controller.abort();
    };
  }, [relay, value]);

  return {
    events: [...nset.current.values()],
    eose,
    closed,
  };
}

/** Preserves the memory reference of a value across re-renders. */
function useValue<T>(value: T): T {
  const ref = useRef<T>(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
