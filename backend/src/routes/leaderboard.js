import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/leaderboard
// Returns all users with both daily_drinks and total_drinks so the frontend
// can render both tabs without a second request.
// Sorted by daily_drinks desc by default; frontend re-sorts for total tab.
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, username, profile_pic_url, daily_drinks, total_drinks, ex_drinks
      FROM users
      ORDER BY daily_drinks DESC, username ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
