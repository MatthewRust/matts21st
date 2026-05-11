import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Authenticate a user by username + password (plain text — see context.md known gaps)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const { rows } = await pool.query(
    `SELECT user_id, username, password, profile_pic_url, driver, car_id, public_transport_id
     FROM users WHERE username = $1`,
    [username]
  );

  if (!rows.length || rows[0].password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Strip password before returning
  const { password: _pw, ...user } = rows[0];
  res.json(user);
});

export default router;
