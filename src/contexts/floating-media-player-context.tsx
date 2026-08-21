/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/contexts/floating-media-player-context.tsx

  Purpose:
    Provide a route-persistent queue for playable federated media.

  Responsibilities:
    - preserve a bounded audio/video queue and current position across reloads
    - support play-now, play-next, append, reorder, and removal operations
    - expose the current item to the floating media dock
    - reject malformed persisted media records before they reach a player

  This file intentionally does not fetch missing media sources, decode media,
  or infer playability from a platform name.
*/

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const MINIMIZED_STORAGE_KEY = 'unfathomably:floating-media-player:minimized';
const QUEUE_STORAGE_KEY = 'unfathomably:floating-media-player:queue';
const INDEX_STORAGE_KEY = 'unfathomably:floating-media-player:index';
const MAXIMUM_QUEUE_LENGTH = 100;

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
  appendItem(item: FloatingMediaItem): void;
  clear(): void;
  close(): void;
  currentIndex: number;
  enqueueNext(item: FloatingMediaItem): void;
  isMinimized: boolean;
  item: FloatingMediaItem | null;
  minimize(): void;
  playAt(index: number): void;
  playItem(item: FloatingMediaItem): void;
  playNext(): void;
  playPrevious(): void;
  queue: FloatingMediaItem[];
  removeAt(index: number): void;
  reorder(from: number, to: number): void;
  restore(): void;
  toggleMinimized(): void;
}

interface IFloatingMediaPlayerProvider {
  children: ReactNode;
}

const emptyContext: FloatingMediaPlayerContextValue = {
  appendItem: () => undefined,
  clear: () => undefined,
  close: () => undefined,
  currentIndex: 0,
  enqueueNext: () => undefined,
  isMinimized: false,
  item: null,
  minimize: () => undefined,
  playAt: () => undefined,
  playItem: () => undefined,
  playNext: () => undefined,
  playPrevious: () => undefined,
  queue: [],
  removeAt: () => undefined,
  reorder: () => undefined,
  restore: () => undefined,
  toggleMinimized: () => undefined,
};

const FloatingMediaPlayerContext = createContext<FloatingMediaPlayerContextValue>(emptyContext);

