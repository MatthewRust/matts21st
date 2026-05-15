import { Router } from 'express';
import { pool } from '../db.js';
import { createAnnouncement } from '../lib/announce.js';

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
// Body: { title, description, user_id }
router.post('/', async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const user_id = Number(req.body.user_id);

    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });
    if (!Number.isFinite(user_id)) return res.status(400).json({ error: 'user_id is required' });

    const { rows } = await createAnnouncement({ title, description, user_id });
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
