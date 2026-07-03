import { useCallback, useEffect, useState } from 'react';

const normalizeFallbackSource = (src?: string | null, fallbackSrc?: string | null) => {
  if (!fallbackSrc || fallbackSrc === src) return null;

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