const FloatingMediaPlayerProvider: React.FC<IFloatingMediaPlayerProvider> = ({ children }) => {
  const [queue, setQueue] = useState<FloatingMediaItem[]>(readStoredQueue);
  const [currentIndex, setCurrentIndex] = useState(() => readStoredIndex(readStoredQueue().length));
  const [isMinimized, setIsMinimized] = useState(readStoredMinimized);
  const item = queue[currentIndex] || null;

  useEffect(() => writeStorage(MINIMIZED_STORAGE_KEY, String(isMinimized)), [isMinimized]);
  useEffect(() => writeStorage(QUEUE_STORAGE_KEY, JSON.stringify(queue)), [queue]);
  useEffect(() => writeStorage(INDEX_STORAGE_KEY, String(currentIndex)), [currentIndex]);

  useEffect(() => {
    if (queue.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= queue.length) {
      setCurrentIndex(queue.length - 1);
    }
  }, [currentIndex, queue.length]);

  const playItem = useCallback((nextItem: FloatingMediaItem) => {
    if (!validMediaItem(nextItem)) return;

    setQueue((currentQueue) => {
      const withoutDuplicate = currentQueue.filter(candidate => candidate.id !== nextItem.id || candidate.mediaUrl !== nextItem.mediaUrl);
      const insertionIndex = currentQueue.length === 0 ? 0 : Math.min(currentIndex + 1, withoutDuplicate.length);
      const nextQueue = [...withoutDuplicate];
      nextQueue.splice(insertionIndex, 0, nextItem);
      setCurrentIndex(insertionIndex);
      return nextQueue.slice(0, MAXIMUM_QUEUE_LENGTH);
    });
    setIsMinimized(false);
  }, [currentIndex]);

  const appendItem = useCallback((nextItem: FloatingMediaItem) => {
    if (!validMediaItem(nextItem)) return;
    setQueue(currentQueue => [...currentQueue.filter(candidate => candidate.id !== nextItem.id || candidate.mediaUrl !== nextItem.mediaUrl), nextItem].slice(-MAXIMUM_QUEUE_LENGTH));
  }, []);

  const enqueueNext = useCallback((nextItem: FloatingMediaItem) => {
    if (!validMediaItem(nextItem)) return;
    setQueue((currentQueue) => {
      const nextQueue = currentQueue.filter(candidate => candidate.id !== nextItem.id || candidate.mediaUrl !== nextItem.mediaUrl);
      nextQueue.splice(Math.min(currentIndex + 1, nextQueue.length), 0, nextItem);
      return nextQueue.slice(0, MAXIMUM_QUEUE_LENGTH);
    });
  }, [currentIndex]);

  const playAt = useCallback((index: number) => {
    setCurrentIndex(current => Number.isInteger(index) && index >= 0 && index < queue.length ? index : current);
    setIsMinimized(false);
  }, [queue.length]);

  const playNext = useCallback(() => {
    setCurrentIndex(index => Math.min(index + 1, Math.max(queue.length - 1, 0)));
  }, [queue.length]);

  const playPrevious = useCallback(() => {
    setCurrentIndex(index => Math.max(index - 1, 0));
  }, []);

  const removeAt = useCallback((index: number) => {
    setQueue((currentQueue) => {
      if (!Number.isInteger(index) || index < 0 || index >= currentQueue.length) return currentQueue;
      const nextQueue = currentQueue.filter((_entry, entryIndex) => entryIndex !== index);
      setCurrentIndex(current => index < current ? current - 1 : Math.min(current, Math.max(nextQueue.length - 1, 0)));
      return nextQueue;
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setQueue((currentQueue) => {
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= currentQueue.length || to >= currentQueue.length || from === to) return currentQueue;
      const nextQueue = [...currentQueue];
      const [moved] = nextQueue.splice(from, 1);
      if (!moved) return currentQueue;
      nextQueue.splice(to, 0, moved);
      setCurrentIndex((current) => {
        if (current === from) return to;
        if (from < current && to >= current) return current - 1;
        if (from > current && to <= current) return current + 1;
        return current;
      });
      return nextQueue;
    });
  }, []);

  const clear = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);
  const toggleMinimized = useCallback(() => setIsMinimized(value => !value), []);

  const value = useMemo(() => ({
    appendItem,
    clear,
    close: clear,
    currentIndex,
    enqueueNext,
    isMinimized,
    item,
    minimize,
    playAt,
    playItem,
    playNext,
    playPrevious,
    queue,
    removeAt,
    reorder,
    restore,
    toggleMinimized,
  }), [appendItem, clear, currentIndex, enqueueNext, isMinimized, item, minimize, playAt, playItem, playNext, playPrevious, queue, removeAt, reorder, restore, toggleMinimized]);

  return <FloatingMediaPlayerContext.Provider value={value}>{children}</FloatingMediaPlayerContext.Provider>;
};

const validHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 4_096) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const validMediaItem = (value: unknown): value is FloatingMediaItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FloatingMediaItem>;
  return typeof item.id === 'string'
    && item.id.length <= 2_048
    && (item.kind === 'audio' || item.kind === 'video')
    && typeof item.title === 'string'
    && item.title.length <= 500
    && validHttpUrl(item.mediaUrl)
    && validHttpUrl(item.url)
    && (item.thumbnailUrl === null || validHttpUrl(item.thumbnailUrl));
};

const readStoredQueue = (): FloatingMediaItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(validMediaItem).slice(0, MAXIMUM_QUEUE_LENGTH) : [];
  } catch {
    return [];
  }
};

const readStoredIndex = (queueLength: number): number => {
  if (typeof window === 'undefined' || queueLength === 0) return 0;
  const value = Number(window.localStorage.getItem(INDEX_STORAGE_KEY));
  return Number.isInteger(value) ? Math.min(Math.max(value, 0), queueLength - 1) : 0;
};

const readStoredMinimized = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MINIMIZED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Hardened and private browsing modes may disable persistent storage.
  }
};

const useFloatingMediaPlayer = () => useContext(FloatingMediaPlayerContext);

export {
  FloatingMediaPlayerProvider,
  useFloatingMediaPlayer,
  type FloatingMediaItem,
  type FloatingMediaKind,
};

/* end of src/contexts/floating-media-player-context.tsx */
