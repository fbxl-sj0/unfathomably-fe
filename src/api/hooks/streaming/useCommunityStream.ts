import { useInstance } from '@/hooks/useInstance.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

import { useTimelineStream } from './useTimelineStream.ts';

interface UseCommunityStreamOpts {
  onlyMedia?: boolean;
  enabled?: boolean;
}

function useCommunityStream({ onlyMedia, enabled }: UseCommunityStreamOpts = {}) {
  const { instance } = useInstance();
  const { account } = useOwnAccount();
  const anonymousLocalStreaming = instance.pleroma.metadata.features.includes('anonymous_local_streaming');
  const accessEnabled = Boolean(account) || anonymousLocalStreaming;

  return useTimelineStream(
    `community${onlyMedia ? ':media' : ''}`,
    `public:local${onlyMedia ? ':media' : ''}`,
    undefined,
    { enabled: accessEnabled && enabled !== false },
  );
}

export { useCommunityStream };
