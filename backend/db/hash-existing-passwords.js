/**
 * One-off migration: replace any plain-text passwords in `users` with bcrypt hashes.
 *
 * Login is bcrypt-only, so rows still holding plain text will fail to
 * authenticate until this has run. Safe to run more than once — rows that
 * already hold a bcrypt hash are skipped.
 *
 * Run against the same DATABASE_URL the API uses:
 *
 *   docker compose exec backend node db/hash-existing-passwords.js
 *
 * Note this necessarily reads existing plain-text passwords in order to hash
 * them. It never logs their values.
 */
import 'dotenv/config';
import { pool } from '../src/db.js';
import { hashPassword, isHashed } from '../src/lib/password.js';

async function main() {
  const client = await pool.connect();
  let hashed = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT user_id, username, password FROM users ORDER BY user_id ASC FOR UPDATE'
    );

    for (const row of rows) {
      if (isHashed(row.password)) {
        skipped += 1;
        continue;
      }
      await client.query('UPDATE users SET password = $1 WHERE user_id = $2', [
        await hashPassword(row.password),
        row.user_id,
      ]);
      console.log(`  hashed  ${row.username} (user_id ${row.user_id})`);
      hashed += 1;
    }

    await client.query('COMMIT');
    console.log(`\nDone — ${hashed} hashed, ${skipped} already hashed.`);
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
