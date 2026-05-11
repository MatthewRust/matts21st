import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();
//Gets
router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM travel_arrangements ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, mode, departure_location, departure_time, seats_available, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO travel_arrangements (name, mode, departure_location, departure_time, seats_available, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, mode, departure_location, departure_time, seats_available, notes]
  );
  res.status(201).json(rows[0]);
});

export default router;
