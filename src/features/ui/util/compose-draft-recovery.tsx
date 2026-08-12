/*
  Project: Unfathomably FE
  File: features/ui/util/compose-draft-recovery.tsx

  Purpose:
    Persist compose state locally and restore safe drafts after reloads.

  Responsibilities:
    Save text, privacy, quote, reply, poll, schedule, and uploaded media
    identifiers without letting one browser tab silently clobber another.

  This file intentionally does NOT contain:
    Compose rendering or server-side draft storage.
*/

import { useEffect, useMemo, useRef } from 'react';

import { hydrateComposeDrafts, resetCompose } from '@/actions/compose.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import {
  COMPOSE_DRAFT_STORAGE_KEY,
  composeDraftsEqual,
  loadComposeDraftEnvelope,
  saveComposeDraftEnvelope,
  type ComposeDraftEnvelope,
} from '@/utils/compose-drafts.ts';

const hasDraftContent = (draft: any) => {
  return Boolean(
    draft?.text ||
    draft?.spoiler_text ||
    draft?.in_reply_to ||
    draft?.quote ||
    draft?.poll ||
    draft?.schedule ||
    draft?.media_attachments?.length,
  );
};

const serialiseCompose = (compose: any) => {
  const value = typeof compose?.toJS === 'function' ? compose.toJS() : compose;

  return {
    content_type: value.content_type,
    group_id: value.group_id,
    in_reply_to: value.in_reply_to,
    media_attachments: (value.media_attachments || []).map((media: any) => ({
      description: media.description,
      id: media.id,
      meta: media.meta,
      preview_url: media.preview_url,
      type: media.type,
      url: media.url,
    })),
    poll: value.poll,
    privacy: value.privacy,
    quote: value.quote,
    schedule: value.schedule,
    sensitive: value.sensitive,
    spoiler: value.spoiler,
    spoiler_text: value.spoiler_text,
    text: value.text,
    to: value.to,
  };
};

const ComposeDraftRecovery: React.FC = () => {
  const dispatch = useAppDispatch();
  const compose = useAppSelector(state => state.compose);
  const tabId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const lastImportedAt = useRef(0);
  const skippedInitialSave = useRef(false);
  const currentDrafts = useRef<Record<string, any>>({});

  const drafts = useMemo(() => {
    const items = typeof compose?.entrySeq === 'function'
      ? compose.entrySeq().toArray()
      : Object.entries(compose || {});

    return items.reduce((acc: Record<string, any>, [id, draft]: [string, any]) => {
      if (id === 'default') return acc;

      const serialised = serialiseCompose(draft);

      if (hasDraftContent(serialised)) {
        acc[id] = serialised;
      }

      return acc;
    }, {});
  }, [compose]);

  currentDrafts.current = drafts;

  useEffect(() => {
    const envelope = loadComposeDraftEnvelope();

    if (envelope?.drafts && envelope.updatedAt > lastImportedAt.current) {
      lastImportedAt.current = envelope.updatedAt;
      dispatch(hydrateComposeDrafts(envelope.drafts));
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== COMPOSE_DRAFT_STORAGE_KEY || !event.newValue) return;

      try {
        const envelope = JSON.parse(event.newValue) as ComposeDraftEnvelope;

        if (envelope.tabId !== tabId.current && envelope.updatedAt > lastImportedAt.current) {
          lastImportedAt.current = envelope.updatedAt;

          Object.entries(envelope.clearedDrafts || {}).forEach(([id, clearedDraft]) => {
            if (composeDraftsEqual(currentDrafts.current[id], clearedDraft)) {
              dispatch(resetCompose(id));
            }
          });

          dispatch(hydrateComposeDrafts(envelope.drafts));
        }
      } catch {
        // Ignore malformed data from older development builds.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!skippedInitialSave.current) {
      skippedInitialSave.current = true;
      return;
    }

    const envelope: ComposeDraftEnvelope = {
      tabId: tabId.current,
      updatedAt: Date.now(),
      drafts,
    };

    lastImportedAt.current = envelope.updatedAt;
    saveComposeDraftEnvelope(envelope);
  }, [drafts]);

  return null;
};

export default ComposeDraftRecovery;

/* end of features/ui/util/compose-draft-recovery.tsx */
