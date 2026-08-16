/**
 * Image storage.
 *
 * Two backends, chosen at boot by whether Cloudinary credentials are present:
 *
 *  - **Cloudinary** (production) — images live off-box, so redeploying or
 *    replacing the container doesn't lose the gallery. Free tier is 25 credits
 *    a month, where 1 credit = 1 GB stored *or* 1 GB delivered; ~1000 party
 *    photos sits comfortably inside that, especially with the eager quality
 *    reduction applied below.
 *  - **Local disk** (dev fallback) — writes to `uploads/`, served by
 *    `app.use('/uploads', express.static(...))`. Keeps `docker compose up`
 *    working with no accounts or secrets.
 *
 * Callers get the same `{ url, filename }` back either way. `url` is absolute
 * for Cloudinary and root-relative for disk; the frontend's `resolveAvatar`
 * already prefixes the API host onto root-relative paths and passes absolute
 * URLs through untouched, so nothing downstream needs to know which is in use.
 */

import path from 'node:path';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';

const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

/**
 * The SDK reads CLOUDINARY_URL from the environment on its own, but doing it
 * explicitly means one code path decides whether remote storage is on.
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const remoteStorageEnabled = Boolean(
  process.env.CLOUDINARY_URL || (cloudName && apiKey && apiSecret)
);

if (remoteStorageEnabled) {
  cloudinary.config({
    // `secure` forces https:// URLs — mixed content would be blocked once the
    // site itself is served over https.
    secure: true,
    ...(cloudName ? { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } : {}),
  });
  console.log('[storage] Cloudinary enabled');
} else {
  console.log('[storage] Cloudinary not configured — storing uploads on local disk');
}

/** Root folder inside the Cloudinary account, so the media library stays tidy. */
const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || 'matts21st';

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

/**
 * Store an uploaded image.
 *
 * @param {Buffer} buffer         file contents (multer memory storage)
 * @param {string} originalName   used only for the extension on the disk path
 * @param {string} folder         'avatars' | 'gallery'
 * @param {string} prefix         filename prefix, e.g. 'avatar'
 * @returns {Promise<{ url: string, filename: string }>}
 */
export async function storeImage(buffer, { originalName = '', folder, prefix }) {
  const id = uniqueId(prefix);

  if (!remoteStorageEnabled) {
    const filename = `${id}${path.extname(originalName)}`;
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
    return { url: `/uploads/${filename}`, filename };
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${ROOT_FOLDER}/${folder}`,
        public_id: id,
        resource_type: 'image',
        // Phone photos are routinely 4-6 MB of which the gallery shows maybe
        // 1200px worth. Capping the stored dimension and letting Cloudinary
        // pick the format/quality keeps 1000 uploads well inside the free
        // 25 GB rather than blowing through it on originals.
        transformation: [
          { width: 2000, height: 2000, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    Readable.from(buffer).pipe(stream);
  });

  return { url: result.secure_url, filename: result.public_id };
}

/**
 * Best-effort delete of a previously stored image. Failures are swallowed by
 * design — an orphaned file is not worth failing a user's request over.
 */
export async function deleteImage(filename) {
  if (!filename) return;
  try {
    if (remoteStorageEnabled) {
      await cloudinary.uploader.destroy(filename, { resource_type: 'image' });
    } else {
      await fs.promises.unlink(path.join(uploadDir, path.basename(filename)));
    }
  } catch (err) {
    console.error('[storage] delete failed', filename, err.message);
  }
}

/**
 * Shared multer instance. Files are buffered in memory rather than written to
 * disk because `storeImage` may need to forward them straight to Cloudinary;
 * the 10 MB cap keeps that memory bounded.
 */
export const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024;

/** Rejects anything that isn't an image before it reaches storage. */
export function imageFileFilter(_req, file, cb) {
  if (!/^image\//.test(file.mimetype)) {
    return cb(Object.assign(new Error('Only image uploads are allowed'), { status: 400 }));
  }
  cb(null, true);
}
