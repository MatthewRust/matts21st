import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { storeImage, deleteImage, imageFileFilter, IMAGE_SIZE_LIMIT } from '../lib/storage.js';
import { validateOptionalText } from '../lib/validate.js';
import { requireUser } from '../lib/requireUser.js';

const router = Router();

//Buffers the file in memory so storeImage can forward it to Cloudinary (or
//write it to disk when Cloudinary isn't configured)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: imageFileFilter,
});

// GET /api/pictures/uploaders
// Everyone who has actually posted a photo, with their count.
//
// Deliberately not the full user list: the gallery filter should only offer
// people who have something to show, otherwise most choices lead to an empty
// grid.
router.get('/uploaders', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.user_id, u.username, u.profile_pic_url,
             COUNT(p.picture_id)::int AS photo_count
      FROM pictures p
      JOIN users u ON u.user_id = p.uploader_id
      GROUP BY u.user_id, u.username, u.profile_pic_url
      ORDER BY u.username ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/pictures?limit=24&offset=0&sort=newest|oldest&uploader_id=3
// Returns { items, total }.
//
// Paginated rather than returning everything: the gallery is expected to hold
// several hundred photos by the end of the weekend, and a phone on Braemar
// signal should not have to pull the whole list to render the first screen.
//
// Sorting and filtering are done here rather than in the browser so they apply
// across the whole table — filtering only the currently-loaded page would
// quietly hide matches sitting further down.
router.get('/', async (req, res, next) => {
  try {
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const offsetRaw = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 60) : 24;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    // Whitelisted, never interpolated from raw input — this lands in the SQL
    // string itself, where a parameter placeholder can't be used.
    const direction = req.query.sort === 'oldest' ? 'ASC' : 'DESC';

    const uploaderRaw = Number.parseInt(req.query.uploader_id, 10);
    const uploaderId = Number.isFinite(uploaderRaw) ? uploaderRaw : null;

    // Both queries share the same filter, so they stay in agreement — `total`
    // must count the filtered set, not the whole table, or "load more" would
    // keep offering pages that don't exist.
    const where = uploaderId === null ? '' : 'WHERE p.uploader_id = $3';
    const countWhere = uploaderId === null ? '' : 'WHERE uploader_id = $1';
    const params = uploaderId === null ? [limit, offset] : [limit, offset, uploaderId];

    const itemsPromise = pool.query(
      `SELECT p.picture_id, p.description, p.url, p.filename, p.upload_time,
              p.uploader_id, u.username AS uploader_name,
              u.profile_pic_url AS uploader_profile_pic_url
       FROM pictures p
       JOIN users u ON u.user_id = p.uploader_id
       ${where}
       ORDER BY p.upload_time ${direction}, p.picture_id ${direction}
       LIMIT $1 OFFSET $2`,
      params
    );
    const totalPromise = pool.query(
      `SELECT COUNT(*)::int AS total FROM pictures ${countWhere}`,
      uploaderId === null ? [] : [uploaderId]
    );

    const [itemsResult, totalResult] = await Promise.all([itemsPromise, totalPromise]);
    res.json({ items: itemsResult.rows, total: totalResult.rows[0].total });
  } catch (err) {
    next(err);
  }
});

// Upload a photo. The uploader is taken from the signed token, not the body:
// besides preventing someone from posting under another guest's name, this
// keeps the endpoint from being an open image host for anyone who finds it,
// which would land on the free Cloudinary tier's storage and bandwidth.
router.post('/', requireUser, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { description } = req.body;

    const checkedDescription = validateOptionalText(description, { field: 'description', max: 300 });
    if (!checkedDescription.ok) return res.status(400).json({ error: checkedDescription.error });

    const stored = await storeImage(req.file.buffer, {
      originalName: req.file.originalname,
      folder: 'gallery',
      prefix: 'picture',
    });

    const { rows } = await pool.query(
      `INSERT INTO pictures (uploader_id, description, filename, url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, checkedDescription.value, stored.filename, stored.url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pictures/:id — remove one of your own photos.
//
// Ownership lives in the WHERE clause rather than a read-then-compare, so
// there's no window between the check and the delete, and someone else's photo
// simply matches nothing.
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const pictureId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(pictureId)) return res.status(400).json({ error: 'Invalid picture id' });

    const { rows } = await pool.query(
      'DELETE FROM pictures WHERE picture_id = $1 AND uploader_id = $2 RETURNING picture_id, filename',
      [pictureId, req.userId]
    );

    if (!rows.length) {
      // Same response whether it doesn't exist or isn't theirs, so this can't
      // be used to probe what's in the gallery.
      return res.status(404).json({ error: 'No such photo of yours' });
    }

    // The row is the source of truth for the gallery, so it goes first. Losing
    // the stored file afterwards would leave an orphan in Cloudinary — untidy
    // and eventually billable — but failing the request after the row is gone
    // would tell the user nothing happened when it did. deleteImage already
    // swallows and logs its own errors.
    await deleteImage(rows[0].filename);

    res.json({ deleted: rows[0].picture_id });
  } catch (err) {
    next(err);
  }
});

export default router;
