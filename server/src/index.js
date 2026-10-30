import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import teacherRoutes from './routes/teacher.js';
import practiceRoutes from './routes/practice.js';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, database: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/teacher', teacherRoutes);
// Practice routes are mounted last: they need an approved account for everything under /api.
app.use('/api', practiceRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request was not valid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
