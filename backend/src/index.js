import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import infoRouter from './routes/info.js';
import usersRouter from './routes/users.js';
import carsRouter from './routes/cars.js';
import picturesRouter from './routes/pictures.js';
import authRouter from './routes/auth.js';

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

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
