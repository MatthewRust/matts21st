import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// List all cars with driver info and passengers (excluding the driver themselves)
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        u.username        AS driver_name,
        u.profile_pic_url AS driver_profile_pic_url,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id',         p.user_id,
              'username',        p.username,
              'profile_pic_url', p.profile_pic_url
            )
          ) FILTER (WHERE p.user_id IS NOT NULL AND p.user_id <> c.driver_id),
          '[]'
        ) AS passengers
      FROM cars c
      JOIN users u       ON u.user_id = c.driver_id
      LEFT JOIN users p  ON p.car_id  = c.car_id
      GROUP BY c.car_id, u.username, u.profile_pic_url
      ORDER BY c.car_id ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get single car
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.username AS driver_name
       FROM cars c JOIN users u ON u.user_id = c.driver_id
       WHERE c.car_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Car not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create a car (driver_id must exist and have driver = true)
router.post('/', async (req, res, next) => {
  const { driver_id, max_num_passenger, description, departure_time, departure_location } = req.body;
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
      `INSERT INTO cars (driver_id, max_num_passenger, description, departure_time, departure_location)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [driver_id, max_num_passenger, description || null, departure_time || null, departure_location || null]
    );
    const car = rows[0];

    // Link car back to the user
    await client.query('UPDATE users SET car_id = $1 WHERE user_id = $2', [car.car_id, driver_id]);

    await client.query('COMMIT');
    res.status(201).json(car);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Edit car details
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['max_num_passenger', 'description', 'departure_time', 'departure_location'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'max_num_passenger') {
          updates[key] = Number(req.body[key]);
        } else {
          updates[key] = req.body[key] === '' ? null : req.body[key];
        }
      }
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values   = [...Object.values(updates), req.params.id];

    const { rows } = await pool.query(
      `UPDATE cars SET ${setClause} WHERE car_id = $${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Car not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Join a car as a passenger. If the user is already in a different car, they're
// silently switched (old car's passenger count is decremented). Drivers cannot
// join other cars — they own their own.
router.post('/:id/join', async (req, res, next) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const newCarId = Number(req.params.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the target car
    const { rows: carRows } = await client.query(
      'SELECT * FROM cars WHERE car_id = $1 FOR UPDATE',
      [newCarId]
    );
    if (!carRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Car not found' });
    }
    const car = carRows[0];

    // Lock the joining user
    const { rows: userRows } = await client.query(
      'SELECT user_id, car_id, driver FROM users WHERE user_id = $1 FOR UPDATE',
      [user_id]
    );
    if (!userRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const joining = userRows[0];

    if (joining.driver) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Drivers cannot join other cars' });
    }
    if (joining.car_id === newCarId) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Already in this car' });
    }
    if (car.current_num_passenger >= car.max_num_passenger) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Car is full' });
    }

    // If user was already in a different car, lock and decrement that car
    if (joining.car_id) {
      await client.query(
        'SELECT 1 FROM cars WHERE car_id = $1 FOR UPDATE',
        [joining.car_id]
      );
      await client.query(
        'UPDATE cars SET current_num_passenger = GREATEST(current_num_passenger - 1, 0) WHERE car_id = $1',
        [joining.car_id]
      );
    }

    // Increment the new car and link the user to it
    await client.query(
      'UPDATE cars SET current_num_passenger = current_num_passenger + 1 WHERE car_id = $1',
      [newCarId]
    );
    await client.query(
      'UPDATE users SET car_id = $1 WHERE user_id = $2',
      [newCarId, user_id]
    );

    await client.query('COMMIT');

    const { rows } = await pool.query('SELECT * FROM cars WHERE car_id = $1', [newCarId]);
    res.json({ car: rows[0], user: { user_id: joining.user_id, car_id: newCarId } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Leave the given car (if the user is currently in it)
router.post('/:id/leave', async (req, res, next) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const carId = Number(req.params.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: carRows } = await client.query(
      'SELECT * FROM cars WHERE car_id = $1 FOR UPDATE',
      [carId]
    );
    if (!carRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Car not found' });
    }

    const { rows: userRows } = await client.query(
      'SELECT car_id FROM users WHERE user_id = $1 FOR UPDATE',
      [user_id]
    );
    if (!userRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    if (userRows[0].car_id !== carId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User is not in this car' });
    }

    await client.query(
      'UPDATE cars SET current_num_passenger = GREATEST(current_num_passenger - 1, 0) WHERE car_id = $1',
      [carId]
    );
    await client.query('UPDATE users SET car_id = NULL WHERE user_id = $1', [user_id]);

    await client.query('COMMIT');

    const { rows } = await pool.query('SELECT * FROM cars WHERE car_id = $1', [carId]);
    res.json({ car: rows[0], user: { user_id: Number(user_id), car_id: null } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
