/**
 * One-off migration: bring the `event_info` rows shown on the homepage up to
 * date with the real event details, and drop the placeholder rows.
 *
 * `db/init.sql` only runs when the database volume is first created, so an
 * already-seeded database keeps its original "TBD" rows until this has run.
 * Safe to run more than once — it upserts by title.
 *
 * Run against the same DATABASE_URL the API uses:
 *
 *   docker compose exec backend node db/sync-event-info.js
 */
import 'dotenv/config';
import { pool } from '../src/db.js';

// The rows the homepage should show, in display order.
const ROWS = [
  { title: 'When', body: 'Thursday 3rd September 2026.', display_order: 1 },
  { title: 'Where', body: 'Viewmount, Braemar, Ballater AB35 5YT.', display_order: 2 },
];

// Placeholder rows that no longer belong on the page.
const REMOVE = ['Dress code'];

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of ROWS) {
      const { rowCount } = await client.query(
        'UPDATE event_info SET body = $1, display_order = $2 WHERE title = $3',
        [row.body, row.display_order, row.title]
      );
      if (rowCount === 0) {
        await client.query(
          'INSERT INTO event_info (title, body, display_order) VALUES ($1, $2, $3)',
          [row.title, row.body, row.display_order]
        );
        console.log(`  added    ${row.title}`);
      } else {
        console.log(`  updated  ${row.title}`);
      }
    }

    for (const title of REMOVE) {
      const { rowCount } = await client.query('DELETE FROM event_info WHERE title = $1', [title]);
      if (rowCount > 0) console.log(`  removed  ${title}`);
    }

    await client.query('COMMIT');
    console.log('\nDone — event_info is up to date.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
});
