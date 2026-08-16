import { Router } from 'express';
import { pool } from '../db.js';
import { createAnnouncement } from '../lib/announce.js';
import { requireUser } from '../lib/requireUser.js';

const router = Router();

// GET /api/announcements?limit=5&offset=0
// Returns { items, total } — newest first
router.get('/', async (req, res, next) => {
  try {
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const offsetRaw = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 5;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const itemsPromise = pool.query(
      `SELECT a.aid, a.title, a.description, a.created_at,
              a.user_id, u.username, u.profile_pic_url
       FROM announcements a
       JOIN users u ON u.user_id = a.user_id
       ORDER BY a.created_at DESC, a.aid DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const totalPromise = pool.query('SELECT COUNT(*)::int AS total FROM announcements');

    const [itemsResult, totalResult] = await Promise.all([itemsPromise, totalPromise]);
    res.json({ items: itemsResult.rows, total: totalResult.rows[0].total });
  } catch (err) {
    next(err);
  }
});

// POST /api/announcements — create an announcement
// Body: { title, description }
//
// The author is taken from the signed token, never from the body. A body field
// is chosen by the caller, so trusting it would let anyone post as anyone.
router.post('/', requireUser, async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';

    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });

    const { rows } = await createAnnouncement({ title, description, user_id: req.userId });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id — remove one of your own posts.
//
// Ownership is enforced in the WHERE clause rather than by reading the row
// first and comparing: one statement, so there's no window between the check
// and the delete, and a post belonging to someone else simply matches nothing.
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const aid = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(aid)) return res.status(400).json({ error: 'Invalid announcement id' });

    const { rows } = await pool.query(
      'DELETE FROM announcements WHERE aid = $1 AND user_id = $2 RETURNING aid',
      [aid, req.userId]
    );

    if (!rows.length) {
      // Deliberately the same response whether the post is missing or simply
      // isn't theirs — otherwise this doubles as a way to probe what exists.
      return res.status(404).json({ error: 'No such post of yours' });
    }

    res.json({ deleted: rows[0].aid });
  } catch (err) {
    next(err);
  }
});

export default router;
