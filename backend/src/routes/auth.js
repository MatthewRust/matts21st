import { Router } from 'express';
import { pool } from '../db.js';
import { verifyPassword } from '../lib/password.js';
import { createToken } from '../lib/token.js';
import { rateLimit } from '../lib/rateLimit.js';

const router = Router();

/**
 * Login throttle. Ten attempts per IP per fifteen minutes — generous enough
 * that a guest fumbling their password on a phone keyboard never notices,
 * tight enough that guessing passwords over the network isn't practical.
 *
 * Applied per IP rather than per username so an attacker can't lock a specific
 * guest out of their own account by burning that username's allowance.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait a few minutes and try again.',
});

// Authenticate a user by username + password.
//
// Both "no such user" and "wrong password" return the same 401 and the same
// message so the endpoint can't be used to enumerate who is on the guest list.
router.post('/login', loginLimiter, async (req, res, next) => {
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

    // Strip the hash before returning, and issue the token the client sends
    // back on writes so the server can tell who is acting.
    const { password: _pw, ...user } = rows[0];
    res.json({ ...user, token: createToken(user.user_id) });
  } catch (err) {
    next(err);
  }
});

export default router;
