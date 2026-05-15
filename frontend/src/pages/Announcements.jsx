import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass, inviteButtonClass, inviteInputClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE_SIZE = 5;

function Avatar({ user, size = 'w-10 h-10', ring = 'ring-2 ring-stone-300/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-md`}>
      {!err && src ? (
        <img
          src={src}
          alt={user?.username ?? 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
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
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AnnouncementCard({ item, tilt }) {
  const author = { username: item.username, profile_pic_url: item.profile_pic_url };
  return (
    <article
      className={`bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-5 sm:px-7 sm:py-6 ${tilt} mb-6`}
    >
      <header className="flex items-center gap-3 mb-3">
        <Avatar user={author} />
        <div className="flex-1 min-w-0">
          <p className="font-hand text-xl text-stone-900 truncate">{item.username}</p>
          <p className={inviteLabelClass}>Posted {formatPosted(item.created_at)}</p>
        </div>
      </header>
      <h2 className="font-invite text-3xl text-stone-900 mb-2">{item.title}</h2>
      <p className="font-hand text-xl text-stone-800 whitespace-pre-wrap">{item.description}</p>
    </article>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        font-invite uppercase tracking-[0.25em] text-sm px-6 py-2 transition
        border-b-2
        ${active
          ? 'text-stone-900 border-stone-800'
          : 'text-stone-400 border-transparent hover:text-stone-600 hover:border-stone-300'
        }
      `}
    >
      {label}
    </button>
  );
}

export default function Announcements() {
  const { user } = useAuth();
  const [tab, setTab] = useState('feed'); // 'feed' | 'post'

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
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/announcements?limit=${PAGE_SIZE}&offset=0`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
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
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 sm:p-12">
        <div className="max-w-3xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-6">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            From the host
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Announcements</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— the latest word —</p>

          <div className="flex justify-center gap-2 mt-6 border-b border-stone-200">
            <Tab label="Feed" active={tab === 'feed'} onClick={() => setTab('feed')} />
            <Tab label="Post" active={tab === 'post'} onClick={() => setTab('post')} />
          </div>
        </div>

        <div className="max-w-3xl w-full mx-auto">
          {tab === 'post' && (
            <form
              onSubmit={handlePost}
              className="bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-6 sm:px-8 sm:py-8 rotate-[0.3deg] space-y-5"
            >
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
                  placeholder="The full word…"
                  className="w-full bg-transparent border border-stone-700 focus:border-stone-900 focus:outline-none focus:ring-0 font-hand text-2xl text-stone-800 px-2 py-2"
                />
              </div>
              {postError && (
                <p className="font-hand text-xl text-red-800 text-center">{postError}</p>
              )}
              <div className="flex justify-center pt-1">
                <button
                  type="submit"
                  disabled={posting}
                  className={`${inviteButtonClass} ${posting ? 'opacity-60 cursor-wait' : ''}`}
                >
                  {posting ? 'Posting…' : 'Post announcement'}
                </button>
              </div>
            </form>
          )}

          {tab === 'feed' && loading && (
            <p className="font-hand text-2xl text-parchment text-stone-100 text-center py-12 drop-shadow">
              Loading…
            </p>
          )}
          {tab === 'feed' && !loading && !error && items.length === 0 && (
            <p className="font-hand text-2xl text-parchment text-stone-100 text-center py-12 drop-shadow">
              No announcements yet.
            </p>
          )}
          {tab === 'feed' && error && (
            <p className="font-hand text-xl text-red-200 text-center py-8 drop-shadow">{error}</p>
          )}

          {tab === 'feed' && items.map((item, i) => (
            <AnnouncementCard
              key={item.aid}
              item={item}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}

          {tab === 'feed' && hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className={`${inviteButtonClass} ${loadingMore ? 'opacity-60 cursor-wait' : ''}`}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
