import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import infoRouter from './routes/info.js';
import travelRouter from './routes/travel.js';
import picturesRouter from './routes/pictures.js';

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
app.use('/api/travel', travelRouter);
app.use('/api/pictures', picturesRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
