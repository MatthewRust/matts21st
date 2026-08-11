/**
 * Request-body validation helpers.
 *
 * Each validator returns `{ ok: true, value }` with the normalised value, or
 * `{ ok: false, error }` with a message safe to hand straight back to the
 * client. Routes check `ok` and return 400 rather than letting malformed input
 * reach Postgres, where a type error would surface as an opaque 500.
 *
 * These are about correctness and error quality, not SQL safety — every query
 * in this codebase is parameterised, so values are never concatenated into SQL.
 */

const USERNAME_MIN = 2;
const USERNAME_MAX = 32;

/**
 * Letters (any script), digits, spaces and a few name-ish marks. Deliberately
 * excludes < > & " / so a username can't smuggle markup into the announcement
 * feed, which renders usernames as text alongside user-supplied descriptions.
 */
const USERNAME_RE = /^[\p{L}\p{N} ._'-]+$/u;

const PASSWORD_MIN = 8;

/**
 * bcrypt only hashes the first 72 bytes of its input and silently drops the
 * rest, which would make two different long passwords interchangeable. Reject
 * anything longer instead of relying on that truncation.
 */
const PASSWORD_MAX_BYTES = 72;

export function validateUsername(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'username must be text' };
  }
  const value = raw.trim();
  if (value.length < USERNAME_MIN) {
    return { ok: false, error: `username must be at least ${USERNAME_MIN} characters` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, error: `username must be ${USERNAME_MAX} characters or fewer` };
  }
  if (!USERNAME_RE.test(value)) {
    return { ok: false, error: 'username may only contain letters, numbers, spaces, and . _ - \'' };
  }
  return { ok: true, value };
}

/**
 * Passwords are not trimmed — leading and trailing spaces are legitimate
 * characters and stripping them would silently change what the user typed.
 */
export function validatePassword(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'password must be text' };
  }
  if (raw.length < PASSWORD_MIN) {
    return { ok: false, error: `password must be at least ${PASSWORD_MIN} characters` };
  }
  if (Buffer.byteLength(raw, 'utf8') > PASSWORD_MAX_BYTES) {
    return { ok: false, error: `password must be ${PASSWORD_MAX_BYTES} bytes or fewer` };
  }
  return { ok: true, value: raw };
}

/** Treats null, undefined and '' as "not provided" and yields null. */
export function validateOptionalInteger(raw, { field, min, max }) {
  if (raw == null || raw === '') return { ok: true, value: null };
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(value)) {
    return { ok: false, error: `${field} must be a whole number` };
  }
  if (value < min || value > max) {
    return { ok: false, error: `${field} must be between ${min} and ${max}` };
  }
  return { ok: true, value };
}

export function validateRequiredInteger(raw, { field, min, max }) {
  if (raw == null || raw === '') {
    return { ok: false, error: `${field} is required` };
  }
  return validateOptionalInteger(raw, { field, min, max });
}

/** Accepts anything `new Date()` parses; returns an ISO string or null. */
export function validateOptionalDate(raw, { field }) {
  if (raw == null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string' && !(raw instanceof Date)) {
    return { ok: false, error: `${field} must be a date` };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: `${field} is not a valid date` };
  }
  return { ok: true, value: parsed.toISOString() };
}

/** Trimmed, length-capped free text. Used for descriptions and locations. */
export function validateOptionalText(raw, { field, max }) {
  if (raw == null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string') {
    return { ok: false, error: `${field} must be text` };
  }
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > max) {
    return { ok: false, error: `${field} must be ${max} characters or fewer` };
  }
  return { ok: true, value };
}
