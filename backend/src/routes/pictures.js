import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { storeImage, imageFileFilter, IMAGE_SIZE_LIMIT } from '../lib/storage.js';

const router = Router();

//Buffers the file in memory so storeImage can forward it to Cloudinary (or
//write it to disk when Cloudinary isn't configured)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: imageFileFilter,
});

//Gets all the pictures from the db
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.username AS uploader_name
      FROM pictures p
      JOIN users u ON u.user_id = p.uploader_id
      ORDER BY p.upload_time DESC
    `);
    res.json(rows);
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

    const stored = await storeImage(req.file.buffer, {
      originalName: req.file.originalname,
      folder: 'gallery',
      prefix: 'picture',
    });

    const { rows } = await pool.query(
      `INSERT INTO pictures (uploader_id, description, filename, url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uploader_id, description || null, stored.filename, stored.url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
