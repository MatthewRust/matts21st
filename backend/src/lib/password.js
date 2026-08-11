import bcrypt from 'bcryptjs';

/**
 * Password hashing.
 *
 * Cost 12 is ~250ms per hash on a small VPS — slow enough to make offline
 * cracking expensive, fast enough that nobody notices at login.
 */
const COST = 12;

/** bcrypt output is always `$2a`/`$2b`/`$2y` + 2-digit cost + 53 chars of salt+digest. */
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isHashed(value) {
  return typeof value === 'string' && BCRYPT_RE.test(value);
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

/**
 * Verify a password against a stored hash.
 *
 * Returns false — rather than throwing or falling back to a plain-text compare —
 * when the stored value isn't a bcrypt hash. A row still holding a legacy
 * plain-text password therefore fails closed; run db/hash-existing-passwords.js
 * to migrate those rows instead of re-adding a plain-text path here.
 */
export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || !isHashed(stored)) return false;
  return bcrypt.compare(plain, stored);
}
