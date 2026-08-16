import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import InvitationPanel, { MotionPanel } from '../components/InvitationPanel.jsx';
import { Flourish, WaxSeal } from '../components/Flourish.jsx';
import {
  PageTransition, FadeIn, StaggerGroup, StaggerItem, motion, AnimatePresence,
} from '../components/MotionPrimitives.jsx';
import { inviteButtonClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';
import { DAYS } from './Schedule.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EVENT_START = new Date('2026-09-03T16:00:00+01:00');

const NAV_CARDS = [
  { to: '/announcements', title: 'News',        subtitle: 'The latest updates.' },
  { to: '/schedule',      title: 'Schedule',    subtitle: "What's on, day by day." },
  // Shelved for now — the routes are redirected in App.jsx too.
  // { to: '/drinks',        title: 'The Tally',   subtitle: 'Count pints, log spend.' },
  // { to: '/leaderboard',   title: 'Leaderboard', subtitle: "Who's drinking the most." },
  { to: '/travel',        title: 'Travel',      subtitle: 'Lifts and public transport.' },
  { to: '/packing',       title: 'Packing',     subtitle: 'What to bring.' },
  { to: '/rules',         title: 'Rules',       subtitle: 'House rules.' },
  { to: '/profile',       title: 'Profile',     subtitle: 'Your details and travel plans.' },
];

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

function Countdown() {
  const { ms, days, hours } = useCountdown(EVENT_START);

  if (ms <= 0) {
    return (
      <InvitationPanel variant="strip" className="text-center font-hand text-2xl text-ink">
        It's happening!
      </InvitationPanel>
    );
  }

  const big = days >= 1 ? days : hours;
  const unit = days >= 1 ? 'days' : 'hours';

  return (
    <InvitationPanel variant="strip" className="text-center">
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <span className="eyebrow hidden sm:inline">Until Braemar</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={big}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="font-invite text-4xl sm:text-5xl text-ink num leading-none"
          >
            {big}
          </motion.span>
        </AnimatePresence>
        <span className="font-hand text-xl sm:text-2xl text-ink-soft">{unit}</span>
        <span className="eyebrow sm:hidden">to go</span>
      </div>
    </InvitationPanel>
  );
}

// ─── Next event from schedule ────────────────────────────────────────────────

const MONTHS = { Sep: 8, September: 8 };

function parseDayDate(title) {
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
  const first = DAYS[0];
  return { day: first, event: first.events[0], start: parseEventStart(first.title, first.events[0].time) };
}

function NextEventCard() {
  const next = pickNextEvent();
  if (!next) return null;
  return (
    <InvitationPanel variant="card" className="text-center">
      <p className="eyebrow">Next up</p>
      <p className="font-invite text-3xl sm:text-4xl text-ink mt-2">
        {next.day.title.replace(/ - .*$/, '')}
      </p>
      <p className="font-invite text-lg sm:text-xl text-ink-soft mt-1 num">
        {next.event.time}
      </p>
      <div className="hairline-gold w-24 mx-auto my-4" />
      <p className="font-hand text-2xl text-ink-soft">{next.event.text}</p>
    </InvitationPanel>
  );
}

// ─── Recent announcements peek ───────────────────────────────────────────────

function Avatar({ user, size = 'w-10 h-10' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ring-2 ring-rule/60 rounded-full overflow-hidden shrink-0 shadow-paper`}>
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

  if (items === null || items.length === 0) return null;

  return (
    <FadeIn className="max-w-3xl w-full mx-auto">
      <div className="text-center mb-4">
        <p className="eyebrow text-parchment/90 drop-shadow">Latest news</p>
      </div>
      <StaggerGroup className="space-y-3">
        {items.map((item) => (
          <StaggerItem key={item.aid}>
            <InvitationPanel
              variant="row"
              className="flex items-center gap-4"
            >
              <Avatar user={{ username: item.username, profile_pic_url: item.profile_pic_url }} />
              <div className="flex-1 min-w-0">
                <p className="font-invite text-xl sm:text-2xl text-ink truncate">{item.title}</p>
                <p className="font-hand text-lg text-ink-soft truncate">{item.description}</p>
              </div>
            </InvitationPanel>
          </StaggerItem>
        ))}
      </StaggerGroup>
      <div className="flex justify-center mt-5">
        <Link to="/announcements" className={`${inviteButtonClass} text-sm px-5 py-2`}>
          See all news →
        </Link>
      </div>
    </FadeIn>
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

  const Chip = ({ count, label }) => (
    <StaggerItem className="flex-1 min-w-[7rem]">
      <InvitationPanel variant="strip" className="text-center">
        <p className="font-invite text-4xl text-ink num leading-none">{count}</p>
        <p className="eyebrow mt-2">{label}</p>
      </InvitationPanel>
    </StaggerItem>
  );

  return (
    <StaggerGroup className="max-w-3xl w-full mx-auto flex flex-wrap justify-center gap-4">
      <Chip count={stats.guests} label="Guests" />
      <Chip count={stats.drivers} label="Drivers" />
      <Chip count={stats.publicTransport} label="By rail" />
    </StaggerGroup>
  );
}

// ─── Nav card grid ───────────────────────────────────────────────────────────

function NavCard({ to, title, subtitle, tilt }) {
  return (
    <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm">
      <MotionPanel tilt={tilt} variant="card" className="h-full">
        <h3 className="font-invite text-2xl sm:text-3xl text-ink leading-tight">{title}</h3>
        <div className="hairline-gold w-10 my-3" />
        <p className="font-hand text-lg text-ink-soft">{subtitle}</p>
        <p className="eyebrow mt-4 text-gold">Open</p>
      </MotionPanel>
    </Link>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({ item, tilt }) {
  return (
    <StaggerItem>
      <InvitationPanel variant="card" tilt={tilt}>
        <h3 className="font-invite text-2xl sm:text-3xl text-ink">{item.title}</h3>
        <div className="hairline-gold w-10 my-3" />
        <p className="font-hand text-xl text-ink-soft whitespace-pre-wrap">{item.body}</p>
      </InvitationPanel>
    </StaggerItem>
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
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <main className="flex flex-col items-center px-5 sm:px-10 pb-16 pt-8 sm:pt-12">

          {/* Hero invitation */}
          <FadeIn y={20} className="max-w-3xl w-full mx-auto relative">
            <InvitationPanel variant="hero" className="text-center overflow-hidden">
              <p className="eyebrow">You're invited to</p>
              <h1 className="font-invite font-medium text-ink mt-3 leading-[0.92] text-hero">
                Matthew's <span className="italic text-seal">21<span className="text-[0.6em] align-super">st</span></span>
              </h1>
              <div className="hairline-gold w-40 mx-auto my-6" />
              <p className="font-hand text-2xl sm:text-3xl text-ink-soft">
                Thursday 3<sup>rd</sup> — Monday 7<sup>th</sup> September 2026
              </p>
              <p className="font-hand text-xl sm:text-2xl text-ink-faint mt-1">
                Viewmount House · Braemar · Scotland
              </p>
              {user?.username && (
                <p className="font-hand text-lg sm:text-xl text-ink-soft mt-8">
                  Welcome, <span className="italic">{user.username}</span>.
                </p>
              )}
            </InvitationPanel>

            {/* Wax seal overlapping the hero card.
                Smaller on phones: at 88px it reached 60px above the card's
                bottom edge, past the 48px of padding, and sat on top of the
                "Welcome, name" line. 64px clears it. */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 sm:-bottom-8">
              <WaxSeal sizeClass="w-16 h-16 sm:w-[88px] sm:h-[88px]" />
            </div>
          </FadeIn>

          {/* Countdown + Next event */}
          <FadeIn delay={0.1} className="max-w-3xl w-full mx-auto mt-16 mb-4">
            <Countdown />
          </FadeIn>
          <FadeIn delay={0.15} className="max-w-3xl w-full mx-auto mb-2">
            <NextEventCard />
          </FadeIn>

          <Flourish />

          <TravelChips />

          <div className="h-10" />
          <AnnouncementsPeek />

          {/* Event info */}
          {info && info.length > 0 && (
            <FadeIn className="max-w-3xl w-full mx-auto mt-12">
              <div className="text-center mb-5">
                <p className="eyebrow text-parchment/90 drop-shadow">The details</p>
              </div>
              <StaggerGroup className="space-y-4">
                {info.map((item, i) => (
                  <InfoRow
                    key={item.id}
                    item={item}
                    tilt={i % 2 === 0 ? 0.3 : -0.3}
                  />
                ))}
              </StaggerGroup>
            </FadeIn>
          )}

          <Flourish />

          {/* The house — links out to the cottage listing */}
          <FadeIn className="max-w-3xl w-full mx-auto">
            <a
              href="https://www.unique-cottages.co.uk/cottages/highlands/aberdeen-morayshire/hd8-viewmount-house"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <InvitationPanel variant="strip" lift className="text-center">
                <p className="eyebrow text-gold">The house</p>
                <p className="font-invite text-2xl sm:text-3xl text-ink mt-1">
                  See where we're going
                </p>
              </InvitationPanel>
            </a>
          </FadeIn>

          <Flourish />

          {/* Nav grid */}
          <FadeIn className="max-w-5xl w-full mx-auto">
            <div className="text-center mb-6">
              <p className="eyebrow text-parchment/90 drop-shadow">Everything else</p>
            </div>
            <StaggerGroup
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              stagger={0.05}
            >
              {NAV_CARDS.map((card, i) => (
                <StaggerItem key={card.to}>
                  <NavCard {...card} tilt={i % 2 === 0 ? 0.3 : -0.3} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </FadeIn>

        </main>
      </div>
    </PageTransition>
  );
}
