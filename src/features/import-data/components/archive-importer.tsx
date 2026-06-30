import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { importPostArchive } from '@/actions/import-data.ts';
import Button from '@/components/ui/button.tsx';
import FileInput from '@/components/ui/file-input.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import toast from '@/toast.tsx';
import { formatBytes } from '@/utils/media.ts';

const messages = defineMessages({
  fileTooLarge: { id: 'import_data.errors.post_archive_too_large', defaultMessage: 'Archive must be smaller than {limit}' },
  inputHintModerated: { id: 'import_data.hints.post_archive_moderated', defaultMessage: 'ZIP archive containing actor.json and outbox.json. Imported posts are added to your local post history without being published again, and replies reconnect to their original threads when possible. An admin will review it before import.' },
  inputHintOpen: { id: 'import_data.hints.post_archive_open', defaultMessage: 'ZIP archive containing actor.json and outbox.json. Imported posts are added to your local post history without being published again, and replies reconnect to their original threads when possible.' },
  inputLabel: { id: 'import_data.post_archive_label', defaultMessage: 'Posts from an archive' },
  submit: { id: 'import_data.actions.import_post_archive', defaultMessage: 'Import posts' },
});

interface IArchiveImporter {
  maxFileSize: number;
  policy: 'moderated' | 'open';
}

const ArchiveImporter: React.FC<IArchiveImporter> = ({ maxFileSize, policy }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null | undefined>(null);

  const hint = policy === 'moderated' ? messages.inputHintModerated : messages.inputHintOpen;

  const handleSubmit: React.FormEventHandler = (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    if (maxFileSize > 0 && file.size > maxFileSize) {
      toast.error(intl.formatMessage(messages.fileTooLarge, { limit: formatBytes(maxFileSize) }));
      return;
    }

    const params = new FormData();
    params.append('archive', file);

    setIsLoading(true);
    dispatch(importPostArchive(params)).then(() => {
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.item(0);
    setFile(file);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Text size='xl' weight='bold'>{intl.formatMessage(messages.inputLabel)}</Text>
      <FormGroup
        labelText={<span className='sr-only'>{intl.formatMessage(messages.inputLabel)}</span>}
        hintText={<Text theme='muted'>{intl.formatMessage(hint)}</Text>}
      >
        <FileInput
          accept='.zip,application/zip,application/x-zip-compressed'
          onChange={handleFileChange}
          required
        />
      </FormGroup>
      <FormActions>
        <Button type='submit' theme='primary' disabled={!file || isLoading}>
          {intl.formatMessage(messages.submit)}
        </Button>
      </FormActions>
    </Form>
  );
};

export default ArchiveImporter;
