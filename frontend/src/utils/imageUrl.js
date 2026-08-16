const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Cloudinary applies transformations from the URL itself: the segment straight
 * after `/upload/` is a comma-separated instruction list, and it generates
 * (then caches) that rendition on first request.
 *
 * That lets the grid ask for small square crops while the lightbox asks for a
 * big one, from the same stored original — which matters here, because a grid
 * of 500 untransformed phone photos would be hundreds of megabytes over
 * Braemar mobile signal, and would burn the free tier's bandwidth allowance in
 * an afternoon.
 */
const UPLOAD_MARKER = '/image/upload/';

/**
 * Rewrite a stored picture URL to a given rendition.
 *
 * Falls through untouched for anything that isn't a Cloudinary upload URL —
 * local `/uploads/...` paths in dev get the API host prefixed instead, since
 * there's no transformation service behind them.
 *
 * @param {string} url         the `url` column from the pictures table
 * @param {string} transform   e.g. 'w_600,h_600,c_fill,q_auto,f_auto'
 */
export function renderCloudinary(url, transform) {
  if (!url) return null;

  if (url.startsWith('/')) return `${API_URL}${url}`;

  const marker = url.indexOf(UPLOAD_MARKER);
  if (marker === -1) return url;

  const head = url.slice(0, marker + UPLOAD_MARKER.length);
  const tail = url.slice(marker + UPLOAD_MARKER.length);
  return `${head}${transform}/${tail}`;
}

/**
 * Square crop for the grid. `c_fill` + `g_auto` crops to the square rather
 * than letterboxing, and picks the interesting part of the frame instead of
 * the centre — which keeps heads in shot on portrait photos.
 */
export function thumbUrl(url) {
  return renderCloudinary(url, 'w_500,h_500,c_fill,g_auto,q_auto,f_auto');
}

/** Full-frame view for the lightbox — bounded, never upscaled, aspect kept. */
export function fullUrl(url) {
  return renderCloudinary(url, 'w_1600,h_1600,c_limit,q_auto,f_auto');
}
