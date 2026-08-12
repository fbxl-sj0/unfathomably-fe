/*
  Project: Unfathomably FE
  File: utils/compose-drafts.ts

  Purpose:
    Own the browser storage contract for recoverable compose drafts.

  Responsibilities:
    Read and write versioned draft envelopes, remove a published or discarded
    draft immediately, and describe cleared drafts to other browser tabs.

  This file intentionally does NOT contain:
    Redux state changes, composer rendering, or server-side draft storage.
*/

const COMPOSE_DRAFT_STORAGE_KEY = 'unfathomably:compose-drafts:v1';

interface ComposeDraftEnvelope {
  tabId: string;
  updatedAt: number;
  drafts: Record<string, any>;
  clearedDrafts?: Record<string, any>;
}

const loadComposeDraftEnvelope = (): ComposeDraftEnvelope | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(COMPOSE_DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as ComposeDraftEnvelope : null;
  } catch {
    return null;
  }
};

const saveComposeDraftEnvelope = (envelope: ComposeDraftEnvelope) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(COMPOSE_DRAFT_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Draft recovery must not make the composer unusable when storage is full
    // or disabled by the browser.
  }
};

const composeDraftsEqual = (left: any, right: any) => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

const clearStoredComposeDraft = (composeId: string) => {
  const envelope = loadComposeDraftEnvelope();
  const drafts = { ...(envelope?.drafts || {}) };
  const clearedDraft = drafts[composeId];

  delete drafts[composeId];

  // "default" is a reducer template, not a visible composer. Older builds
  // could persist it and then copy its stale text into a real composer.
  delete drafts.default;

  saveComposeDraftEnvelope({
    tabId: `clear-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    updatedAt: Date.now(),
    drafts,
    clearedDrafts: clearedDraft ? { [composeId]: clearedDraft } : undefined,
  });
};

export {
  COMPOSE_DRAFT_STORAGE_KEY,
  clearStoredComposeDraft,
  composeDraftsEqual,
  loadComposeDraftEnvelope,
  saveComposeDraftEnvelope,
};

export type { ComposeDraftEnvelope };

/* end of utils/compose-drafts.ts */
