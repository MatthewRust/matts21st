import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { createAnnouncement } from '../lib/announce.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireUser } from '../lib/requireUser.js';
import { storeImage, imageFileFilter } from '../lib/storage.js';
import { createToken } from '../lib/token.js';
import {
  validateUsername, validatePassword, validateOptionalInteger, validateOptionalDate,
} from '../lib/validate.js';

const router = Router();

// Avatars are buffered in memory and handed to storeImage, which routes them to
// Cloudinary when it's configured and to uploads/ otherwise.
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

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

    const checkedUsername = validateUsername(username);
    if (!checkedUsername.ok) return res.status(400).json({ error: checkedUsername.error });

    const checkedPassword = validatePassword(password);
    if (!checkedPassword.ok) return res.status(400).json({ error: checkedPassword.error });

    const checkedDrinks = validateOptionalInteger(ex_drinks, { field: 'ex_drinks', min: 0, max: 1000000 });
    if (!checkedDrinks.ok) return res.status(400).json({ error: checkedDrinks.error });

    const checkedArrival = validateOptionalDate(exp_arrival_date, { field: 'exp_arrival_date' });
    if (!checkedArrival.ok) return res.status(400).json({ error: checkedArrival.error });

    const { rows } = await pool.query(
      `INSERT INTO users
         (username, password, profile_pic_url, driver, public_transport_id,
          ex_drinks, exp_arrival_date, public_transport)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${PUBLIC_COLS}`,
      [
        checkedUsername.value,
        await hashPassword(checkedPassword.value),
        profile_pic_url || 'default_pic.png',
        driver === true || driver === 'true',
        public_transport_id || null,
        checkedDrinks.value,
        checkedArrival.value,
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

    // Signup logs you straight in, so it issues a token exactly as login does —
    // otherwise a new guest couldn't post until they logged out and back in.
    res.status(201).json({ ...rows[0], token: createToken(rows[0].user_id) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    next(err);
  }
});

// Update user profile (multipart — supports optional avatar upload)
//
// You may only edit yourself. Previously this route had no authentication at
// all and accepted a new password, so a single unauthenticated request could
// take over any account.
router.patch('/:id', requireUser, uploadAvatar.single('profile_pic'), async (req, res, next) => {
  try {
    if (Number.parseInt(req.params.id, 10) !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    // Field names below are literals, never taken from the request body — the
    // dynamic SET clause built further down interpolates only these keys.
    const updates = {};

    if (req.body.username !== undefined) {
      const checked = validateUsername(req.body.username);
      if (!checked.ok) return res.status(400).json({ error: checked.error });
      updates.username = checked.value;
    }

    // An empty password means "leave it alone" (the edit form sends a blank
    // field when the user isn't changing it), not "set it to null" — the
    // column is NOT NULL, so the old behaviour turned that into a 500.
    if (req.body.password !== undefined && req.body.password !== '') {
      const checked = validatePassword(req.body.password);
      if (!checked.ok) return res.status(400).json({ error: checked.error });

      // Knowing the current password is required even though the token already
      // proves who you are: a token is a long-lived bearer credential, so a
      // borrowed phone or an unlocked laptop would otherwise be enough to
      // change the password and lock the real owner out of their own account.
      const { rows: currentRows } = await pool.query(
        'SELECT password FROM users WHERE user_id = $1',
        [req.userId]
      );
      if (!currentRows.length) return res.status(404).json({ error: 'User not found' });

      const supplied = req.body.current_password;
      if (typeof supplied !== 'string' || !supplied) {
        return res.status(400).json({ error: 'Enter your current password to change it' });
      }
      if (!(await verifyPassword(supplied, currentRows[0].password))) {
        return res.status(403).json({ error: 'Current password is incorrect' });
      }

      updates.password = await hashPassword(checked.value);
    }

    if (req.body.exp_arrival_date !== undefined) {
      const checked = validateOptionalDate(req.body.exp_arrival_date, { field: 'exp_arrival_date' });
      if (!checked.ok) return res.status(400).json({ error: checked.error });
      updates.exp_arrival_date = checked.value;
    }

    for (const key of ['public_transport', 'driver']) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key] === 'true' || req.body[key] === true;
      }
    }

    if (req.file) {
      const stored = await storeImage(req.file.buffer, {
        originalName: req.file.originalname,
        folder: 'avatars',
        prefix: 'avatar',
      });
      updates.profile_pic_url = stored.url;
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
