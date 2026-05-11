import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// List all users (passwords excluded)
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT user_id, username, profile_pic_url, driver, car_id, public_transport_id FROM users ORDER BY user_id ASC'
  );
  res.json(rows);
});

// Get single user
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT user_id, username, profile_pic_url, driver, car_id, public_transport_id FROM users WHERE user_id = $1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// Create user
router.post('/', async (req, res) => {
  const { username, password, profile_pic_url, driver = false, public_transport_id } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO users (username, password, profile_pic_url, driver, public_transport_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, profile_pic_url, driver, car_id, public_transport_id`,
    [username, password, profile_pic_url || 'default_pic.png', driver, public_transport_id || null]
  );
  res.status(201).json(rows[0]);
});

export default router;
