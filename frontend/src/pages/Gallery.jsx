import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import {
  PageTransition, FadeIn, StaggerGroup, StaggerItem, motion, AnimatePresence,
} from '../components/MotionPrimitives.jsx';
import {
  inviteLabelClass, inviteButtonClass, inviteGhostButtonClass,
} from '../components/InvitationCard.jsx';
import { thumbUrl, fullUrl } from '../utils/imageUrl.js';
import UserCombobox from '../components/UserCombobox.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE_SIZE = 24;

/** Matches the backend's multer limit, so oversized files fail before upload. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatTaken(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative font-invite uppercase tracking-[0.25em] text-sm px-5 sm:px-6 py-2 transition-colors ${
        active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="gallery-tab"
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

/** Segmented-control option for the sort order. */
function SortOption({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-invite uppercase tracking-[0.2em] text-xs px-3 py-1.5 border transition-colors ${
        active
          ? 'border-ink/60 text-ink bg-parchment-deep'
          : 'border-transparent text-ink-soft hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * One photo in the grid. Rendered as a square parchment tile so a wall of
 * mixed portrait/landscape phone photos still reads as a tidy grid.
 */
function PhotoTile({ item, onOpen, canManage, onDelete, deleting }) {
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <StaggerItem>
      <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="group relative block w-full aspect-square overflow-hidden bg-parchment ring-1 ring-rule/60 shadow-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        {failed ? (
          <span className="absolute inset-0 grid place-items-center font-hand text-lg text-ink-faint px-3 text-center">
            Couldn't load
          </span>
        ) : (
          <img
            src={thumbUrl(item.url)}
            alt={item.description || `Photo by ${item.uploader_name}`}
            /* Native lazy-loading: with several hundred tiles the browser only
               fetches what's near the viewport, which is the difference
               between a usable page and a stalled one on mobile data. */
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}

        {/* Caption veil, only on hover/focus so the grid stays clean */}
        <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-stone-950/80 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <span className="block font-hand text-base text-parchment truncate text-left">
            {item.uploader_name}
          </span>
        </span>
      </button>

      {/* Remove control, overlaid rather than nested inside the tile button —
          a button inside a button is invalid HTML and the click would open the
          lightbox on the way through. Two-step, since there's no undo. */}
      {canManage && (
        <div className="absolute top-1.5 right-1.5">
          {confirming ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onDelete(item.picture_id)}
                disabled={deleting}
                className="font-invite uppercase tracking-[0.15em] text-[0.6rem] px-2 py-1 bg-seal text-parchment hover:bg-seal-deep transition-colors disabled:opacity-60"
              >
                {deleting ? '…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="font-invite uppercase tracking-[0.15em] text-[0.6rem] px-2 py-1 bg-stone-900/80 text-parchment hover:bg-stone-900 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Remove this photo"
              title="Remove this photo"
              className="p-1.5 bg-stone-950/70 text-parchment hover:bg-seal transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.5 4.5h11" />
                <path d="M6.5 4.5V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5" />
                <path d="M4 4.5l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8" />
                <path d="M6.8 7v4M9.2 7v4" />
              </svg>
            </button>
          )}
        </div>
      )}
      </div>
    </StaggerItem>
  );
}

