import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const PUBLIC_COLS = 'user_id, username, profile_pic_url, driver, car_id, public_transport_id, drink_num, ex_drinks';

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
    const { username, password, profile_pic_url, driver = false, public_transport_id, ex_drinks } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO users (username, password, profile_pic_url, driver, public_transport_id, ex_drinks)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PUBLIC_COLS}`,
      [
        username,
        password,
        profile_pic_url || 'default_pic.png',
        driver,
        public_transport_id || null,
        ex_drinks != null ? Number(ex_drinks) : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    next(err);
  }
});

export default router;
