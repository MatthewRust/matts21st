import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { pool } from '../db.js';
import { createAnnouncement } from '../lib/announce.js';

const router = Router();

// Ensure uploads directory exists for avatar uploads
const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const PUBLIC_COLS = [
  'user_id', 'username', 'profile_pic_url', 'driver', 'car_id',
  'public_transport_id', 'public_transport', 'exp_arrival_date',
  'ex_drinks', 'daily_drinks', 'total_drinks', 'amount_spent',
].join(', ');

// List all users (passwords excluded)
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${PUBLIC_COLS} FROM users ORDER BY user_id ASC`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get single user
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLS} FROM users WHERE user_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create user
router.post('/', async (req, res, next) => {
  try {
    const {
      username, password, profile_pic_url, driver = false,
      public_transport_id, ex_drinks, exp_arrival_date, public_transport = false,
    } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO users
         (username, password, profile_pic_url, driver, public_transport_id,
          ex_drinks, exp_arrival_date, public_transport)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${PUBLIC_COLS}`,
      [
        username,
        password,
        profile_pic_url || 'default_pic.png',
        driver,
        public_transport_id || null,
        ex_drinks != null ? Number(ex_drinks) : null,
        exp_arrival_date || null,
        public_transport === true || public_transport === 'true',
      ]
    );
    // Announce the new guest. Don't let an announcement failure poison signup.
    try {
      await createAnnouncement({
        title: 'A new guest arrives',
        description: `${rows[0].username} has joined the party.`,
        user_id: rows[0].user_id,
      });
    } catch (annErr) {
      console.error('[announce signup]', annErr.message);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    next(err);
  }
});

// Update user profile (multipart — supports optional avatar upload)
router.patch('/:id', uploadAvatar.single('profile_pic'), async (req, res, next) => {
  try {
    const allowed = ['username', 'password', 'exp_arrival_date', 'public_transport', 'driver'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'public_transport' || key === 'driver') {
          updates[key] = req.body[key] === 'true' || req.body[key] === true;
        } else if (key === 'exp_arrival_date') {
          updates[key] = req.body[key] === '' ? null : req.body[key];
        } else {
          updates[key] = req.body[key] === '' ? null : req.body[key];
        }
      }
    }

    if (req.file) {
      updates.profile_pic_url = `/uploads/${req.file.filename}`;
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // If toggling driver off, we need to delete this user's car as well as
    // update them — wrap both in a transaction. The FK ON DELETE SET NULL
    // cascade will clear users.car_id on the driver and any passengers.
    const shouldDeleteCar = updates.driver === false;

    const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
    const values   = [...Object.values(updates), req.params.id];

    let rows;
    if (shouldDeleteCar) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM cars WHERE driver_id = $1', [req.params.id]);
        const result = await client.query(
          `UPDATE users SET ${setClause} WHERE user_id = $${values.length} RETURNING ${PUBLIC_COLS}`,
          values
        );
        rows = result.rows;
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    } else {
      const result = await pool.query(
        `UPDATE users SET ${setClause} WHERE user_id = $${values.length} RETURNING ${PUBLIC_COLS}`,
        values
      );
      rows = result.rows;
    }

    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    next(err);
  }
});

export default router;
