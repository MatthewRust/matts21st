import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import { Flourish } from '../components/Flourish.jsx';
import {
  PageTransition, FadeIn, StaggerGroup, StaggerItem, motion, AnimatePresence,
} from '../components/MotionPrimitives.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Avatar({ user, size = 'w-16 h-16', ring = 'ring-2 ring-rule/60' }) {
  const [err, setErr] = useState(false);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-paper`}>
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

const MEDALS = {
  1: { label: 'I',   block: 'h-36', from: '#f3d77d', to: '#a98342', ring: 'ring-4 ring-[#c9a25b]', text: 'text-[#7b5b1b]' },
  2: { label: 'II',  block: 'h-24', from: '#dcd5cc', to: '#8a857d', ring: 'ring-4 ring-stone-400', text: 'text-stone-600' },
  3: { label: 'III', block: 'h-16', from: '#d99a6a', to: '#7d4a2a', ring: 'ring-4 ring-[#a87749]', text: 'text-[#8a4f24]' },
};

function PodiumSlot({ rank, user, drinkKey, delay = 0 }) {
  const m = MEDALS[rank];
  const avatarSize = rank === 1 ? 'w-24 h-24' : rank === 2 ? 'w-16 h-16' : 'w-14 h-14';

  return (
    <motion.div
      className="flex flex-col items-center w-1/3 max-w-[8rem]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
    >
      {rank === 1 && (
        <motion.svg viewBox="0 0 40 24" className="w-10 h-6 mb-1" aria-hidden="true">
          <path d="M2 6 L10 18 L14 4 L20 16 L26 4 L30 18 L38 6 L34 22 L6 22 Z"
                fill="#c9a25b" stroke="#7b5b1b" strokeWidth="0.6" />
        </motion.svg>
      )}
      <Avatar user={user} size={avatarSize} ring={m.ring} />
      <p className={`font-invite uppercase tracking-[0.32em] text-[0.7rem] mt-2 ${m.text}`}>
        {m.label}
      </p>
      <p className="font-hand text-xl text-ink leading-tight max-w-full text-center truncate w-full">
        {user.username}
      </p>
      <p className="font-invite text-lg text-ink-soft leading-tight num">{user[drinkKey]} 🍺</p>
      <div
        className={`w-full ${m.block} mt-3 rounded-t flex items-end justify-center pb-2 shadow-inner ring-1 ring-rule/40`}
        style={{ background: `linear-gradient(180deg, ${m.from} 0%, ${m.to} 100%)` }}
      >
        <span className="font-invite text-white text-3xl font-bold tracking-widest drop-shadow">
          {rank}
        </span>
      </div>
    </motion.div>
  );
}

function ListRow({ rank, user, drinkKey }) {
  return (
    <StaggerItem>
      <div className="flex items-center gap-4 border-b border-rule/40 py-3 last:border-0">
        <span className="font-invite text-ink-faint text-sm w-7 text-right shrink-0 num">{rank}.</span>
        <Avatar user={user} size="w-10 h-10" ring="ring-2 ring-rule/60" />
        <span className="font-hand text-2xl text-ink flex-1 truncate">{user.username}</span>
        <span className="font-invite text-ink-soft text-base shrink-0 num">{user[drinkKey]} 🍺</span>
      </div>
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
          layoutId="leaderboard-tab"
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

function Board({ sorted, drinkKey }) {
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (sorted.length === 0) {
    return (
      <p className="font-hand text-2xl text-ink-faint text-center py-12">
        No guests yet — be the first to sign up!
      </p>
    );
  }

  return (
    <>
      <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
        {top3[1] && <PodiumSlot rank={2} user={top3[1]} drinkKey={drinkKey} delay={0.05} />}
        {top3[0] && <PodiumSlot rank={1} user={top3[0]} drinkKey={drinkKey} delay={0} />}
        {top3[2] && <PodiumSlot rank={3} user={top3[2]} drinkKey={drinkKey} delay={0.1} />}
      </div>

      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 hairline-gold" />
            <span className="eyebrow text-gold">The rest</span>
            <div className="flex-1 hairline-gold" />
          </div>
          <StaggerGroup>
            {rest.map((u, i) => (
              <ListRow key={u.user_id} rank={i + 4} user={u} drinkKey={drinkKey} />
            ))}
          </StaggerGroup>
        </>
      )}
    </>
  );
}

export default function Leaderboard() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('daily');

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  const sorted = useMemo(() => {
    if (!users) return [];
    const key = tab === 'daily' ? 'daily_drinks' : 'total_drinks';
    return [...users].sort((a, b) => b[key] - a[key] || a.username.localeCompare(b.username));
  }, [users, tab]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex items-start justify-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="mx-auto max-w-2xl w-full">
            <InvitationPanel variant="hero" className="px-7 py-9 sm:px-12 sm:py-12">
              <div className="text-center mb-8">
                <p className="eyebrow">Who's ahead</p>
                <h1 className="font-invite text-display text-ink mt-2">Leaderboard</h1>
                <div className="hairline-gold w-32 mx-auto my-4" />
                <p className="font-hand text-2xl text-ink-soft">— every pint counted —</p>
              </div>

              <div className="flex justify-center gap-2 mb-10 border-b border-rule/60">
                <Tab label="Today" active={tab === 'daily'} onClick={() => setTab('daily')} />
                <Tab label="All Time" active={tab === 'total'} onClick={() => setTab('total')} />
              </div>

              {!users && !error && (
                <p className="font-hand text-2xl text-ink-faint text-center py-12">Loading…</p>
              )}
              {error && (
                <p className="font-hand text-xl text-seal text-center py-8">{error}</p>
              )}
              <AnimatePresence mode="wait">
                {users && (
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Board sorted={sorted} drinkKey={tab === 'daily' ? 'daily_drinks' : 'total_drinks'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </InvitationPanel>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
