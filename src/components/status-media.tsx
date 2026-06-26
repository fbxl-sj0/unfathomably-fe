import pictureInPictureIcon from '@tabler/icons/outline/picture-in-picture.svg';
import { Suspense } from 'react';
import { defineMessages, useIntl } from 'react-intl';


import { openModal } from '@/actions/modals.ts';
import AttachmentThumbs from '@/components/attachment-thumbs.tsx';
import SvgIcon from '@/components/ui/svg-icon.tsx';
import PreviewCard from '@/components/preview-card.tsx';
import { useFloatingMediaPlayer, type FloatingMediaItem, type FloatingMediaKind } from '@/contexts/floating-media-player-context.tsx';
import { GroupLinkPreview } from '@/features/groups/components/group-link-preview.tsx';
import PlaceholderCard from '@/features/placeholder/components/placeholder-card.tsx';
import { MediaGallery, Video, Audio } from '@/features/ui/util/async-components.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { Status as StatusEntity, Attachment } from '@/schemas/index.ts';

const messages = defineMessages({
  playDocked: { id: 'federation.source_item.action.play_docked', defaultMessage: 'Play docked' },
});

interface IStatusMedia {
  /** Status entity to render media for. */
  status: StatusEntity;
  /** Whether to display compact media. */
  muted?: boolean;
  /** Callback when compact media is clicked. */
  onClick?: () => void;
  /** Whether or not the media is concealed behind a NSFW banner. */
  showMedia?: boolean;
  /** Callback when visibility is toggled (eg clicked through NSFW). */
  onToggleVisibility?: () => void;
}

/** Render media attachments for a status. */
const StatusMedia: React.FC<IStatusMedia> = ({
  status,
  muted = false,
  onClick,
  showMedia = true,
  onToggleVisibility = () => { },
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const { playItem } = useFloatingMediaPlayer();

  const size = status.media_attachments.length;
  const firstAttachment = status.media_attachments[0];
  const dockItem = firstAttachment ? statusFloatingMediaItem(status, firstAttachment) : null;
  const dockLabel = intl.formatMessage(messages.playDocked);

  let media: JSX.Element | null = null;

  const renderLoadingMediaGallery = (): JSX.Element => {
    return <div className='relative isolate box-border h-auto w-full overflow-hidden rounded-lg' style={{ height: '285px' }} />;
  };

  const renderLoadingVideoPlayer = (): JSX.Element => {
    return <div className='relative mt-2 block cursor-pointer border-0 bg-cover bg-center bg-no-repeat' style={{ height: '285px' }} />;
  };

  const renderLoadingAudioPlayer = (): JSX.Element => {
    return <div className='relative mt-2 block cursor-pointer border-0 bg-cover bg-center bg-no-repeat' style={{ height: '285px' }} />;
  };

  const openMedia = (media: readonly Attachment[], index: number) => {
    dispatch(openModal('MEDIA', { media, status, index }));
  };

  if (size > 0 && firstAttachment) {
    if (muted) {
      media = (
        <AttachmentThumbs
          media={status.media_attachments}
          onClick={onClick}
          sensitive={status.sensitive}
        />
      );
    } else if (size === 1 && firstAttachment.type === 'video') {
      const video = firstAttachment;

      media = (
        <DockableMediaFrame item={dockItem} label={dockLabel} onPlay={playItem}>
          <Suspense fallback={renderLoadingVideoPlayer()}>
            <Video
              preview={video.preview_url}
              blurhash={video.blurhash ?? undefined}
              src={video.url}
              alt={video.description}
              aspectRatio={Number(video.meta?.original?.aspect)}
              height={285}
              visible={showMedia}
              inline
            />
          </Suspense>
        </DockableMediaFrame>
      );
    } else if (size === 1 && firstAttachment.type === 'audio') {
      const attachment = firstAttachment;

      media = (
        <DockableMediaFrame item={dockItem} label={dockLabel} onPlay={playItem}>
          <Suspense fallback={renderLoadingAudioPlayer()}>
            <Audio
              src={attachment.url}
              alt={attachment.description}
              poster={attachment.preview_url !== attachment.url ? attachment.preview_url : status.account.avatar_static}
              backgroundColor={attachment.meta?.colors?.background}
              foregroundColor={attachment.meta?.colors?.foreground}
              accentColor={attachment.meta?.colors?.accent}
              duration={attachment.meta?.duration  ?? 0}
              height={263}
            />
          </Suspense>
        </DockableMediaFrame>
      );
    } else {
      media = (
        <Suspense fallback={renderLoadingMediaGallery()}>
          <MediaGallery
            media={status.media_attachments}
            sensitive={status.sensitive}
            height={285}
            onOpenMedia={openMedia}
            visible={showMedia}
            onToggleVisibility={onToggleVisibility}
          />
        </Suspense>
      );
    }
  } else if (status.spoiler_text.length === 0 && !status.quote && status.card?.group) {
    media = (
      <GroupLinkPreview card={status.card} />
    );
  } else if (status.spoiler_text.length === 0 && !status.quote && status.card) {
    media = (
      <PreviewCard
        onOpenMedia={openMedia}
        card={status.card}
        compact
      />
    );
  } else if (status.expectsCard) {
    media = (
      <PlaceholderCard />
    );
  }

  if (media) {
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onClick={e => e.stopPropagation()}>
        {media}
      </div>
    );
  } else {
    return null;
  }
};

interface IDockableMediaFrame {
  children: React.ReactNode;
  item: FloatingMediaItem | null;
  label: string;
  onPlay(item: FloatingMediaItem): void;
}

const DockableMediaFrame: React.FC<IDockableMediaFrame> = ({ children, item, label, onPlay }) => (
  <div className='relative'>
    {children}

    {item ? (
      <button
        aria-label={label}
        className='absolute right-2 top-2 z-[2] inline-flex size-9 items-center justify-center rounded-md border border-solid border-primary-200 bg-white/95 text-primary-700 shadow-md backdrop-blur hover:bg-primary-50 dark:border-primary-800 dark:bg-gray-900/95 dark:text-primary-300 dark:hover:bg-primary-950/60 rtl:left-2 rtl:right-auto'
        onClick={() => onPlay(item)}
        title={label}
        type='button'
      >
        <SvgIcon className='size-5' src={pictureInPictureIcon} />
      </button>
    ) : null}
  </div>
);

function statusFloatingMediaItem(status: StatusEntity, attachment: Attachment): FloatingMediaItem | null {
  const kind = attachmentFloatingMediaKind(attachment);

  if (!kind) {
    return null;
  }

  return {
    id: `${status.id}:${attachment.id}`,
    kind,
    mediaType: attachment.pleroma?.mime_type || null,
    mediaUrl: attachment.url,
    platformLabel: status.group?.platform_label || status.group?.platform || status.application?.name || null,
    sourceKindLabel: status.group?.display_name || null,
    thumbnailUrl: attachment.preview_url && attachment.preview_url !== attachment.url ? attachment.preview_url : null,
    title: statusFloatingMediaTitle(status, attachment),
    url: status.url || attachment.remote_url || attachment.url,
  };
}

function attachmentFloatingMediaKind(attachment: Attachment): FloatingMediaKind | null {
  if (attachment.type === 'audio') {
    return 'audio';
  }

  if (attachment.type === 'video') {
    return 'video';
  }

  return null;
}

function statusFloatingMediaTitle(status: StatusEntity, attachment: Attachment): string {
  return attachment.description ||
    status.spoiler_text ||
    status.account.display_name ||
    status.account.acct ||
    status.url ||
    attachment.url;
}

export default StatusMedia;
