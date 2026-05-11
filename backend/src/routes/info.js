import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Grabs all the events
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM event_info ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
