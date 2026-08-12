/*
 * Unfathomably status-backed native discovery result
 * --------------------------------------------------
 *
 * File: native-discovery-article.tsx
 *
 * Purpose:
 *   Render a discovery result as an ordinary Soapbox post whenever the
 *   backend has identified a local Create activity for that native object.
 *
 * Responsibilities:
 *   - batch local Mastodon status hydration into the normal client entity store
 *   - render the established account, media, permalink, and action controls
 *   - retain the specialized discovery article when no local status exists
 *
 * This file intentionally does not resolve remote URLs, invent interactions
 * for source-only documents, or duplicate the Status component's behavior.
 */

import { useCallback, useEffect, useState } from 'react';

import Status from '@/components/status.tsx';
import { nativeDiscoveryStatusId } from '@/api/hooks/discovery/nativeDiscoveryStatus.ts';
import PlaceholderStatus from '@/features/placeholder/components/placeholder-status.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { makeGetStatus } from '@/selectors/index.ts';

import { queueNativeStatus } from './native-status-batcher.ts';

interface NativeDiscoveryArticleProps extends React.ComponentPropsWithoutRef<'article'> {
  item: unknown;
}

const NativeDiscoveryArticle: React.FC<NativeDiscoveryArticleProps> = ({ item, children, ...articleProps }) => {
  const dispatch = useAppDispatch();
  const getStatus = useCallback(makeGetStatus(), []);
  const statusId = nativeDiscoveryStatusId(item);
  const status = useAppSelector(state => statusId ? getStatus(state, { id: statusId }) : undefined);
  const [finished, setFinished] = useState(!statusId);

  useEffect(() => {
    let cancelled = false;

    if (!statusId || status) {
      setFinished(true);
      return () => {
        cancelled = true;
      };
    }

    setFinished(false);
    queueNativeStatus(statusId, dispatch).then(() => {
      if (!cancelled) setFinished(true);
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, status, statusId]);

  if (status) return <Status status={status} />;

  if (statusId && !finished) {
    return <PlaceholderStatus />;
  }

  return <article {...articleProps}>{children}</article>;
};

export default NativeDiscoveryArticle;

/* end of native-discovery-article.tsx */
