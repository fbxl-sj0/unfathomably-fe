import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { createBackup } from '@/actions/backups.ts';
import Button from '@/components/ui/button.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import Form from '@/components/ui/form.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

const messages = defineMessages({
  backupLink: { id: 'export_data.post_archive.backups_link', defaultMessage: 'View backups' },
  inputHint: { id: 'export_data.hints.post_archive', defaultMessage: 'Queue a standard ActivityPub archive containing your profile and posts' },
  inputLabel: { id: 'export_data.post_archive_label', defaultMessage: 'Posts and account archive' },
  queued: { id: 'export_data.post_archive.queued', defaultMessage: 'Archive queued. Come back to backups later to download it.' },
  submit: { id: 'export_data.actions.export_post_archive', defaultMessage: 'Export posts' },
});

const ArchiveExporter: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const [isLoading, setIsLoading] = useState(false);
  const [queued, setQueued] = useState(false);

  const handleClick: React.MouseEventHandler = () => {
    setIsLoading(true);

    dispatch(createBackup()).then(() => {
      setQueued(true);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  return (
    <Form>
      <Stack space={1}>
        <Text size='xl' weight='bold'>{intl.formatMessage(messages.inputLabel)}</Text>
        <Text theme='muted'>{intl.formatMessage(messages.inputHint)}</Text>
        {queued && <Text theme='muted'>{intl.formatMessage(messages.queued)}</Text>}
      </Stack>

      <FormActions>
        <Button theme='primary' onClick={handleClick} disabled={isLoading}>
          {intl.formatMessage(messages.submit)}
        </Button>

        <Button to='/settings/backups'>
          {intl.formatMessage(messages.backupLink)}
        </Button>
      </FormActions>
    </Form>
  );
};

export default ArchiveExporter;