/** Full-screen viewer. Closes on backdrop click or Escape. */
function Lightbox({ item, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.description || 'Photo'}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-5 text-4xl leading-none font-invite text-parchment/80 hover:text-parchment"
      >
        ×
      </button>

      <motion.img
        key={item.picture_id}
        src={fullUrl(item.url)}
        alt={item.description || `Photo by ${item.uploader_name}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="max-h-[78vh] max-w-full object-contain shadow-lift"
      />

      <div
        className="mt-4 max-w-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.description && (
          <p className="font-hand text-2xl text-parchment mb-1 break-words">{item.description}</p>
        )}
        <p className="eyebrow text-parchment/70">
          {item.uploader_name} · {formatTaken(item.upload_time)}
        </p>
      </div>

      <div className="mt-5 flex gap-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onPrev} className={inviteGhostButtonClass + ' !text-parchment !border-parchment/40'}>
          Previous
        </button>
        <button onClick={onNext} className={inviteGhostButtonClass + ' !text-parchment !border-parchment/40'}>
          Next
        </button>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const { user, authHeader } = useAuth();
  const [tab, setTab] = useState('gallery');

  // Manage mode reveals a remove control on the viewer's own photos. Off by
  // default so the grid stays a grid.
  const [managing, setManaging] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [openIndex, setOpenIndex] = useState(null);

  // Filters. Both are applied server-side, so changing either restarts
  // pagination from offset 0 rather than filtering the loaded page.
  const [sort, setSort] = useState('newest');
  const [uploaderId, setUploaderId] = useState(null);
  const [uploaders, setUploaders] = useState([]);

  // Upload state. Files are queued and sent one at a time — see handleUpload.
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, of: 0 });
  const [uploadError, setUploadError] = useState(null);
  const [uploadNote, setUploadNote] = useState(null);

  /** Builds a list URL carrying the current filters, for any page offset. */
  const picturesUrl = useCallback(
    (offset) => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort,
      });
      if (uploaderId != null) params.set('uploader_id', String(uploaderId));
      return `${API_URL}/api/pictures?${params.toString()}`;
    },
    [sort, uploaderId]
  );

  const fetchFirstPage = useCallback(() => {
    setLoading(true);
    return fetch(picturesUrl(0))
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data) => { setItems(data.items || []); setTotal(data.total || 0); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [picturesUrl]);

  // Refetches whenever a filter changes, since picturesUrl is rebuilt then.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(picturesUrl(0))
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [picturesUrl]);

  /** Who has posted, for the filter list. Refreshed after a successful upload. */
  const fetchUploaders = useCallback(() => {
    return fetch(`${API_URL}/api/pictures/uploaders`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUploaders(Array.isArray(data) ? data : []))
      // A failed uploader list only costs the filter dropdown, so it must not
      // surface as a page-level error over the grid.
      .catch(() => {});
  }, []);

  useEffect(() => { fetchUploaders(); }, [fetchUploaders]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(picturesUrl(items.length));
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.items || [])]);
      setTotal(data.total ?? total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function pickFiles(fileList) {
    setUploadError(null);
    setUploadNote(null);

    const chosen = Array.from(fileList || []);
    const tooBig = chosen.filter((f) => f.size > MAX_FILE_BYTES);
    const ok = chosen.filter((f) => f.size <= MAX_FILE_BYTES);

    if (tooBig.length) {
      setUploadNote(
        `${tooBig.length} file${tooBig.length > 1 ? 's were' : ' was'} over 10MB and skipped.`
      );
    }
    setFiles(ok);
  }

  /**
   * Uploads the queue one file at a time rather than in parallel.
   *
   * Sequential is deliberate: a guest selecting 30 photos on a phone would
   * otherwise fire 30 simultaneous multipart requests, which mobile networks
   * handle badly and which gives no usable progress signal. One at a time is
   * slower in theory but far more reliable, and lets us report "4 of 30".
   *
   * A failure part-way keeps the successful uploads — they're already saved —
   * and reports how many didn't make it.
   */
  async function handleUpload(e) {
    e.preventDefault();
    if (uploading || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadNote(null);
    setProgress({ done: 0, of: files.length });

    const failures = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const body = new FormData();
      body.append('image', file);
      // No uploader_id — the server takes it from the token.
      // The caption applies to the batch; sending it per-file keeps the
      // backend contract unchanged (one description column per picture).
      if (description.trim()) body.append('description', description.trim());

      try {
        const res = await fetch(`${API_URL}/api/pictures`, {
          method: 'POST',
          headers: { ...authHeader },
          body,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Server returned ${res.status}`);
        }
      } catch (err) {
        failures.push(`${file.name}: ${err.message}`);
      }
      setProgress({ done: i + 1, of: files.length });
    }

    setUploading(false);

    if (failures.length === files.length) {
      setUploadError(failures[0]);
      return;
    }

    if (failures.length) {
      setUploadNote(`${failures.length} of ${files.length} didn't upload. ${failures[0]}`);
    }

    setFiles([]);
    setDescription('');
    fetchUploaders();

    // Make sure the new photos are actually visible. If a filter was hiding
    // them, clearing it triggers the refetch effect; otherwise refresh in place.
    if (sort !== 'newest' || uploaderId !== null) {
      setSort('newest');
      setUploaderId(null);
    } else {
      await fetchFirstPage();
    }
    setTab('gallery');
  }

  /**
   * Delete one of your own photos.
   *
   * Removes the tile from local state rather than refetching, so the reader
   * keeps their scroll position and any extra pages they've loaded. `total`
   * follows so "load more" stays honest, and the uploader counts are
   * refreshed since one of them just changed.
   */
  async function handleDeletePhoto(pictureId) {
    if (deletingId) return;
    setDeleteError(null);
    setDeletingId(pictureId);
    try {
      const res = await fetch(`${API_URL}/api/pictures/${pictureId}`, {
        method: 'DELETE',
        headers: { ...authHeader },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      setItems((prev) => prev.filter((i) => i.picture_id !== pictureId));
      setTotal((t) => Math.max(0, t - 1));
      setOpenIndex(null);
      fetchUploaders();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const closeLightbox = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length]
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length]
  );

  const hasMore = items.length < total;
  const selectedUploaderName = uploaders.find((u) => u.user_id === uploaderId)?.username;
  const ownPhotosLoaded = items.filter((i) => i.uploader_id === user?.user_id).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-5xl w-full mx-auto mb-8">
            <InvitationPanel variant="hero" className="text-center">
              <h1 className="font-invite text-display text-ink">Gallery</h1>
              <div className="hairline-gold w-32 mx-auto my-5" />
              {/* `total` reflects the active filter, so say so rather than
                  implying a filtered count is the whole gallery. */}
              <p className="font-hand text-2xl text-ink-soft">
                {total === 0
                  ? '— the weekend, as it happened —'
                  : uploaderId != null && selectedUploaderName
                    ? `— ${total} from ${selectedUploaderName} —`
                    : `— ${total} photo${total === 1 ? '' : 's'} so far —`}
              </p>

              <div className="flex justify-center gap-2 mt-8 border-b border-rule/60">
                <Tab label="Gallery" active={tab === 'gallery'} onClick={() => setTab('gallery')} />
                <Tab label="Upload" active={tab === 'upload'} onClick={() => setTab('upload')} />
              </div>
            </InvitationPanel>
          </FadeIn>

          <div className="max-w-5xl w-full mx-auto">
            <AnimatePresence mode="wait">

              {tab === 'upload' && (
                <motion.form
                  key="upload"
                  onSubmit={handleUpload}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <InvitationPanel variant="card" tilt={0.3} className="space-y-6 max-w-2xl mx-auto">
                    <div>
                      <label htmlFor="gallery-files" className={inviteLabelClass}>
                        Photos
                      </label>
                      <input
                        id="gallery-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => pickFiles(e.target.files)}
                        className="w-full font-hand text-xl text-ink file:font-invite file:uppercase file:tracking-[0.2em] file:text-xs file:bg-seal file:text-parchment file:border-0 file:px-5 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-seal-deep"
                      />
                    </div>

                    {files.length > 0 && (
                      <div>
                        <p className={inviteLabelClass}>{files.length} selected</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {files.slice(0, 12).map((f, i) => (
                            <div key={`${f.name}-${i}`} className="aspect-square overflow-hidden ring-1 ring-rule/60">
                              <img
                                src={URL.createObjectURL(f)}
                                alt=""
                                /* Revoked once shown — otherwise each preview
                                   pins its full file in memory, which adds up
                                   fast when someone selects 30 photos. */
                                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {files.length > 12 && (
                            <div className="aspect-square grid place-items-center font-hand text-lg text-ink-soft ring-1 ring-rule/60">
                              +{files.length - 12}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="gallery-desc" className={inviteLabelClass}>
                        Caption (optional)
                      </label>
                      <textarea
                        id="gallery-desc"
                        rows={2}
                        maxLength={300}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Where, when, who…"
                        className="w-full bg-transparent border border-ink/30 focus:border-ink focus:outline-none focus:ring-0 font-hand text-2xl text-ink px-3 py-2 transition-colors"
                      />
                      {files.length > 1 && (
                        <p className="font-hand text-lg text-ink-soft mt-1">
                          Applied to all {files.length} photos.
                        </p>
                      )}
                    </div>

                    {uploadNote && (
                      <p className="font-hand text-xl text-ink-soft text-center">{uploadNote}</p>
                    )}
                    {uploadError && (
                      <p className="font-hand text-xl text-seal text-center">{uploadError}</p>
                    )}

                    <div className="flex justify-center pt-1">
                      <button type="submit" disabled={uploading || files.length === 0} className={inviteButtonClass}>
                        {uploading
                          ? `Uploading ${progress.done} of ${progress.of}…`
                          : `Add ${files.length || ''} photo${files.length === 1 ? '' : 's'}`.replace('  ', ' ')}
                      </button>
                    </div>
                  </InvitationPanel>
                </motion.form>
              )}

              {tab === 'gallery' && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Filter bar. Hidden until there is something to filter —
                      an empty gallery with sort controls reads as broken. */}
                  {(items.length > 0 || uploaderId !== null) && (
                    <InvitationPanel variant="strip" className="mb-5">
                      <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8">
                        <div className="shrink-0">
                          <p className={inviteLabelClass}>Order</p>
                          <div className="flex gap-1 -ml-1">
                            <SortOption
                              label="Newest"
                              active={sort === 'newest'}
                              onClick={() => setSort('newest')}
                            />
                            <SortOption
                              label="Oldest"
                              active={sort === 'oldest'}
                              onClick={() => setSort('oldest')}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className={inviteLabelClass} htmlFor="gallery-uploader">
                            Taken by
                          </label>
                          <UserCombobox
                            users={uploaders}
                            value={uploaderId}
                            onChange={setUploaderId}
                          />
                        </div>

                        {/* Only offered once the viewer has a photo in view,
                            so it never appears with nothing to act on. */}
                        {ownPhotosLoaded > 0 && (
                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() => { setManaging((m) => !m); setDeleteError(null); }}
                              aria-pressed={managing}
                              className={`inline-flex items-center gap-2 font-invite uppercase tracking-[0.2em] text-[0.7rem] px-3 py-1.5 border transition-colors ${
                                managing
                                  ? 'border-ink/60 text-ink bg-parchment-deep'
                                  : 'border-ink/25 text-ink-soft hover:text-ink'
                              }`}
                            >
                              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11.2 2.6a1.4 1.4 0 0 1 2 2L6 11.8l-2.7.9.9-2.7z" />
                              </svg>
                              {managing ? 'Done' : 'Edit mine'}
                            </button>
                          </div>
                        )}
                      </div>
                    </InvitationPanel>
                  )}

                  {deleteError && (
                    <p className="font-hand text-xl text-red-200 text-center pb-3 drop-shadow">{deleteError}</p>
                  )}

                  {loading && (
                    <p className="font-hand text-2xl text-parchment text-center py-12 drop-shadow">
                      Loading…
                    </p>
                  )}
                  {error && (
                    <p className="font-hand text-xl text-red-200 text-center py-8 drop-shadow">{error}</p>
                  )}
                  {!loading && !error && items.length === 0 && (
                    <InvitationPanel variant="card" className="text-center max-w-lg mx-auto">
                      <p className="font-hand text-2xl text-ink-soft">
                        {uploaderId != null
                          ? `Nothing from ${selectedUploaderName ?? 'them'} yet.`
                          : 'No photos yet — be the first.'}
                      </p>
                      <div className="flex justify-center mt-5">
                        {uploaderId != null ? (
                          <button type="button" onClick={() => setUploaderId(null)} className={inviteButtonClass}>
                            Show everyone
                          </button>
                        ) : (
                          <button type="button" onClick={() => setTab('upload')} className={inviteButtonClass}>
                            Upload a photo
                          </button>
                        )}
                      </div>
                    </InvitationPanel>
                  )}

                  {items.length > 0 && (
                    <StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {items.map((item, i) => (
                        <PhotoTile
                          key={item.picture_id}
                          item={item}
                          onOpen={() => setOpenIndex(i)}
                          // Only your own photos get a control. The server
                          // enforces this too — this just avoids showing a
                          // button that would always fail.
                          canManage={managing && item.uploader_id === user?.user_id}
                          onDelete={handleDeletePhoto}
                          deleting={deletingId === item.picture_id}
                        />
                      ))}
                    </StaggerGroup>
                  )}

                  {hasMore && (
                    <div className="flex justify-center pt-8 pb-4">
                      <button type="button" onClick={loadMore} disabled={loadingMore} className={inviteButtonClass}>
                        {loadingMore ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {openIndex !== null && items[openIndex] && (
            <Lightbox
              key="lightbox"
              item={items[openIndex]}
              onClose={closeLightbox}
              onPrev={showPrev}
              onNext={showNext}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
