import jwt from 'jsonwebtoken';

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in server/.env');
  return process.env.JWT_SECRET;
};

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name }, secret(), { expiresIn: '7d' });
}

// Rejects the request unless it carries a valid "Authorization: Bearer <token>" header.
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    const payload = jwt.verify(token, secret());
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

// Lets Express 4 pass errors from async route handlers to the error handler.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
