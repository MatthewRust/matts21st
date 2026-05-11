import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/leaderboard — all users ordered by drink_num desc, then username asc
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, username, profile_pic_url, drink_num, ex_drinks
      FROM users
      ORDER BY drink_num DESC, username ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
