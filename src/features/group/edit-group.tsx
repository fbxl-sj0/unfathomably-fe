import lockIcon from '@tabler/icons/outline/lock.svg';
import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useGroup, useGroupTags, useUpdateGroup } from '@/api/hooks/index.ts';
import Button from '@/components/ui/button.tsx';
import Checkbox from '@/components/ui/checkbox.tsx';
import { Column } from '@/components/ui/column.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Icon from '@/components/ui/icon.tsx';
import Input from '@/components/ui/input.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Textarea from '@/components/ui/textarea.tsx';
import { useImageField, useTextField } from '@/hooks/forms/index.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import toast from '@/toast.tsx';
import { isDefaultAvatar, isDefaultHeader } from '@/utils/accounts.ts';
import { htmlToPlaintext } from '@/utils/html.ts';

import AvatarPicker from '../edit-profile/components/avatar-picker.tsx';
import HeaderPicker from '../edit-profile/components/header-picker.tsx';

import GroupTagsField from './components/group-tags-field.tsx';

const nonDefaultAvatar = (url: string | undefined) => url && isDefaultAvatar(url) ? undefined : url;
const nonDefaultHeader = (url: string | undefined) => url && isDefaultHeader(url) ? undefined : url;

const messages = defineMessages({
  heading: { id: 'navigation_bar.edit_group', defaultMessage: 'Edit Group' },
  groupNamePlaceholder: { id: 'manage_group.fields.name_placeholder', defaultMessage: 'Group Name' },
  groupDescriptionPlaceholder: { id: 'manage_group.fields.description_placeholder', defaultMessage: 'Description' },
  groupSaved: { id: 'group.update.success', defaultMessage: 'Group successfully saved' },
});

interface IEditGroup {
  params: {
    groupId: string;
  };
}

const EditGroup: React.FC<IEditGroup> = ({ params: { groupId } }) => {
  const intl = useIntl();
  const { instance } = useInstance();

  const { group, isLoading } = useGroup(groupId);
  const { updateGroup } = useUpdateGroup(groupId);
  const { invalidate } = useGroupTags(groupId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [groupJoinNotifications, setGroupJoinNotifications] = useState(true);
  const [tags, setTags] = useState<string[]>(['']);

  const avatar = useImageField({ maxPixels: 400 * 400, preview: nonDefaultAvatar(group?.avatar) });
  const header = useImageField({ maxPixels: 1920 * 1080, preview: nonDefaultHeader(group?.header) });

  const displayName = useTextField(group?.display_name);
  const note = useTextField(htmlToPlaintext(group?.note || ''));

  const maxName = Number(instance.configuration.groups.max_characters_name);
  const maxNote = Number(instance.configuration.groups.max_characters_description);

  const attachmentTypes = useAppSelector(state => state.instance.configuration.media_attachments.supported_mime_types)
    ?.filter((type) => type.startsWith('image/'))
    .join(',');

  async function handleSubmit() {
    setIsSubmitting(true);

    await updateGroup({
      display_name: displayName.value,
      note: note.value,
      avatar: avatar.file === null ? '' : avatar.file,
      header: header.file === null ? '' : header.file,
      discoverable,
      group_join_notifications: groupJoinNotifications,
      tags,
    }, {
      onSuccess() {
        invalidate();
        toast.success(intl.formatMessage(messages.groupSaved));
      },
      async onError(error) {
        const message = (await error.response.json() as any)?.error;

        if (error.response.status === 422 && message) {
          toast.error(message);
        }
      },
    });

    setIsSubmitting(false);
  }

  const handleAddTag = () => {
    setTags([...tags, '']);
  };

  const handleRemoveTag = (i: number) => {
    const newTags = [...tags];
    newTags.splice(i, 1);
    setTags(newTags);
  };

  useEffect(() => {
    if (group) {
      setDiscoverable(group.discoverable);
      setGroupJoinNotifications(group.group_join_notifications);
      setTags(group.tags.map((t) => t.name));
    }
  }, [group?.id]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      <Form onSubmit={handleSubmit}>
        <div className='relative mb-12 flex'>
          <HeaderPicker accept={attachmentTypes} disabled={isSubmitting} {...header} />
          <AvatarPicker accept={attachmentTypes} disabled={isSubmitting} {...avatar} />
        </div>
        <FormGroup
          labelText={<FormattedMessage id='manage_group.fields.name_label_optional' defaultMessage='Group name' />}
          hintText={<FormattedMessage id='manage_group.fields.cannot_change_hint' defaultMessage='This cannot be changed after the group is created.' />}
        >
          <Input
            type='text'
            placeholder={intl.formatMessage(messages.groupNamePlaceholder)}
            maxLength={maxName}
            {...displayName}
            append={<Icon className='size-5 text-gray-600' src={lockIcon} />}
            disabled
          />
        </FormGroup>
        <FormGroup
          labelText={<FormattedMessage id='manage_group.fields.description_label' defaultMessage='Description' />}
        >
          <Textarea
            autoComplete='off'
            placeholder={intl.formatMessage(messages.groupDescriptionPlaceholder)}
            maxLength={maxNote}
            {...note}
          />
        </FormGroup>

        <FormGroup
          labelText={<FormattedMessage id='manage_group.discovery.label' defaultMessage='Outside discovery' />}
        >
          <label className='flex cursor-pointer items-start gap-3 rounded-lg bg-gradient-to-r from-gradient-start/20 to-gradient-end/20 px-4 py-3 dark:from-gradient-start/10 dark:to-gradient-end/10'>
            <Checkbox
              checked={discoverable}
              onChange={(event) => setDiscoverable(event.currentTarget.checked)}
            />
            <span>
              <span className='block text-gray-900 dark:text-gray-100'>
                <FormattedMessage id='manage_group.discovery.advertise.label' defaultMessage='Advertise this group to other servers' />
              </span>
              <span className='block text-sm text-gray-700 dark:text-gray-600'>
                <FormattedMessage id='manage_group.discovery.advertise.hint' defaultMessage='Show this group in Lemmy-compatible public community discovery so other servers can find it.' />
              </span>
            </span>
          </label>
        </FormGroup>

        <FormGroup
          labelText={<FormattedMessage id='manage_group.notifications.label' defaultMessage='Notifications' />}
        >
          <label className='flex cursor-pointer items-start gap-3 rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800'>
            <Checkbox
              checked={groupJoinNotifications}
              onChange={(event) => setGroupJoinNotifications(event.currentTarget.checked)}
            />
            <span>
              <span className='block text-gray-900 dark:text-gray-100'>
                <FormattedMessage id='manage_group.notifications.join.label' defaultMessage='Notify moderators when people join or request to join' />
              </span>
              <span className='block text-sm text-gray-700 dark:text-gray-600'>
                <FormattedMessage id='manage_group.notifications.join.hint' defaultMessage='Turn this off for busy groups where join notifications create too much noise.' />
              </span>
            </span>
          </label>
        </FormGroup>

        <div className='pb-6'>
          <GroupTagsField
            tags={tags}
            onChange={setTags}
            onAddItem={handleAddTag}
            onRemoveItem={handleRemoveTag}
          />
        </div>

        <FormActions>
          <Button theme='primary' type='submit' disabled={isSubmitting} block>
            <FormattedMessage id='edit_profile.save' defaultMessage='Save' />
          </Button>
        </FormActions>
      </Form>
    </Column>
  );
};

export default EditGroup;
