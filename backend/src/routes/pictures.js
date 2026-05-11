import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { pool } from '../db.js';

const router = Router();
//Sets the directory/creates it if not there
const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

//a multer type that stores a unique filename and the directory to uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
//Makes a multer type that can't be more than 26Mb
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

//When getting a request if its not a file return 400 then upload the image and insert its url into the database then return 201
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { uploader_name, caption } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO pictures (uploader_name, caption, filename, url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [uploader_name || null, caption || null, req.file.filename, `/uploads/${req.file.filename}`]
  );
  res.status(201).json(rows[0]);
});

//Gets all the pictures from the db
router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM pictures ORDER BY uploaded_at DESC');
  res.json(rows);
});

export default router;
