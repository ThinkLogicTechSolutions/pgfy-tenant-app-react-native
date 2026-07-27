/**
 * File upload service (multipart `POST /upload`).
 *
 * Uploads a single local file (e.g. an expo-image-picker URI) to S3 via the API and returns the
 * stored asset — its public `link` + `thumbnail` — which callers drop straight into a
 * `ProfileAsset` (`{ link, type, metadata, thumbnail }`). The endpoint takes one file per request
 * and always answers with an array; we surface the first (and only) row.
 */
import { request } from './client';
import type { ProfileAsset } from './types';

export enum UploadFileType {
  IMAGE = 1,
  VIDEO = 2,
  AUDIO = 3,
  DOCUMENT = 4,
}

export type UploadPurpose = 'USER' | (string & {});

export interface UploadResult extends ProfileAsset {
  id: number;
  credential_id: number;
  key: string;
  purpose: UploadPurpose;
  fileType: UploadFileType;
}

export interface UploadFileInput {
  /** Local file URI (e.g. from expo-image-picker). */
  uri: string;
  fileType: UploadFileType;
  purpose: UploadPurpose;
  /** Optional overrides; otherwise derived from the URI. */
  name?: string;
  mimeType?: string;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

function extOf(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
}

function fileNameFromUri(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const slash = clean.lastIndexOf('/');
  const name = slash >= 0 ? clean.slice(slash + 1) : clean;
  return name || `upload-${Date.now()}`;
}

function guessMimeType(uri: string): string {
  return MIME_BY_EXT[extOf(uri)] ?? 'application/octet-stream';
}

/** Upload one local file and return the stored asset. */
export async function uploadFile({ uri, fileType, purpose, name, mimeType }: UploadFileInput): Promise<UploadResult> {
  const form = new FormData();
  form.append('fileType', String(fileType));
  form.append('purpose', purpose);
  // The API reads the file part regardless of field name.
  form.append('', {
    uri,
    name: name ?? fileNameFromUri(uri),
    type: mimeType ?? guessMimeType(uri),
  } as unknown as Blob);
  const res = await request<UploadResult[]>('/upload', { method: 'POST', body: form });
  return res[0];
}

/** A picked profile photo → USER / IMAGE. */
export async function uploadAvatar(uri: string): Promise<UploadResult> {
  return uploadFile({ uri, fileType: UploadFileType.IMAGE, purpose: 'USER' });
}

/**
 * A KYC/occupation document (ID card, admission or offer letter) → USER (DOCUMENT for
 * PDFs, IMAGE for photos/scans). Pass `name`/`mimeType` from a document-picker result when
 * available — they're more reliable than guessing off the (often extension-less) cache URI.
 */
export async function uploadProfileDocument(uri: string, name?: string, mimeType?: string): Promise<UploadResult> {
  const ext = mimeType ? mimeType.split('/')[1] : extOf(name ?? uri);
  const fileType = ext === 'pdf' ? UploadFileType.DOCUMENT : UploadFileType.IMAGE;
  return uploadFile({ uri, fileType, purpose: 'USER', name, mimeType });
}
