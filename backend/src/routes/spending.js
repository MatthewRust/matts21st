import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/spending/:id — fetch current spending total for a user
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT amount_spent FROM users WHERE user_id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/spending/:id — log a transaction and add to user's amount_spent
// Body: { amount: number, reason: string }
router.post('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const amount = Number(req.body.amount);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    await client.query('BEGIN');

    const txResult = await client.query(
      `INSERT INTO transactions (user_id, amount, reason)
       VALUES ($1, $2, $3)
       RETURNING transaction_id, user_id, amount, reason, created_at`,
      [req.params.id, amount, reason]
    );

    const userResult = await client.query(
      `UPDATE users
       SET amount_spent = amount_spent + $1
       WHERE user_id = $2
       RETURNING amount_spent`,
      [amount, req.params.id]
    );

    if (!userResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.status(201).json({
      transaction: txResult.rows[0],
      amount_spent: userResult.rows[0].amount_spent,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

export default router;
