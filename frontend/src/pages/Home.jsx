import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass, inviteButtonClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';
import { DAYS } from './Schedule.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EVENT_START = new Date('2026-09-03T16:00:00+01:00');

const NAV_CARDS = [
  { to: '/announcements',    icon: '', title: 'News',             subtitle: 'The latest word from the host.' },
  { to: '/schedule',         icon: '', title: 'Schedule',         subtitle: 'Five days, planned to the hour.' },
  { to: '/drinks',           icon: '', title: 'The Tally',        subtitle: 'Count pints, log spend.' },
  { to: '/leaderboard',      icon: '', title: 'Leaderboard',      subtitle: 'Who leads the charge.' },
  { to: '/travel',           icon: '', title: 'Travel',           subtitle: 'Rides and public transport.' },
  { to: '/packing',          icon: '', title: 'Packing',          subtitle: 'What to bring along.' },
  { to: '/rules',            icon: '', title: 'Rules',            subtitle: 'The lay of the land.' },
  { to: '/profile',          icon: '', title: 'Profile',          subtitle: 'Your details and travel plans.' },
];

// ─── Decorations ─────────────────────────────────────────────────────────────

function StarDivider() {
  return (
    <div className="font-invite tracking-[0.6em] text-stone-900 text-center my-8 select-none text-xl drop-shadow-[0_1px_0_rgba(247,241,227,0.9)]">
      ★ · ★ · ★
    </div>
  );
}

function WaxSeal() {
  return (
    <div className="flex justify-center -mt-6 mb-6 select-none">
      <div className="w-14 h-14 rounded-full bg-red-900 text-parchment text-stone-50 flex items-center justify-center shadow-lg rotate-[-8deg] ring-2 ring-red-950/60">
        <span className="font-invite text-2xl leading-none">★</span>
      </div>
    </div>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const ms = target.getTime() - now;
  return { ms, days: Math.floor(ms / 86_400_000), hours: Math.floor(ms / 3_600_000) };
}

function CountdownStrip() {
  const { ms, days, hours } = useCountdown(EVENT_START);
  let body;
  if (ms <= 0) {
    body = <>It's happening!</>;
  } else if (days < 1) {
    body = <><span className="font-invite text-3xl text-stone-900">{hours}</span> hours until the carriage rolls in.</>;
  } else {
    body = <><span className="font-invite text-3xl text-stone-900">{days}</span> days until the carriage rolls in.</>;
  }
  return (
    <div className="max-w-3xl w-full mx-auto bg-parchment shadow-md ring-1 ring-stone-300/60 px-5 py-3 rotate-[0.4deg] text-center font-hand text-xl text-stone-700 mb-6">
      {body}
    </div>
  );
}

// ─── Next event from schedule ────────────────────────────────────────────────

// Parse "Thursday 3rd September" + "20:00 – late" into an approximate start Date.
// The schedule uses 2026 dates encoded in the title; this function only needs
// to be precise enough to pick "what's coming next".
const MONTHS = { Sep: 8, September: 8 };

function parseDayDate(title) {
  // Match the day number (e.g. "3rd", "4th") and month
  const m = title.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)/i);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2]] ?? MONTHS[m[2].slice(0, 3)];
  if (month == null) return null;
  return new Date(2026, month, day);
}

function parseEventStart(dayTitle, timeStr) {
  const base = parseDayDate(dayTitle);
  if (!base) return null;
  const tm = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!tm) return base;
  base.setHours(Number(tm[1]), Number(tm[2]), 0, 0);
  return base;
}

function pickNextEvent() {
  const now = Date.now();
  for (const day of DAYS) {
    for (const event of day.events) {
      const start = parseEventStart(day.title, event.time);
      if (start && start.getTime() > now) {
        return { day, event, start };
      }
    }
  }
  // Fall back to the very first event (so we always render something pre-event)
  const first = DAYS[0];
  return { day: first, event: first.events[0], start: parseEventStart(first.title, first.events[0].time) };
}

function NextEventCard() {
  const next = pickNextEvent();
  if (!next) return null;
  return (
    <div className="max-w-3xl w-full mx-auto bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-5 sm:px-7 sm:py-6 rotate-[0.4deg] mb-6">
      <p className={inviteLabelClass}>Next on the schedule</p>
      <p className="font-invite text-2xl sm:text-3xl text-stone-900 mt-1">
        {next.day.title} · {next.event.time}
      </p>
      <p className="font-hand text-xl text-stone-800 mt-1">{next.event.text}</p>
    </div>
  );
}

// ─── Recent announcements peek ───────────────────────────────────────────────

