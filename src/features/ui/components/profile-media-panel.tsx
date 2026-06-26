import { List as ImmutableList } from 'immutable';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { openModal } from '@/actions/modals.ts';
import { expandAccountMediaTimeline } from '@/actions/timelines.ts';
import Spinner from '@/components/ui/spinner.tsx';
import Text from '@/components/ui/text.tsx';
import Widget from '@/components/ui/widget.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { getAccountGallery } from '@/selectors/index.ts';

import MediaItem from '../../account-gallery/components/media-item.tsx';

import type { Account } from '@/schemas/index.ts';
import type { Attachment } from '@/types/entities.ts';

interface IProfileMediaPanel {
  account?: Account;
}

const ProfileMediaPanel: React.FC<IProfileMediaPanel> = ({ account }) => {
  const dispatch = useAppDispatch();

  const attachments: ImmutableList<Attachment> = useAppSelector((state) => account ? getAccountGallery(state, account?.id) : ImmutableList());
  const timeline = useAppSelector((state) => account ? state.timelines.get(`account:${account.id}:media`) : undefined);
  const loading = !!timeline?.isLoading && attachments.size === 0;
  const hasLoaded = attachments.size > 0 || timeline?.hasMore === false || timeline?.loadingFailed;

  const handleOpenMedia = (attachment: Attachment): void => {
    if (attachment.type === 'video') {
      dispatch(openModal('VIDEO', { media: attachment, status: attachment.status }));
    } else {
      const media = attachment.getIn(['status', 'media_attachments']) as ImmutableList<Attachment>;
      const index = media.findIndex(x => x.id === attachment.id);

      dispatch(openModal('MEDIA', { media: media.toJS(), index, status: attachment?.status?.toJS() ?? attachment.status }));
    }
  };

  useEffect(() => {
    if (account && !timeline?.isLoading && !hasLoaded) {
      dispatch(expandAccountMediaTimeline(account.id));
    }
  }, [account?.id, dispatch, hasLoaded, timeline?.isLoading]);

  const renderAttachments = () => {
    const publicAttachments = attachments.filter(attachment => attachment.getIn(['status', 'visibility']) === 'public');
    const nineAttachments = publicAttachments.slice(0, 9);

    if (!nineAttachments.isEmpty()) {
      return (
        <div className='grid grid-cols-3 gap-1'>
          {nineAttachments.map((attachment, _index) => (
            <MediaItem
              key={`${attachment.getIn(['status', 'id'])}+${attachment.id}`}
              attachment={attachment}
              onOpenMedia={handleOpenMedia}
            />
          ))}
        </div>
      );
    } else {
      return (
        <Text size='sm' theme='muted'>
          <FormattedMessage id='media_panel.empty_message' defaultMessage='No media found.' />
        </Text>
      );
    }
  };

  return (
    <Widget title={<FormattedMessage id='media_panel.title' defaultMessage='Media' />}>
      {account && (
        <div className='w-full'>
          {loading ? (
            <Spinner />
          ) : (
            renderAttachments()
          )}
        </div>
      )}
    </Widget>
  );
};

export default ProfileMediaPanel;
