import { useInstance } from '@/hooks/useInstance.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import { useTimelineStream } from './useTimelineStream.ts';

interface UsePublicStreamOpts {
  onlyMedia?: boolean;
  language?: string;
}

function usePublicStream({ onlyMedia, language }: UsePublicStreamOpts = {}) {
  const { instance } = useInstance();
  const { account } = useOwnAccount();
  const anonymousPublicStreaming = instance.pleroma.metadata.features.includes('anonymous_public_streaming');

  return useTimelineStream(
    `public${onlyMedia ? ':media' : ''}`,
    `public${onlyMedia ? ':media' : ''}`,
    null,
    { enabled: !language && (Boolean(account) || anonymousPublicStreaming) }, // TODO: support language streaming
  );
}

export { usePublicStream };
