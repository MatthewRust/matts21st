import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'w-16 h-16', ring = 'ring-2 ring-stone-400/50' }) {
  const [err, setErr] = useState(false);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-md`}>
      {!err ? (
        <img
          src={resolveAvatar(user.profile_pic_url)}
          alt={user.username}
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

// ─── Podium slot ─────────────────────────────────────────────────────────────

const MEDALS = {
  1: { label: '1st', block: 'h-32', bg: 'bg-amber-400',  ring: 'ring-4 ring-amber-400',  text: 'text-amber-700', crown: '👑' },
  2: { label: '2nd', block: 'h-20', bg: 'bg-stone-400',  ring: 'ring-4 ring-stone-400',  text: 'text-stone-500', crown: '🥈' },
  3: { label: '3rd', block: 'h-12', bg: 'bg-amber-700',  ring: 'ring-4 ring-amber-700',  text: 'text-amber-800', crown: '🥉' },
};

function PodiumSlot({ rank, user, drinkKey }) {
  const m = MEDALS[rank];
  const avatarSize = rank === 1 ? 'w-20 h-20' : rank === 2 ? 'w-16 h-16' : 'w-14 h-14';

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-xl">{m.crown}</div>
      <Avatar user={user} size={avatarSize} ring={m.ring} />
      <p className={`font-invite uppercase tracking-widest text-xs mt-2 ${m.text}`}>{m.label}</p>
      <p className="font-hand text-xl text-stone-900 leading-tight max-w-[100px] text-center truncate">
        {user.username}
      </p>
      <p className="font-invite text-lg text-stone-700 leading-tight">{user[drinkKey]} 🍺</p>
      <div className={`w-24 sm:w-28 ${m.block} ${m.bg} mt-3 rounded-t flex items-center justify-center shadow-inner`}>
        <span className="font-invite text-white text-3xl font-bold">{rank}</span>
      </div>
    </div>
  );
}

// ─── Rest-of-list row ─────────────────────────────────────────────────────────

function ListRow({ rank, user, drinkKey }) {
  return (
    <div className="flex items-center gap-4 border-b border-stone-200 py-3 last:border-0">
      <span className="font-invite text-stone-500 text-sm w-6 text-right shrink-0">{rank}.</span>
      <Avatar user={user} size="w-10 h-10" ring="ring-2 ring-stone-300/60" />
      <span className="font-hand text-2xl text-stone-800 flex-1 truncate">{user.username}</span>
      <span className="font-invite text-stone-700 text-base shrink-0">{user[drinkKey]} 🍺</span>
    </div>
  );
}

// ─── Tab button ──────────────────────────────────────────────────────────────

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

// ─── Board (shared podium + list) ────────────────────────────────────────────

function Board({ sorted, drinkKey }) {
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (sorted.length === 0) {
    return (
      <p className="font-hand text-2xl text-stone-500 text-center py-12">
        No guests yet — be the first to sign up!
      </p>
    );
  }

  return (
    <>
      {/* Podium: 2nd left, 1st centre, 3rd right, aligned at bottom */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
        {top3[1] && <PodiumSlot rank={2} user={top3[1]} drinkKey={drinkKey} />}
        {top3[0] && <PodiumSlot rank={1} user={top3[0]} drinkKey={drinkKey} />}
        {top3[2] && <PodiumSlot rank={3} user={top3[2]} drinkKey={drinkKey} />}
      </div>

      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-stone-300" />
            <span className="font-invite tracking-widest uppercase text-xs text-stone-400">
              The rest
            </span>
            <div className="flex-1 border-t border-stone-300" />
          </div>
          <div>
            {rest.map((u, i) => (
              <ListRow key={u.user_id} rank={i + 4} user={u} drinkKey={drinkKey} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [users, setUsers]   = useState(null);
  const [error, setError]   = useState(null);
  const [tab, setTab]       = useState('daily'); // 'daily' | 'total'

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  // Re-sort when tab changes — keeps original fetch result intact
  const sorted = useMemo(() => {
    if (!users) return [];
    const key = tab === 'daily' ? 'daily_drinks' : 'total_drinks';
    return [...users].sort((a, b) => b[key] - a[key] || a.username.localeCompare(b.username));
  }, [users, tab]);

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-start justify-center p-6 sm:p-12">
        <div className="mx-auto max-w-2xl w-full rotate-[0.5deg] bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-8 py-10 sm:px-12 sm:py-14">

          {/* Heading */}
          <div className="text-center mb-8">
            <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
              The Honours Board
            </p>
            <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">
              Leaderboard
            </h1>
            <p className="font-hand text-2xl text-stone-600 mt-1">
              — every pint counted —
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8 border-b border-stone-200">
            <Tab label="Today" active={tab === 'daily'} onClick={() => setTab('daily')} />
            <Tab label="All Time" active={tab === 'total'} onClick={() => setTab('total')} />
          </div>

          {/* Content */}
          {!users && !error && (
            <p className="font-hand text-2xl text-stone-500 text-center py-12">Loading…</p>
          )}
          {error && (
            <p className="font-hand text-xl text-red-800 text-center py-8">{error}</p>
          )}
          {users && (
            <Board sorted={sorted} drinkKey={tab === 'daily' ? 'daily_drinks' : 'total_drinks'} />
          )}

        </div>
      </div>
    </div>
  );
}
