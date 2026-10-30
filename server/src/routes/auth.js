import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, signToken, wrap } from '../auth.js';

const router = Router();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

router.post('/register', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const existing = await query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
  if (existing.rowCount) return res.status(409).json({ error: 'An account with that email already exists.' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, hash],
  );
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
}));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = $1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'Account not found.' });
  res.json({ user: rows[0] });
}));

export default router;
