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

function AnnouncementCard({ item, tilt }) {
  const author = { username: item.username, profile_pic_url: item.profile_pic_url };
  return (
    <StaggerItem>
      <InvitationPanel variant="card" tilt={tilt} className="mb-5 overflow-hidden">
        <header className="flex items-center gap-3 mb-4">
          <Avatar user={author} />
          <div className="flex-1 min-w-0">
            <p className="font-invite text-xl text-ink truncate">{item.username}</p>
            <p className="eyebrow">Posted {formatPosted(item.created_at)}</p>
          </div>
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
  const { user } = useAuth();
  const [tab, setTab] = useState('feed');

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
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, user_id: user.user_id }),
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
