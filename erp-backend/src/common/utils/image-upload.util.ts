import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import multer from 'multer';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * The only image types Kotrim accepts, and the extension each is stored under.
 *
 * The extension comes from this table — never from the uploaded filename.
 * Deriving it with `extname(file.originalname)` is exactly how a file called
 * `payload.html`, declared as `image/png`, got stored as `.html` and served back
 * as `text/html` with its script intact: stored XSS on our own origin, where
 * `script-src 'self'` is no help, reachable by anyone who signs up for a trial.
 */
const ALLOWED_IMAGE_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] }, // "RIFF"; WEBP confirmed below
};

/**
 * Multer options for a single-image upload.
 *
 * Buffers in memory rather than writing straight to disk: the mimetype in the
 * request is client-supplied and free to lie, so nothing may be persisted before
 * the *bytes* have been inspected. `persistImage` does that, then writes.
 */
export function imageUploadOptions(): multer.Options {
  return {
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
      // A cheap first gate. Not trusted — see persistImage.
      if (!(file.mimetype in ALLOWED_IMAGE_TYPES)) {
        callback(new BadRequestException('Envie uma imagem PNG, JPG ou WEBP.'));
        return;
      }
      callback(null, true);
    },
  };
}

/** True when the buffer really begins with the signature of the claimed type. */
export function hasMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const spec = ALLOWED_IMAGE_TYPES[mimetype];
  if (!spec) return false;

  const matches = spec.magic.some((signature) => signature.every((byte, i) => buffer[i] === byte));
  if (!matches) return false;

  // RIFF also fronts .wav and .avi; only bytes 8..12 say WEBP.
  if (mimetype === 'image/webp') {
    return buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return true;
}

/**
 * Verifies the bytes and writes the file, returning its stored filename.
 *
 * Throws when the content does not match the declared type — which is the whole
 * point, because the declaration came from the client.
 */
export async function persistImage(file: Express.Multer.File, subdir: string): Promise<string> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Arquivo vazio ou não enviado.');
  }

  if (!hasMagicBytes(file.buffer, file.mimetype)) {
    throw new BadRequestException('O arquivo enviado não é uma imagem válida.');
  }

  const { ext } = ALLOWED_IMAGE_TYPES[file.mimetype];
  const filename = `${randomUUID()}${ext}`;
  const directory = join(process.cwd(), 'uploads', subdir);

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), file.buffer);

  return filename;
}

export function publicUploadPath(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
