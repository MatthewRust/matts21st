import { renderCloudinary } from './imageUrl.js';

/**
 * Resolves a user's `profile_pic_url` to something the browser can load.
 *
 * Three shapes arrive here:
 *   - a Cloudinary URL (avatars uploaded since image storage moved off-box)
 *   - a root-relative "/uploads/…" path (avatars saved to local disk in dev,
 *     or in production before the move — those files no longer exist)
 *   - the "default_pic.png" placeholder, which is not a real file
 *
 * Only the first is transformable; the rest are returned as-is and the
 * callers' `onError` handlers fall back to the drawn SVG avatar.
 *
 * Avatars are stored at up to 2000px but never rendered larger than 112px
 * (the profile page; most are 28–40px). Serving the stored original would
 * mean downloading a full-size photo to fill a 32px circle in the navbar, on
 * every page, for every face in a feed — so ask Cloudinary for a small square
 * instead. 256px covers the largest use at 2× pixel density.
 *
 * `g_face` centres the crop on the face where one is detected, falling back to
 * the middle of the frame when none is, which beats a blind centre crop on
 * photos where the subject isn't dead centre.
 */
const AVATAR_TRANSFORM = 'w_256,h_256,c_fill,g_face,q_auto,f_auto';

export function resolveAvatar(url) {
  if (!url) return null;
  return renderCloudinary(url, AVATAR_TRANSFORM);
}
