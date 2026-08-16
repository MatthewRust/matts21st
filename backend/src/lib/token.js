import crypto from 'node:crypto';

/**
 * Signed session tokens.
 *
 * The API previously had no way to tell who was calling: login returned a user
 * object, the browser kept it in localStorage, and nothing was sent back on
 * later requests. Any "is this your post?" check would therefore have been
 * trusting a user_id supplied by the caller, which is no check at all.
 *
 * This issues a token at login that the client returns on writes. It is a
 * plain HMAC rather than a JWT library: the payload is two numbers, so a
 * dependency (and its parsing surface) buys nothing.
 *
 * Deliberately NOT a full session system — there is no server-side store, so
 * tokens can't be revoked before they expire. For a guest list of thirty
 * people over one weekend that trade is fine; the alternative costs a table
 * and a lookup on every request.
 */

const ALGORITHM = 'sha256';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — well past the party

/**
 * Signing secret. Set AUTH_SECRET in production so tokens survive a restart;
 * without it we generate one per process, which is safe (nobody can forge a
 * token) but logs everyone out whenever the server restarts or redeploys.
 */
const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.AUTH_SECRET) {
  console.warn(
    '[auth] AUTH_SECRET is not set — using a random per-process secret. ' +
    'Sessions will not survive a restart. Set AUTH_SECRET in production.'
  );
}

/** URL-safe base64 without padding, so the token is header-friendly. */
function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signPayload(payload) {
  return b64url(crypto.createHmac(ALGORITHM, secret).update(payload).digest());
}

/** Issue a token for a user id. */
export function createToken(userId) {
  const payload = b64url(JSON.stringify({ uid: Number(userId), exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${signPayload(payload)}`;
}

/**
 * Verify a token and return its user id, or null.
 *
 * The signature is compared with timingSafeEqual so a caller can't narrow in
 * on a valid signature by measuring how long the comparison takes.
 */
export function readToken(token) {
  if (typeof token !== 'string') return null;

  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = signPayload(payload);

  // timingSafeEqual throws on length mismatch, so check that first.
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;

  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (!Number.isInteger(uid) || typeof exp !== 'number' || Date.now() > exp) return null;
    return uid;
  } catch {
    return null;
  }
}
