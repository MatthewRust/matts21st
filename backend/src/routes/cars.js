import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// List all cars with driver info
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, u.username AS driver_name
    FROM cars c
    JOIN users u ON u.user_id = c.driver_id
    ORDER BY c.car_id ASC
  `);
  res.json(rows);
});

// Get single car
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.username AS driver_name
     FROM cars c JOIN users u ON u.user_id = c.driver_id
     WHERE c.car_id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Car not found' });
  res.json(rows[0]);
});

// Create a car (driver_id must exist and have driver = true)
router.post('/', async (req, res) => {
  const { driver_id, max_num_passenger, description } = req.body;
  if (!driver_id || !max_num_passenger) {
    return res.status(400).json({ error: 'driver_id and max_num_passenger are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      'SELECT driver FROM users WHERE user_id = $1',
      [driver_id]
    );
    if (!userRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    if (!userRows[0].driver) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User is not marked as a driver' });
    }

    const { rows } = await client.query(
      `INSERT INTO cars (driver_id, max_num_passenger, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [driver_id, max_num_passenger, description || null]
    );
    const car = rows[0];

    // Link car back to the user
    await client.query('UPDATE users SET car_id = $1 WHERE user_id = $2', [car.car_id, driver_id]);

    await client.query('COMMIT');
    res.status(201).json(car);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Join a car as a passenger (increments current_num_passenger, links user)
router.post('/:id/join', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: carRows } = await client.query(
      'SELECT * FROM cars WHERE car_id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!carRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Car not found' });
    }
    const car = carRows[0];
    if (car.current_num_passenger >= car.max_num_passenger) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Car is full' });
    }

    await client.query(
      'UPDATE cars SET current_num_passenger = current_num_passenger + 1 WHERE car_id = $1',
      [req.params.id]
    );
    await client.query('UPDATE users SET car_id = $1 WHERE user_id = $2', [req.params.id, user_id]);

    await client.query('COMMIT');
    const { rows } = await pool.query('SELECT * FROM cars WHERE car_id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
