const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Avatar paths stored in the DB are relative to the API server (e.g. "/uploads/...").
 * Prepend API_URL so the browser fetches from the right host, not the Vite dev server.
 */
export function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}
