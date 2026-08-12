/*
 * Unfathomably FE
 * File: nostr-runtime.tsx
 * Purpose: Start optional Nostr signer and bunker services after core UI load.
 * This file intentionally does not gate ActivityPub startup or render UI.
 */

import { useBunker } from '@/hooks/nostr/useBunker.ts';

/** Keep Nostr authorization available without placing it on the initial render path. */
const NostrRuntime = (): null => {
  useBunker();

  return null;
};

export default NostrRuntime;

/* end of nostr-runtime.tsx */
