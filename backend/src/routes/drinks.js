import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/drinks/:id — fetch current drink counts for a user
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT drink_num, ex_drinks FROM users WHERE user_id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/drinks/:id — increment or decrement drink_num
// Body: { action: 'increment' | 'decrement' }
router.patch('/:id', async (req, res, next) => {
  try {
    const { action } = req.body;
    if (action !== 'increment' && action !== 'decrement') {
      return res.status(400).json({ error: 'action must be "increment" or "decrement"' });
    }

    const sql =
      action === 'increment'
        ? 'UPDATE users SET drink_num = drink_num + 1 WHERE user_id = $1 RETURNING drink_num, ex_drinks'
        : 'UPDATE users SET drink_num = GREATEST(drink_num - 1, 0) WHERE user_id = $1 RETURNING drink_num, ex_drinks';

    const { rows } = await pool.query(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
