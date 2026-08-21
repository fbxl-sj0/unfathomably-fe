import { useEffect, useRef } from 'react';

import { connectTimelineStream } from '@/actions/streaming.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { getAccessToken } from '@/utils/auth.ts';

function useTimelineStream(...args: Parameters<typeof connectTimelineStream>) {
  // TODO: get rid of streaming.ts and move the actual opts here.
  const [timelineId, path] = args;
  const accept = args[2];
  const { enabled = true, onUpdate, onDelete } = args[3] ?? {};

  const dispatch = useAppDispatch();
  const { instance } = useInstance();
  const stream = useRef<(() => void) | null>(null);

  const accessToken = useAppSelector(getAccessToken);
  const streamingUrl = instance.configuration.urls.streaming;
  const anonymousPublicStreaming = instance.pleroma.metadata.features.includes('anonymous_public_streaming');
  const anonymousLocalStreaming = instance.pleroma.metadata.features.includes('anonymous_local_streaming');

  const connect = () => {
    if (
      enabled &&
      streamingUrl &&
      !stream.current &&
      (!requiresAccessToken(path, anonymousPublicStreaming, anonymousLocalStreaming) || accessToken)
    ) {
      stream.current = dispatch(connectTimelineStream(...args));
    }
  };

  const disconnect = () => {
    if (stream.current) {
      stream.current();
      stream.current = null;
    }
  };

  useEffect(() => {
    connect();
    return disconnect;
  }, [accessToken, streamingUrl, timelineId, path, accept, enabled, onUpdate, onDelete]);

  return {
    disconnect,
  };
}

function requiresAccessToken(
  path: string,
  anonymousPublicStreaming: boolean,
  anonymousLocalStreaming: boolean,
) {
  const stream = path.split('&', 1)[0];

  return stream === 'direct'
    || stream === 'list'
    || stream === 'user'
    || stream.startsWith('user:')
    || (stream.startsWith('public:local') && !anonymousLocalStreaming)
    || (stream.startsWith('public') && !stream.startsWith('public:local') && !anonymousPublicStreaming);
}

export { useTimelineStream };
