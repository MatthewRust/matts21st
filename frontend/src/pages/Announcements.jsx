import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass, inviteButtonClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

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

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

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
        <div className="max-w-3xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            From the host
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Announcements</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— the latest word —</p>
        </div>

        <div className="max-w-3xl w-full mx-auto">
          {loading && (
            <p className="font-hand text-2xl text-parchment text-stone-100 text-center py-12 drop-shadow">
              Loading…
            </p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="font-hand text-2xl text-parchment text-stone-100 text-center py-12 drop-shadow">
              No announcements yet.
            </p>
          )}
          {error && (
            <p className="font-hand text-xl text-red-200 text-center py-8 drop-shadow">{error}</p>
          )}

          {items.map((item, i) => (
            <AnnouncementCard
              key={item.aid}
              item={item}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}

          {hasMore && (
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
