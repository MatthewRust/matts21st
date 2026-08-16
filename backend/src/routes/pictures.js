import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { storeImage, imageFileFilter, IMAGE_SIZE_LIMIT } from '../lib/storage.js';
import { validateOptionalText } from '../lib/validate.js';

const router = Router();

//Buffers the file in memory so storeImage can forward it to Cloudinary (or
//write it to disk when Cloudinary isn't configured)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: imageFileFilter,
});

// GET /api/pictures?limit=24&offset=0
// Returns { items, total } — newest first.
//
// Paginated rather than returning everything: the gallery is expected to hold
// several hundred photos by the end of the weekend, and a phone on Braemar
// signal should not have to pull the whole list to render the first screen.
router.get('/', async (req, res, next) => {
  try {
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const offsetRaw = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 60) : 24;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const itemsPromise = pool.query(
      `SELECT p.picture_id, p.description, p.url, p.filename, p.upload_time,
              p.uploader_id, u.username AS uploader_name,
              u.profile_pic_url AS uploader_profile_pic_url
       FROM pictures p
       JOIN users u ON u.user_id = p.uploader_id
       ORDER BY p.upload_time DESC, p.picture_id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const totalPromise = pool.query('SELECT COUNT(*)::int AS total FROM pictures');

    const [itemsResult, totalResult] = await Promise.all([itemsPromise, totalPromise]);
    res.json({ items: itemsResult.rows, total: totalResult.rows[0].total });
  } catch (err) {
    next(err);
  }
});

//When getting a request if its not a file return 400 then upload the image and insert its url into the database then return 201
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { uploader_id, description } = req.body;
    if (!uploader_id) return res.status(400).json({ error: 'uploader_id is required' });

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
      [uploader_id, checkedDescription.value, stored.filename, stored.url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
