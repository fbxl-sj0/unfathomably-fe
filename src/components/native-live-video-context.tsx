/*
  Project: Unfathomably FE native federation
  -------------------------------------------

  File: src/components/native-live-video-context.tsx

  Purpose:

      Explain explicit scheduled-live video metadata without claiming that a
      remote broadcast is online when ActivityPub does not prove current state.

  Responsibilities:

      * distinguish scheduled and live-broadcast video types
      * show a parseable scheduled start in the viewer's locale
      * expose only validated HTTP(S) embed links as deliberate actions

  This file intentionally does NOT contain:

      * automatic iframe embedding
      * HLS probing
      * hostname-based platform detection
*/

import videoIcon from '@tabler/icons/outline/video.svg';
import { FormattedDate, FormattedMessage } from 'react-intl';

import Icon from '@/components/ui/icon.tsx';
import Text from '@/components/ui/text.tsx';

interface INativeLiveVideoContext {
  embedUrl?: unknown;
  isLiveBroadcast?: unknown;
  startTime?: unknown;
}

const NativeLiveVideoContext: React.FC<INativeLiveVideoContext> = ({ embedUrl, isLiveBroadcast, startTime }) => {
  const liveType = isLiveBroadcast === true || isLiveBroadcast === 'true';
  const start = parseStartTime(startTime);
  const playerUrl = typeof embedUrl === 'string' && /^https?:\/\//i.test(embedUrl) ? embedUrl : null;

  if (!liveType && !start) return null;

  return (
    <section className='border-b border-gray-200 p-3 black:border-gray-800 dark:border-gray-700' data-testid='native-live-video-context'>
      <div className='flex flex-wrap items-start justify-between gap-3 rounded-lg border border-solid border-gray-200 bg-white p-3 black:border-gray-800 black:bg-black dark:border-gray-700 dark:bg-primary-900'>
        <div className='flex min-w-0 items-start gap-3'>
          <Icon className='mt-0.5 text-primary-600 dark:text-primary-300' src={videoIcon} />
          <div>
            <Text weight='semibold'>
              {start ? (
                <FormattedMessage id='status.native.scheduled_live_video' defaultMessage='Scheduled live broadcast' />
              ) : (
                <FormattedMessage id='status.native.live_video' defaultMessage='Live broadcast video' />
              )}
            </Text>
            <Text className='mt-1' size='sm' theme='muted'>
              {start ? (
                <FormattedMessage
                  id='status.native.live_video_starts'
                  defaultMessage='Scheduled for {date}'
                  values={{
                    date: (
                      <FormattedDate
                        value={start}
                        year='numeric'
                        month='long'
                        day='2-digit'
                        hour='2-digit'
                        minute='2-digit'
                      />
                    ),
                  }}
                />
              ) : (
                <FormattedMessage id='status.native.live_video_source_state' defaultMessage='Open the source to confirm current stream status.' />
              )}
            </Text>
          </div>
        </div>
        {playerUrl ? (
          <a
            className='rounded-md border border-solid border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200 dark:hover:bg-primary-900'
            href={playerUrl}
            target='_blank'
            rel='noopener'
          >
            <FormattedMessage id='status.native.open_live_player' defaultMessage='Open player' />
          </a>
        ) : null}
      </div>
    </section>
  );
};

const parseStartTime = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default NativeLiveVideoContext;

/* end of native-live-video-context.tsx */
