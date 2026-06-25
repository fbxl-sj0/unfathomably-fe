/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/contexts/floating-media-player-context.tsx

  Purpose:

    Provide a small, route-persistent media player state for playable
    federation source items.

  Responsibilities:

    * remember the currently docked audio or video item
    * expose player controls to source cards and the floating dock
    * preserve the minimized preference between browser sessions

  This file intentionally does NOT contain:

    * media fetching
    * source-card rendering
    * custom audio or video playback controls
*/

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const MINIMIZED_STORAGE_KEY = 'unfathomably:floating-media-player:minimized';

type FloatingMediaKind = 'audio' | 'video';

interface FloatingMediaItem {
  id: string;
  kind: FloatingMediaKind;
  mediaType: string | null;
  mediaUrl: string;
  platformLabel: string | null;
  sourceKindLabel: string | null;
  thumbnailUrl: string | null;
  title: string;
  url: string;
}

interface FloatingMediaPlayerContextValue {
  close(): void;
  isMinimized: boolean;
  item: FloatingMediaItem | null;
  minimize(): void;
  playItem(item: FloatingMediaItem): void;
  restore(): void;
  toggleMinimized(): void;
}

interface IFloatingMediaPlayerProvider {
  children: ReactNode;
}

const emptyContext: FloatingMediaPlayerContextValue = {
  close: () => undefined,
  isMinimized: false,
  item: null,
  minimize: () => undefined,
  playItem: () => undefined,
  restore: () => undefined,
  toggleMinimized: () => undefined,
};

const FloatingMediaPlayerContext = createContext<FloatingMediaPlayerContextValue>(emptyContext);

const FloatingMediaPlayerProvider: React.FC<IFloatingMediaPlayerProvider> = ({ children }) => {
  const [item, setItem] = useState<FloatingMediaItem | null>(null);
  const [isMinimized, setIsMinimized] = useState(readStoredMinimized);

  useEffect(() => {
    writeStoredMinimized(isMinimized);
  }, [isMinimized]);

  const playItem = useCallback((nextItem: FloatingMediaItem) => {
    setItem(nextItem);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setItem(null);
  }, []);

  const minimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const toggleMinimized = useCallback(() => {
    setIsMinimized((value) => !value);
  }, []);

  const value = useMemo(() => ({
    close,
    isMinimized,
    item,
    minimize,
    playItem,
    restore,
    toggleMinimized,
  }), [close, isMinimized, item, minimize, playItem, restore, toggleMinimized]);

  return (
    <FloatingMediaPlayerContext.Provider value={value}>
      {children}
    </FloatingMediaPlayerContext.Provider>
  );
};

function readStoredMinimized() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(MINIMIZED_STORAGE_KEY) === 'true';
  } catch (_e) {
    return false;
  }
}

function writeStoredMinimized(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(MINIMIZED_STORAGE_KEY, String(value));
  } catch (_e) {
    // Browsers may disable localStorage in private or hardened contexts.
  }
}

const useFloatingMediaPlayer = () => useContext(FloatingMediaPlayerContext);

export {
  FloatingMediaPlayerProvider,
  useFloatingMediaPlayer,
  type FloatingMediaItem,
  type FloatingMediaKind,
};

/* end of src/contexts/floating-media-player-context.tsx */