function Avatar({ user, size = 'w-10 h-10' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ring-2 ring-stone-300/60 rounded-full overflow-hidden shrink-0 shadow-md`}>
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

function AnnouncementsPeek() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/announcements?limit=2&offset=0`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((data) => !cancelled && setItems(data.items || []))
      .catch(() => !cancelled && setItems([]));
    return () => { cancelled = true; };
  }, []);

  if (items === null) {
    return <div className="max-w-3xl w-full mx-auto opacity-60 font-hand text-xl text-stone-100 text-center drop-shadow mb-6">Loading the latest…</div>;
  }
  if (items.length === 0) return null;

  return (
    <section className="max-w-3xl w-full mx-auto mb-6">
      <p className={`${inviteLabelClass} text-center mb-3 text-stone-900 drop-shadow-[0_1px_0_rgba(247,241,227,0.9)] font-semibold`}>
        Fresh off the press
      </p>
      {items.map((item, i) => (
        <div
          key={item.aid}
          className={`bg-parchment shadow-md ring-1 ring-stone-300/60 px-5 py-3 mb-3 flex items-center gap-3 ${i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}`}
        >
          <Avatar user={{ username: item.username, profile_pic_url: item.profile_pic_url }} />
          <div className="flex-1 min-w-0">
            <p className="font-invite text-xl text-stone-900 truncate">{item.title}</p>
            <p className="font-hand text-base text-stone-700 truncate">{item.description}</p>
          </div>
        </div>
      ))}
      <div className="flex justify-center mt-2">
        <Link
          to="/announcements"
          className={`${inviteButtonClass} text-sm px-5 py-2`}
        >
          See all news →
        </Link>
      </div>
    </section>
  );
}

// ─── Travel chips ────────────────────────────────────────────────────────────

function TravelChips() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/users`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((users) => {
        if (cancelled) return;
        setStats({
          guests: users.length,
          drivers: users.filter((u) => u.driver).length,
          publicTransport: users.filter((u) => u.public_transport).length,
        });
      })
      .catch(() => !cancelled && setStats(null));
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const Chip = ({ count, label, tilt }) => (
    <div className={`bg-parchment shadow-md ring-1 ring-stone-300/60 px-5 py-3 ${tilt} text-center min-w-[7rem]`}>
      <p className="font-invite text-3xl text-stone-900 leading-none">{count}</p>
      <p className="font-hand text-base text-stone-600 mt-1">{label}</p>
    </div>
  );

  return (
    <section className="max-w-3xl w-full mx-auto flex flex-wrap justify-center gap-4 mb-6">
      <Chip count={stats.guests} label="guests confirmed" tilt="rotate-[-0.4deg]" />
      <Chip count={stats.drivers} label="drivers" tilt="rotate-[0.4deg]" />
      <Chip count={stats.publicTransport} label="on public transport" tilt="rotate-[-0.4deg]" />
    </section>
  );
}

// ─── Page primitives ─────────────────────────────────────────────────────────

function NavCard({ to, icon, title, subtitle, tilt }) {
  return (
    <Link
      to={to}
      className={`block bg-parchment shadow-lg ring-1 ring-stone-300/60 px-5 py-6 ${tilt} transition hover:shadow-xl hover:rotate-0`}
    >
      <div className="text-4xl leading-none mb-3">{icon}</div>
      <h3 className="font-invite text-2xl text-stone-900">{title}</h3>
      <p className="font-hand text-lg text-stone-600 mt-1">{subtitle}</p>
    </Link>
  );
}

function InfoRow({ item, tilt }) {
  return (
    <div className={`bg-parchment shadow-md ring-1 ring-stone-300/60 px-5 py-4 ${tilt} mb-4`}>
      <h3 className="font-invite text-2xl text-stone-900">{item.title}</h3>
      <p className="font-hand text-xl text-stone-800 mt-1 whitespace-pre-wrap">{item.body}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/info`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo([]));
  }, []);

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center p-6 sm:p-12">

        {/* Hero invitation */}
        <section className="max-w-3xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-8 py-12 sm:px-12 sm:py-14 rotate-[-0.4deg] text-center mb-2">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            You are cordially invited to
          </p>
          <h1 className="font-invite text-5xl sm:text-7xl text-stone-900 mt-2 leading-none">
            Matt's 21st
          </h1>
          <div className="border-t border-stone-400 w-32 mx-auto my-5" />
          <p className="font-hand text-2xl sm:text-3xl text-stone-700">
            Thursday 3rd – Monday 7th September 2026
          </p>
          <p className="font-hand text-xl sm:text-2xl text-stone-600 mt-1">
            Viewmount, Braemar, Scotland
          </p>
          {user?.username && (
            <p className="font-hand text-lg sm:text-xl text-stone-700 mt-6">
              Welcome, {user.username}.
            </p>
          )}
        </section>

        <WaxSeal />

        <CountdownStrip />
        <NextEventCard />

        <StarDivider />

        <TravelChips />
        <AnnouncementsPeek />

        {/* Event info */}
        {info && info.length > 0 && (
          <section className="max-w-3xl w-full mx-auto mb-2">
            <p className={`${inviteLabelClass} text-center mb-3 text-stone-900 drop-shadow-[0_1px_0_rgba(247,241,227,0.9)] font-semibold`}>
              The details
            </p>
            {info.map((item, i) => (
              <InfoRow
                key={item.id}
                item={item}
                tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
              />
            ))}
          </section>
        )}

        <StarDivider />

        {/* Nav grid */}
        <section className="max-w-4xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 [&>*:nth-child(odd)]:sm:mt-0 [&>*:nth-child(even)]:sm:mt-6">
          {NAV_CARDS.map((card, i) => (
            <NavCard
              key={card.to}
              {...card}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}
        </section>

      </main>
    </div>
  );
}
