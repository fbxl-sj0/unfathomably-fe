import { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { fetchPostArchiveImports, importPostArchive } from '@/actions/import-data.ts';
import Button from '@/components/ui/button.tsx';
import FileInput from '@/components/ui/file-input.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import toast from '@/toast.tsx';
import { formatBytes } from '@/utils/media.ts';

import type { PostArchiveImport, PostArchiveImportState } from '@/actions/import-data.ts';

const messages = defineMessages({
  fileTooLarge: { id: 'import_data.errors.post_archive_too_large', defaultMessage: 'Archive must be smaller than {limit}' },
  inputHintModerated: { id: 'import_data.hints.post_archive_moderated', defaultMessage: 'ZIP archive containing actor.json and outbox.json at its root or inside one enclosing folder. Imported posts are added to your local post history without being published again, and replies reconnect to their original threads when possible. An admin will review it before import.' },
  inputHintOpen: { id: 'import_data.hints.post_archive_open', defaultMessage: 'ZIP archive containing actor.json and outbox.json at its root or inside one enclosing folder. Imported posts are added to your local post history without being published again, and replies reconnect to their original threads when possible.' },
  inputLabel: { id: 'import_data.post_archive_label', defaultMessage: 'Posts from an archive' },
  recentHeading: { id: 'import_data.post_archive_recent', defaultMessage: 'Recent archive imports' },
  awaitingReview: { id: 'import_data.post_archive_state.awaiting_review', defaultMessage: 'Waiting for administrator review' },
  pending: { id: 'import_data.post_archive_state.pending', defaultMessage: 'Queued' },
  running: { id: 'import_data.post_archive_state.running', defaultMessage: 'Importing posts' },
  complete: { id: 'import_data.post_archive_state.complete', defaultMessage: 'Complete' },
  failed: { id: 'import_data.post_archive_state.failed', defaultMessage: 'Import failed' },
  rejected: { id: 'import_data.post_archive_state.rejected', defaultMessage: 'Import rejected' },
  invalid: { id: 'import_data.post_archive_state.invalid', defaultMessage: 'Invalid import' },
  queuedDetail: { id: 'import_data.post_archive_detail.queued', defaultMessage: 'The import will start in the background.' },
  reviewDetail: { id: 'import_data.post_archive_detail.review', defaultMessage: 'An administrator must approve this archive before it can be imported.' },
  progressDetail: { id: 'import_data.post_archive_detail.progress', defaultMessage: 'Processed {processed, number} of {total, number} items' },
  completeDetail: { id: 'import_data.post_archive_detail.complete', defaultMessage: '{imported, plural, one {Imported # post} other {Imported # posts}} from {total, number} processed items' },
  completedNotification: { id: 'import_data.post_archive_notification.complete', defaultMessage: '{imported, plural, one {Archive import completed with # post} other {Archive import completed with # posts}}' },
  submit: { id: 'import_data.actions.import_post_archive', defaultMessage: 'Import posts' },
});

const activeStates = new Set<PostArchiveImportState>(['awaiting_review', 'pending', 'running']);

interface IArchiveImporter {
  maxFileSize: number;
  policy: 'moderated' | 'open';
}

const ArchiveImporter: React.FC<IArchiveImporter> = ({ maxFileSize, policy }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null | undefined>(null);
  const [imports, setImports] = useState<PostArchiveImport[]>([]);
  const previousStates = useRef<Map<string, PostArchiveImportState>>(new Map());
  const importsLoaded = useRef(false);

  const hint = policy === 'moderated' ? messages.inputHintModerated : messages.inputHintOpen;

  const applyImports = useCallback((nextImports: PostArchiveImport[]) => {
    if (importsLoaded.current) {
      nextImports.forEach((item) => {
        const previousState = previousStates.current.get(String(item.id));

        if (previousState && previousState !== 'complete' && item.state === 'complete') {
          toast.success(intl.formatMessage(messages.completedNotification, {
            imported: item.imported_count,
          }));
        }
      });
    }

    previousStates.current = new Map(nextImports.map((item) => [String(item.id), item.state]));
    importsLoaded.current = true;
    setImports(nextImports);
  }, [intl]);

  const refreshImports = useCallback(() =>
    dispatch(fetchPostArchiveImports())
      .then(applyImports)
      .catch(() => undefined), [applyImports, dispatch]);

  useEffect(() => {
    void refreshImports();
  }, [refreshImports]);

  useEffect(() => {
    if (!imports.some((item) => activeStates.has(item.state))) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshImports();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [imports, refreshImports]);

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
      void refreshImports();
    }).catch(() => {
      setIsLoading(false);
    });
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.item(0);
    setFile(file);
  };

  const stateMessage = (state: PostArchiveImportState) => {
    switch (state) {
      case 'awaiting_review':
        return messages.awaitingReview;
      case 'pending':
        return messages.pending;
      case 'running':
        return messages.running;
      case 'complete':
        return messages.complete;
      case 'failed':
        return messages.failed;
      case 'rejected':
        return messages.rejected;
      case 'invalid':
        return messages.invalid;
    }
  };

  const detail = (item: PostArchiveImport) => {
    switch (item.state) {
      case 'awaiting_review':
        return intl.formatMessage(messages.reviewDetail);
      case 'pending':
        return intl.formatMessage(messages.queuedDetail);
      case 'running':
        return intl.formatMessage(messages.progressDetail, {
          processed: item.processed_number,
          total: item.total_items,
        });
      case 'complete':
        return intl.formatMessage(messages.completeDetail, {
          imported: item.imported_count,
          total: item.total_items,
        });
      case 'failed':
      case 'rejected':
      case 'invalid':
        return item.error || intl.formatMessage(stateMessage(item.state));
    }
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
      {imports.length > 0 && (
        <section className='space-y-3' aria-live='polite'>
          <Text size='lg' weight='bold'>{intl.formatMessage(messages.recentHeading)}</Text>
          {imports.slice(0, 5).map((item) => (
            <div key={item.id} className='border-primary-200 dark:border-primary-800 border-t pt-3'>
              <Text weight='medium'>{intl.formatMessage(stateMessage(item.state))}</Text>
              <Text size='sm' theme='muted'>{detail(item)}</Text>
            </div>
          ))}
        </section>
      )}
    </Form>
  );
};

export default ArchiveImporter;
