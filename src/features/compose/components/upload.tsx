import { useCallback } from 'react';

import { undoUploadCompose, changeUploadCompose } from '@/actions/compose.ts';
import Upload from '@/components/upload.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useCompose } from '@/hooks/useCompose.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useInstance } from '@/hooks/useInstance.ts';

interface IUploadCompose {
  id: string;
  composeId: string;
  onSubmit?(): void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}

const UploadCompose: React.FC<IUploadCompose> = ({ composeId, id, onSubmit, onDragStart, onDragEnter, onDragEnd }) => {
  const dispatch = useAppDispatch();
  const features = useFeatures();
  const { instance } = useInstance();
  const { pleroma: { metadata: { description_limit: descriptionLimit } } } = instance;

  const media = useCompose(composeId).media_attachments.find(item => item.id === id)!;

  const handleDescriptionChange = (description: string) => {
    dispatch(changeUploadCompose(composeId, media.id, { description }));
  };

  const handleFocusChange = (focus: { x: number; y: number }) => {
    dispatch(changeUploadCompose(composeId, media.id, {
      focus: `${focus.x.toFixed(2)},${focus.y.toFixed(2)}`,
    }));
  };

  const handleOcr = async () => {
    const tesseract = (globalThis as any).Tesseract;

    if (!tesseract?.recognize) {
      return;
    }

    const result = await tesseract.recognize(media.url || media.preview_url, 'eng');
    const text = result?.data?.text?.trim();

    if (text) {
      dispatch(changeUploadCompose(composeId, media.id, { description: text }));
    }
  };

  const handleDelete = () => {
    dispatch(undoUploadCompose(composeId, media.id));
  };

  const handleDragStart = useCallback(() => {
    onDragStart(id);
  }, [onDragStart, id]);

  const handleDragEnter = useCallback(() => {
    onDragEnter(id);
  }, [onDragEnter, id]);

  return (
    <Upload
      media={media}
      onDelete={handleDelete}
      onDescriptionChange={handleDescriptionChange}
      onFocusChange={features.focalPoint ? handleFocusChange : undefined}
      onOcr={media.type === 'image' ? handleOcr : undefined}
      onSubmit={onSubmit}
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={onDragEnd}
      descriptionLimit={descriptionLimit}
      withPreview
    />
  );
};

export default UploadCompose;
