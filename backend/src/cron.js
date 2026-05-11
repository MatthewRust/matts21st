import cron from 'node-cron';
import { pool } from './db.js';

/**
 * Daily rollover — runs at 23:59:59 every night.
 *
 * For every user:
 *   total_drinks += daily_drinks
 *   daily_drinks  = 0
 */
export function startCronJobs() {
  // node-cron 6-field format: second minute hour dom month dow
  cron.schedule('59 59 23 * * *', async () => {
    console.log('[cron] Running daily drink rollover…');
    try {
      const result = await pool.query(`
        UPDATE users
        SET total_drinks = total_drinks + daily_drinks,
            daily_drinks = 0
      `);
      console.log(`[cron] Rollover complete — ${result.rowCount} user(s) updated.`);
    } catch (err) {
      console.error('[cron] Rollover failed:', err.message);
    }
  });

  console.log('[cron] Daily rollover scheduled for 23:59:59.');
}
