import { pool } from '../db.js';

// Insert an announcement row. Pass a pg client to enlist in an existing transaction;
// otherwise the default pool is used and the insert is its own implicit transaction.
export async function createAnnouncement({ title, description, user_id }, client = pool) {
  return client.query(
    `INSERT INTO announcements (title, description, user_id)
     VALUES ($1, $2, $3)
     RETURNING aid, title, description, user_id, created_at`,
    [title, description, user_id]
  );
}
