/**
 * Minimal in-memory rate limiter.
 *
 * Deliberately not express-rate-limit: this guards exactly one endpoint on a
 * single-instance deployment, and an in-process Map does that in a few lines
 * without another dependency to keep current.
 *
 * The trade that buys: counters live in process memory, so they reset on
 * restart and would not be shared if the API were ever scaled to more than one
 * instance. Both are fine on Render's single free instance; if this ever runs
 * multi-instance, swap in a shared store rather than trusting these numbers.
 */

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

/**
 * Fixed-window limiter.
 *
 * @param {object} opts
 * @param {number} opts.windowMs  how long a window lasts
 * @param {number} opts.max       requests allowed per key per window
 * @param {string} opts.message   response body on rejection
 */
export function rateLimit({ windowMs, max, message }) {
  return function limiter(req, res, next) {
    const now = Date.now();
    // Render sits behind a proxy, so req.ip is only meaningful with trust proxy
    // enabled (see index.js). Falls back to the socket address locally.
    const key = req.ip || req.socket?.remoteAddress || 'unknown';

    // Opportunistic sweep — without it the Map grows once per attacking IP and
    // never shrinks. Cheap because it only runs on requests to this endpoint.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }

    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: message, retry_after_seconds: retryAfter });
    }

    next();
  };
}

/** Exposed for tests — clears all counters. */
export function resetRateLimits() {
  buckets.clear();
}
