/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/hooks/useMediaSourceFallback.ts

  Purpose:

    Select a safe alternate media URL after a browser load failure.

  Responsibilities:

    * reset fallback state when media changes
    * permit local and same-origin fallback sources
    * preserve the backend media proxy as the browser privacy boundary

  This file intentionally does NOT contain:

    * media proxy URL signing
    * attachment rendering
    * retry loops
*/

import { useCallback, useEffect, useState } from 'react';

const isSafeFallbackSource = (fallbackSrc: string): boolean => {
  if (fallbackSrc.startsWith('/') || fallbackSrc.startsWith('data:') || fallbackSrc.startsWith('blob:')) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(fallbackSrc, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

const normalizeFallbackSource = (src?: string | null, fallbackSrc?: string | null) => {
  if (!fallbackSrc || fallbackSrc === src || !isSafeFallbackSource(fallbackSrc)) return null;

  return fallbackSrc;
};

const useMediaSourceFallback = (src: string, fallbackSrc?: string | null) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedFallback(false);
  }, [src, fallbackSrc]);

  const handleError = useCallback(() => {
    const fallback = normalizeFallbackSource(src, fallbackSrc);

    if (!fallback || triedFallback) {
      return;
    }

    setCurrentSrc(fallback);
    setTriedFallback(true);
  }, [src, fallbackSrc, triedFallback]);

  return [currentSrc, handleError] as const;
};

export default useMediaSourceFallback;

/* end of src/hooks/useMediaSourceFallback.ts */
