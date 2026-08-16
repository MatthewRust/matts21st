import { readToken } from './token.js';

/**
 * Express middleware: establishes who is calling, from the signed token issued
 * at login. Sets `req.userId` and rejects with 401 if the token is missing,
 * malformed or expired.
 *
 * Routes must take the actor from `req.userId` and never from the request
 * body — a body field is chosen by the caller, which is the whole problem this
 * exists to solve.
 */
export function requireUser(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  const userId = readToken(token);
  if (userId === null) {
    return res.status(401).json({ error: 'Please log in again' });
  }

  req.userId = userId;
  next();
}
