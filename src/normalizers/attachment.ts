/**
 * Attachment normalizer:
 * Converts API attachments into our internal format.
 * @see {@link https://docs.joinmastodon.org/entities/attachment/}
 */
import {
  Map as ImmutableMap,
  Record as ImmutableRecord,
  fromJS,
} from 'immutable';

import { mergeDefined } from '@/utils/normalizers.ts';

const imageExtensions = ['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp'];
const videoExtensions = ['.m4v', '.mov', '.mp4', '.mpeg', '.mpg', '.ogv', '.webm'];
const audioExtensions = ['.aac', '.flac', '.m4a', '.mp3', '.oga', '.ogg', '.opus', '.wav'];

// https://docs.joinmastodon.org/entities/attachment/
export const AttachmentRecord = ImmutableRecord({
  blurhash: undefined,
  description: '',
  id: '',
  meta: ImmutableMap(),
  pleroma: ImmutableMap(),
  preview_url: '',
  remote_url: null as string | null,
  type: 'unknown',
  url: '',

  // Internal fields
  // TODO: Remove these? They're set in selectors/index.js
  account: null as any,
  status: null as any,
});

// Ensure attachments have required fields
const normalizeUrls = (attachment: ImmutableMap<string, any>) => {
  const url = [
    attachment.get('url'),
    attachment.get('preview_url'),
    attachment.get('remote_url'),
  ].find(url => url) || '';

  const base = ImmutableMap({
    url,
    preview_url: url,
  });

  return attachment.mergeWith(mergeDefined, base);
};

// Ensure meta is not null
const normalizeMeta = (attachment: ImmutableMap<string, any>) => {
  const meta = ImmutableMap().merge(attachment.get('meta'));

  return attachment.set('meta', meta);
};

const extensionFromUrl = (url: unknown): string => {
  if (typeof url !== 'string') return '';

  try {
    return extensionFromPathname(new URL(url).pathname);
  } catch (_e) {
    return extensionFromPathname(url);
  }
};

const extensionFromPathname = (pathname: string): string => {
  const cleanPathname = pathname.split(/[?#]/)[0] || '';
  const lastSegment = cleanPathname.split('/').pop() || '';
  const dotIndex = lastSegment.lastIndexOf('.');

  return dotIndex >= 0 ? lastSegment.slice(dotIndex).toLowerCase() : '';
};

const typeFromMime = (mimeType: unknown) => {
  if (typeof mimeType !== 'string') return null;

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';

  return null;
};

const typeFromExtension = (extension: string) => {
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';

  return null;
};

const inferAttachmentType = (attachment: ImmutableMap<string, any>) => {
  const inferredFromMime = typeFromMime(attachment.getIn(['pleroma', 'mime_type']));

  if (inferredFromMime) return inferredFromMime;

  return [
    attachment.get('url'),
    attachment.get('preview_url'),
    attachment.get('remote_url'),
  ].map(extensionFromUrl)
    .map(typeFromExtension)
    .find(Boolean) || null;
};

const normalizeType = (attachment: ImmutableMap<string, any>) => {
  const type = attachment.get('type');

  if (type && type !== 'unknown') return attachment;

  const inferredType = inferAttachmentType(attachment);

  return inferredType ? attachment.set('type', inferredType) : attachment;
};

export const normalizeAttachment = (attachment: Record<string, any>) => {
  return AttachmentRecord(
    ImmutableMap(fromJS(attachment)).withMutations((attachment: ImmutableMap<string, any>) => {
      normalizeUrls(attachment);
      normalizeMeta(attachment);
      normalizeType(attachment);
    }),
  );
};
