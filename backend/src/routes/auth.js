import { Router } from 'express';
import { pool } from '../db.js';
import { verifyPassword } from '../lib/password.js';

const router = Router();

// Authenticate a user by username + password.
//
// Both "no such user" and "wrong password" return the same 401 and the same
// message so the endpoint can't be used to enumerate who is on the guest list.
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const { rows } = await pool.query(
      `SELECT user_id, username, password, profile_pic_url, driver, car_id, public_transport_id
       FROM users WHERE username = $1`,
      [username.trim()]
    );

    const stored = rows[0]?.password;
    const valid = rows.length > 0 && await verifyPassword(password, stored);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Strip the hash before returning
    const { password: _pw, ...user } = rows[0];
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
