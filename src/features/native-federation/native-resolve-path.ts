/*
 * Unfathomably native resolution paths
 * -------------------------------------
 *
 * File: native-resolve-path.ts
 *
 * Purpose:
 *   Build a Worlds URL that deliberately resolves one ActivityPub object.
 *
 * Responsibilities:
 *   - retain the object's structural Worlds family
 *   - encode the exact remote object URL without manual string concatenation
 *
 * This file intentionally does not validate or fetch the remote object.
 */

import type { PresentationFamily } from './presentation-family.ts';

const nativeResolvePath = (family: PresentationFamily, objectUrl: string): string => {
  const params = new URLSearchParams({
    resolve: objectUrl,
  });

  return `/worlds/${family}?${params.toString()}`;
};

export { nativeResolvePath };

/* end of native-resolve-path.ts */
