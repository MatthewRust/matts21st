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

// Render terminates TLS at its edge and forwards on, so without this every
// request would look like it came from the proxy — and the login rate limiter
// would throttle all guests as one bucket. `1` trusts exactly one hop (the
// platform proxy) rather than blindly believing a client-supplied
// X-Forwarded-For chain.
app.set('trust proxy', 1);

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

// Global error handler — keeps the process alive and returns a JSON error.
//
// The full error always goes to the server log; what reaches the client
// depends on whether we meant to send it. Errors carrying an explicit 4xx
// status were raised deliberately and their messages are written for the user
// ("That image is too large"), so they pass through. Anything else is an
// unexpected fault, and its message could be a Postgres error naming columns
// or a stack-adjacent detail — so the client gets a fixed string instead.
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message, err.stack);

  // Multer rejects oversized or non-image uploads by throwing; that's bad input,
  // not a server fault, so it must not surface as a 500.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'That image is too large' });
  }

  const status = err.status || err.statusCode || 500;
  const isDeliberate = status >= 400 && status < 500;

  res.status(status).json({
    error: isDeliberate && err.message ? err.message : 'Something went wrong. Please try again.',
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  startCronJobs();
});
