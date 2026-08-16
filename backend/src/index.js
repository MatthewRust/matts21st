import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import infoRouter from './routes/info.js';
import usersRouter from './routes/users.js';
import carsRouter from './routes/cars.js';
import picturesRouter from './routes/pictures.js';
import authRouter from './routes/auth.js';
import drinksRouter from './routes/drinks.js';
import spendingRouter from './routes/spending.js';
import announcementsRouter from './routes/announcements.js';
import leaderboardRouter from './routes/leaderboard.js';
import { startCronJobs } from './cron.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/info', infoRouter);
app.use('/api/users', usersRouter);
app.use('/api/cars', carsRouter);
app.use('/api/pictures', picturesRouter);
app.use('/api/auth', authRouter);
app.use('/api/drinks', drinksRouter);
app.use('/api/spending', spendingRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Global error handler — keeps the process alive and returns a JSON error
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message, err.stack);
  // Multer rejects oversized or non-image uploads by throwing; that's bad input,
  // not a server fault, so it must not surface as a 500.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'That image is too large' });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  startCronJobs();
});
