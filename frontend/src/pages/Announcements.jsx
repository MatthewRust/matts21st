import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import {
  PageTransition, FadeIn, StaggerGroup, StaggerItem, motion, AnimatePresence,
} from '../components/MotionPrimitives.jsx';
import {
  inviteLabelClass, inviteButtonClass, inviteInputClass,
} from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE_SIZE = 5;

function Avatar({ user, size = 'w-10 h-10', ring = 'ring-2 ring-rule/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-paper`}>
      {!err && src ? (
        <img src={src} alt={user?.username ?? 'Avatar'} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
          <circle cx="40" cy="30" r="14" fill="#a89070" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
        </svg>
      )}
    </div>
  );
}

function formatPosted(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function AnnouncementCard({ item, tilt, canManage, onDelete, deleting }) {
  const author = { username: item.username, profile_pic_url: item.profile_pic_url };
  const [confirming, setConfirming] = useState(false);

  return (
    <StaggerItem>
      <InvitationPanel variant="card" tilt={tilt} className="mb-5 overflow-hidden">
        <header className="flex items-center gap-3 mb-4">
          <Avatar user={author} />
          <div className="flex-1 min-w-0">
            <p className="font-invite text-xl text-ink truncate">{item.username}</p>
            <p className="eyebrow">Posted {formatPosted(item.created_at)}</p>
          </div>

          {/* Two-step delete. A single tap would be too easy to hit by accident
              on a phone, and there's no undo once the row is gone. */}
          {canManage && (
            confirming ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onDelete(item.aid)}
                  disabled={deleting}
                  className="font-invite uppercase tracking-[0.2em] text-[0.7rem] px-3 py-1.5 bg-seal text-parchment hover:bg-seal-deep transition-colors disabled:opacity-60"
                >
                  {deleting ? 'Removing…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="font-invite uppercase tracking-[0.2em] text-[0.7rem] px-3 py-1.5 text-ink-soft hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="Remove this post"
                title="Remove this post"
                className="shrink-0 p-2 -mr-1 text-ink-soft hover:text-seal transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 4.5h11" />
                  <path d="M6.5 4.5V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5" />
                  <path d="M4 4.5l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8" />
                  <path d="M6.8 7v4M9.2 7v4" />
                </svg>
              </button>
            )
          )}
        </header>
        {/* break-words so a long unbroken word (or a pasted URL) wraps inside
            the parchment instead of spilling out onto the tartan. */}
        <h2 className="font-invite text-2xl sm:text-3xl text-ink mb-2 leading-tight break-words">
          {item.title}
        </h2>
        <div className="hairline-gold w-10 mb-3" />
        <p className="font-hand text-lg sm:text-xl text-ink-soft whitespace-pre-wrap break-words">
          {item.description}
        </p>
      </InvitationPanel>
    </StaggerItem>
  );
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
          layoutId="announce-tab"
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function Announcements() {
  const { user, authHeader } = useAuth();
  const [tab, setTab] = useState('feed');

  // Manage mode reveals a remove control on the viewer's own posts. Off by
  // default so the feed stays a feed — deleting is occasional, reading isn't.
  const [managing, setManaging] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  function fetchFirstPage() {
    setLoading(true);
    return fetch(`${API_URL}/api/announcements?limit=${PAGE_SIZE}&offset=0`)
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data) => { setItems(data.items || []); setTotal(data.total || 0); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/announcements?limit=${PAGE_SIZE}&offset=0`)
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    if (posting) return;
    setPostError(null);

    const title = postTitle.trim();
    const description = postDescription.trim();
    if (!title) { setPostError('Give it a title.'); return; }
    if (!description) { setPostError('Tell us more in the description.'); return; }

    setPosting(true);
    try {
      // No user_id in the body — the server takes the author from the token.
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      setPostTitle('');
      setPostDescription('');
      await fetchFirstPage();
      setTab('feed');
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  }

  /**
   * Delete one of your own posts.
   *
   * The row is removed from local state on success rather than refetching, so
   * the reader doesn't lose their scroll position or any pages they've loaded.
   * `total` is decremented to match, keeping "load more" honest.
   */
  async function handleDelete(aid) {
    if (deletingId) return;
    setDeleteError(null);
    setDeletingId(aid);
    try {
      const res = await fetch(`${API_URL}/api/announcements/${aid}`, {
        method: 'DELETE',
        headers: { ...authHeader },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      setItems((prev) => prev.filter((i) => i.aid !== aid));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/announcements?limit=${PAGE_SIZE}&offset=${items.length}`);
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

  const hasMore = items.length < total;
  const ownPostsLoaded = items.filter((i) => i.user_id === user?.user_id).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-3xl w-full mx-auto mb-8">
            <InvitationPanel variant="hero" className="text-center">
              <h1 className="font-invite text-display text-ink">Announcements</h1>
              <div className="hairline-gold w-32 mx-auto my-5" />
              <p className="font-hand text-2xl text-ink-soft">— the latest —</p>

              <div className="flex justify-center gap-2 mt-8 border-b border-rule/60">
                <Tab label="Feed" active={tab === 'feed'} onClick={() => setTab('feed')} />
                <Tab label="Post" active={tab === 'post'} onClick={() => setTab('post')} />
              </div>
            </InvitationPanel>
          </FadeIn>

          <div className="max-w-3xl w-full mx-auto">
            <AnimatePresence mode="wait">
              {tab === 'post' && (
                <motion.form
                  key="post"
                  onSubmit={handlePost}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <InvitationPanel variant="card" tilt={0.3} className="space-y-6">
                    <div>
                      <label htmlFor="announce-title" className={inviteLabelClass}>Title</label>
                      <input
                        id="announce-title"
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="A short headline…"
                        className={inviteInputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="announce-desc" className={inviteLabelClass}>Description</label>
                      <textarea
                        id="announce-desc"
                        rows={5}
                        value={postDescription}
                        onChange={(e) => setPostDescription(e.target.value)}
                        placeholder="The details…"
                        className="w-full bg-transparent border border-ink/30 focus:border-ink focus:outline-none focus:ring-0 font-hand text-2xl text-ink px-3 py-2 transition-colors"
                      />
                    </div>
                    {postError && (
                      <p className="font-hand text-xl text-seal text-center">{postError}</p>
                    )}
                    <div className="flex justify-center pt-1">
                      <button
                        type="submit"
                        disabled={posting}
                        className={inviteButtonClass}
                      >
                        {posting ? 'Posting…' : 'Post announcement'}
                      </button>
                    </div>
                  </InvitationPanel>
                </motion.form>
              )}

              {tab === 'feed' && (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Manage toggle — only shown once the viewer actually has a
                      post in the loaded feed, so it never appears as a control
                      with nothing to act on. */}
                  {ownPostsLoaded > 0 && (
                    <div className="flex justify-end mb-3">
                      <button
                        type="button"
                        onClick={() => { setManaging((m) => !m); setDeleteError(null); }}
                        aria-pressed={managing}
                        className={`inline-flex items-center gap-2 font-invite uppercase tracking-[0.2em] text-[0.7rem] px-3 py-1.5 transition-colors ${
                          managing
                            ? 'text-parchment bg-stone-900/70'
                            : 'text-parchment/80 hover:text-parchment bg-stone-950/40'
                        }`}
                      >
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11.2 2.6a1.4 1.4 0 0 1 2 2L6 11.8l-2.7.9.9-2.7z" />
                        </svg>
                        {managing ? 'Done' : 'Edit my posts'}
                      </button>
                    </div>
                  )}

                  {deleteError && (
                    <p className="font-hand text-xl text-red-200 text-center pb-3 drop-shadow">{deleteError}</p>
                  )}

                  {loading && (
                    <p className="font-hand text-2xl text-parchment text-center py-12 drop-shadow">
                      Loading…
                    </p>
                  )}
                  {!loading && !error && items.length === 0 && (
                    <p className="font-hand text-2xl text-parchment text-center py-12 drop-shadow">
                      No announcements yet.
                    </p>
                  )}
                  {error && (
                    <p className="font-hand text-xl text-red-200 text-center py-8 drop-shadow">{error}</p>
                  )}

                  {items.length > 0 && (
                    <StaggerGroup>
                      {items.map((item, i) => (
                        <AnnouncementCard
                          key={item.aid}
                          item={item}
                          tilt={i % 2 === 0 ? 0.3 : -0.3}
                          // Only your own posts get a control. The server
                          // enforces this too — this just avoids showing a
                          // button that would always fail.
                          canManage={managing && item.user_id === user?.user_id}
                          onDelete={handleDelete}
                          deleting={deletingId === item.aid}
                        />
                      ))}
                    </StaggerGroup>
                  )}

                  {hasMore && (
                    <div className="flex justify-center pt-4 pb-6">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className={inviteButtonClass}
                      >
                        {loadingMore ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
