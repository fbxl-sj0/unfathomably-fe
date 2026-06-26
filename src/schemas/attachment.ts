import { isBlurhashValid } from 'blurhash';
import { z } from 'zod';

import { mimeSchema } from './utils.ts';

type AttachmentInput = Record<string, any>;

const imageExtensions = ['.avif', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp'];
const videoExtensions = ['.m4v', '.mov', '.mp4', '.mpeg', '.mpg', '.ogv', '.webm'];
const audioExtensions = ['.aac', '.flac', '.m4a', '.mp3', '.oga', '.ogg', '.opus', '.wav'];

const blurhashSchema = z.string().superRefine((value, ctx) => {
  const r = isBlurhashValid(value);

  if (!r.result) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: r.errorReason,
    });
  }
});

const baseAttachmentSchema = z.object({
  blurhash: blurhashSchema.nullable().catch(null),
  description: z.string().catch(''),
  id: z.string(),
  pleroma: z.object({
    mime_type: mimeSchema,
  }).optional().catch(undefined),
  preview_url: z.string().url().catch(''),
  remote_url: z.string().url().nullable().catch(null),
  type: z.string(),
  url: z.string().url(),
});

const imageMetaSchema = z.object({
  width: z.number(),
  height: z.number(),
  aspect: z.number().optional().catch(undefined),
}).transform((meta) => ({
  ...meta,
  aspect: typeof meta.aspect === 'number' ? meta.aspect : meta.width / meta.height,
}));

const imageAttachmentSchema = baseAttachmentSchema.extend({
  type: z.literal('image'),
  meta: z.object({
    original: imageMetaSchema.optional().catch(undefined),
  }).catch({}),
});

const videoAttachmentSchema = baseAttachmentSchema.extend({
  type: z.literal('video'),
  meta: z.object({
    duration: z.number().optional().catch(undefined),
    original: imageMetaSchema.optional().catch(undefined),
  }).catch({}),
});

const gifvAttachmentSchema = baseAttachmentSchema.extend({
  type: z.literal('gifv'),
  meta: z.object({
    duration: z.number().optional().catch(undefined),
    original: imageMetaSchema.optional().catch(undefined),
  }).catch({}),
});

const audioAttachmentSchema = baseAttachmentSchema.extend({
  type: z.literal('audio'),
  meta: z.object({
    duration: z.number().optional().catch(undefined),
    colors: z.object({
      background: z.string().optional().catch(undefined),
      foreground: z.string().optional().catch(undefined),
      accent: z.string().optional().catch(undefined),
      duration: z.number().optional().catch(undefined),
    }).optional().catch(undefined),
  }).catch({}),
});

const unknownAttachmentSchema = baseAttachmentSchema.extend({
  type: z.literal('unknown'),
});

const isAttachmentInput = (value: unknown): value is AttachmentInput =>
  !!value && typeof value === 'object' && !Array.isArray(value);

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

const inferAttachmentType = (attachment: AttachmentInput) => {
  const inferredFromMime = typeFromMime(attachment.pleroma?.mime_type);

  if (inferredFromMime) return inferredFromMime;

  return [attachment.url, attachment.preview_url, attachment.remote_url]
    .map(extensionFromUrl)
    .map(typeFromExtension)
    .find(Boolean) || null;
};

const normalizeAttachmentInput = (value: unknown) => {
  if (!isAttachmentInput(value)) return value;
  if (value.type && value.type !== 'unknown') return value;

  const inferredType = inferAttachmentType(value);

  if (!inferredType) return value;

  return {
    ...value,
    type: inferredType,
  };
};

/** https://docs.joinmastodon.org/entities/attachment */
const attachmentSchema = z.preprocess(
  normalizeAttachmentInput,
  z.discriminatedUnion('type', [
    imageAttachmentSchema,
    videoAttachmentSchema,
    gifvAttachmentSchema,
    audioAttachmentSchema,
    unknownAttachmentSchema,
  ]),
).transform((attachment) => {
  if (!attachment.preview_url) {
    attachment.preview_url = attachment.url;
  }

  return attachment;
});

type Attachment = z.infer<typeof attachmentSchema>;

export { attachmentSchema, type Attachment };
